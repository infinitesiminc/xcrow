import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { vertical_id: filterVerticalId } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get vertical map data - optionally filter by vertical_id
    let query = supabase
      .from("company_vertical_map")
      .select("vertical_id, vertical_name, sub_vertical, role, companies(name, description, industry)")
      .order("vertical_id");
    if (filterVerticalId) query = query.eq("vertical_id", filterVerticalId);
    const { data: mapData, error: mapErr } = await query;

    if (mapErr) throw mapErr;

    // Aggregate into sub-verticals
    interface SubVerticalInfo {
      vertical_id: number;
      vertical_name: string;
      sub_vertical: string;
      incumbents: string[];
      disruptors: string[];
    }

    const subVerticals: Record<string, SubVerticalInfo> = {};

    for (const row of mapData || []) {
      const sv = row.sub_vertical || "General";
      const key = `${row.vertical_id}::${sv}`;
      if (!subVerticals[key]) {
        subVerticals[key] = {
          vertical_id: row.vertical_id,
          vertical_name: row.vertical_name,
          sub_vertical: sv,
          incumbents: [],
          disruptors: [],
        };
      }
      const entry = subVerticals[key];
      const company = row.companies as any;
      const name = company?.name || "Unknown";
      if (row.role === "incumbent" && !entry.incumbents.includes(name)) entry.incumbents.push(name);
      if (row.role === "disruptor" && !entry.disruptors.includes(name)) entry.disruptors.push(name);
    }

    const svList = Object.values(subVerticals);
    const batchSize = svList.length > 50 ? 15 : 5;
    const results: any[] = [];

    for (let i = 0; i < svList.length; i += batchSize) {
      const batch = svList.slice(i, i + batchSize);

      const prompt = `Analyze these software sub-verticals for autonomous AI agent disruption. For each, score 0-100 how vulnerable workflows are to full agent automation, identify specific automatable workflows, and suggest an "Agent Play" (one-line startup thesis for an AI-native product).

${batch.map(sv => `Sub-vertical: "${sv.sub_vertical}" (parent: ${sv.vertical_name})
Incumbents: ${sv.incumbents.slice(0, 6).join(", ") || "None"}
Disruptors: ${sv.disruptors.slice(0, 4).join(", ") || "None"}`).join("\n\n")}`;

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
              content: "You are an AI industry analyst specializing in autonomous AI agents disrupting software markets. Return structured analysis via the provided tool."
            },
            { role: "user", content: prompt }
          ],
          tools: [{
            type: "function",
            function: {
              name: "score_subverticals",
              description: "Score sub-verticals for AI agent disruption vulnerability",
              parameters: {
                type: "object",
                properties: {
                  scores: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        sub_vertical: { type: "string" },
                        agent_score: { type: "integer", description: "0-100 vulnerability score" },
                        verdict: { type: "string", description: "One sentence on agent disruption potential" },
                        automatable_workflows: {
                          type: "array",
                          items: {
                            type: "object",
                            properties: {
                              name: { type: "string", description: "Workflow name e.g. 'Lead qualification'" },
                              automation_level: { type: "string", enum: ["full", "partial", "augmented"], description: "How much can be automated" },
                              description: { type: "string", description: "What the agent would do" },
                            },
                            required: ["name", "automation_level", "description"],
                            additionalProperties: false,
                          },
                          description: "2-4 specific workflows agents could automate"
                        },
                        agent_play: { type: "string", description: "One-line AI-native startup thesis for this niche" },
                        workflow_types: {
                          type: "array",
                          items: { type: "string" },
                          description: "Workflow categories: data-processing, communication, scheduling, reporting, content-creation, analysis, orchestration"
                        }
                      },
                      required: ["sub_vertical", "agent_score", "verdict", "automatable_workflows", "agent_play", "workflow_types"],
                      additionalProperties: false,
                    }
                  }
                },
                required: ["scores"],
                additionalProperties: false,
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "score_subverticals" } },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error(`AI gateway error: ${aiResp.status}`, errText);
        if (aiResp.status === 429) {
          await new Promise(r => setTimeout(r, 5000));
          i -= batchSize;
          continue;
        }
        throw new Error(`AI gateway error: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) {
        const parsed = JSON.parse(toolCall.function.arguments);
        // Attach vertical info
        for (const score of parsed.scores) {
          const match = batch.find(b => b.sub_vertical === score.sub_vertical);
          if (match) {
            score.vertical_id = match.vertical_id;
            score.vertical_name = match.vertical_name;
          }
        }
        results.push(...parsed.scores);
      }

      if (i + batchSize < svList.length) {
        await new Promise(r => setTimeout(r, 1500));
      }
    }

    // Upsert results
    for (const score of results) {
      if (!score.vertical_id) continue;
      const { error: upsertErr } = await supabase
        .from("subvertical_agent_scores")
        .upsert({
          vertical_id: score.vertical_id,
          vertical_name: score.vertical_name,
          sub_vertical: score.sub_vertical,
          agent_score: score.agent_score,
          agent_verdict: score.verdict,
          automatable_workflows: score.automatable_workflows,
          agent_play: score.agent_play,
          workflow_types: score.workflow_types,
          scored_at: new Date().toISOString(),
        }, { onConflict: "vertical_id,sub_vertical" });

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
