import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all verticals with their sub-verticals and company counts
    const { data: mapData, error: mapErr } = await supabase
      .from("company_vertical_map")
      .select("vertical_id, vertical_name, sub_vertical, role, companies(name, description, industry)")
      .order("vertical_id");

    if (mapErr) throw mapErr;

    // Aggregate verticals
    const verticals: Record<number, {
      id: number; name: string;
      subVerticals: string[];
      incumbents: string[];
      disruptors: string[];
    }> = {};

    for (const row of mapData || []) {
      const vid = row.vertical_id;
      if (!verticals[vid]) {
        verticals[vid] = { id: vid, name: row.vertical_name, subVerticals: [], incumbents: [], disruptors: [] };
      }
      const v = verticals[vid];
      const sv = row.sub_vertical || "General";
      if (!v.subVerticals.includes(sv)) v.subVerticals.push(sv);

      const company = row.companies as any;
      const companyName = company?.name || "Unknown";
      if (row.role === "incumbent" && !v.incumbents.includes(companyName)) v.incumbents.push(companyName);
      if (row.role === "disruptor" && !v.disruptors.includes(companyName)) v.disruptors.push(companyName);
    }

    const verticalList = Object.values(verticals);

    // Score in batches of 3 to avoid rate limits
    const batchSize = 3;
    const results: any[] = [];

    for (let i = 0; i < verticalList.length; i += batchSize) {
      const batch = verticalList.slice(i, i + batchSize);

      const prompt = `Analyze these software verticals for autonomous AI agent disruption potential. For each vertical, score 0-100 how vulnerable the incumbent workflows are to replacement by autonomous AI agents (not just AI tools, but fully autonomous agent systems that can replace human workflows end-to-end).

Consider:
- How much of the workflow is structured/repetitive vs creative/strategic
- Whether the domain involves data processing, communication, scheduling, reporting (high agent potential)
- Whether the domain requires deep human judgment, physical presence, or complex interpersonal skills (low agent potential)
- How much of incumbent value comes from workflow orchestration that agents could automate

Return a JSON array with one object per vertical:

${batch.map(v => `Vertical: "${v.name}"
Sub-verticals: ${v.subVerticals.join(", ")}
Key incumbents: ${v.incumbents.slice(0, 8).join(", ")}
Key disruptors: ${v.disruptors.slice(0, 5).join(", ")}`).join("\n\n")}`;

      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: "You are an AI industry analyst specializing in autonomous AI agents and their potential to disrupt software markets. Return ONLY valid JSON arrays."
            },
            { role: "user", content: prompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_verticals",
              description: "Score verticals for AI agent disruption vulnerability",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        vertical_name: { type: "string" },
                        agent_score: { type: "integer", description: "0-100 vulnerability score" },
                        verdict: { type: "string", description: "One sentence verdict on agent disruption potential" },
                        key_opportunities: {
                          type: "array",
                          items: { type: "string" },
                          description: "2-3 specific workflow areas ripe for agent takeover"
                        },
                        workflow_types: {
                          type: "array",
                          items: { type: "string" },
                          description: "Types of workflows agents could automate: data-processing, communication, scheduling, reporting, content-creation, analysis"
                        }
                      },
                      required: ["vertical_name", "agent_score", "verdict", "key_opportunities", "workflow_types"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["scores"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "score_verticals" } },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error(`AI gateway error: ${aiResp.status}`, errText);
        if (aiResp.status === 429) {
          // Wait and retry
          await new Promise(r => setTimeout(r, 5000));
          i -= batchSize; // retry this batch
          continue;
        }
        throw new Error(`AI gateway error: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        results.push(...parsed.scores);
      }

      // Small delay between batches
      if (i + batchSize < verticalList.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // Upsert results
    for (const score of results) {
      const vertical = verticalList.find(v => v.name === score.vertical_name);
      if (!vertical) continue;

      const { error: upsertErr } = await supabase
        .from("vertical_agent_scores")
        .upsert({
          vertical_id: vertical.id,
          vertical_name: score.vertical_name,
          agent_score: score.agent_score,
          agent_verdict: score.verdict,
          key_opportunities: score.key_opportunities,
          workflow_types: score.workflow_types,
          scored_at: new Date().toISOString(),
        }, { onConflict: "vertical_id" });

      if (upsertErr) console.error("Upsert error:", upsertErr);
    }

    return new Response(JSON.stringify({ scored: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
