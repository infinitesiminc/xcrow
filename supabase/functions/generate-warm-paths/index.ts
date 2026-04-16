// Generates top 3 warm intro paths for a target lead by reasoning over the user's network.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { workspaceKey, lead, forceRegenerate } = await req.json();
    if (!workspaceKey || !lead) {
      return new Response(JSON.stringify({ error: "workspaceKey and lead required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Cache check
    if (lead.id && !forceRegenerate) {
      const { data: cached } = await supabase
        .from("warm_paths")
        .select("paths")
        .eq("user_id", user.id)
        .eq("lead_id", lead.id)
        .maybeSingle();
      if (cached?.paths) {
        return new Response(JSON.stringify({ paths: cached.paths, cached: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Load network
    const { data: network } = await supabase
      .from("user_network")
      .select("category, name, company, notes")
      .eq("user_id", user.id)
      .eq("workspace_key", workspaceKey);

    const grouped: Record<string, any[]> = { customer: [], investor: [], partner: [], team: [] };
    (network || []).forEach((n) => grouped[n.category]?.push(n));

    const networkBlock = (["customer", "investor", "partner", "team"] as const)
      .map((cat) => {
        const items = grouped[cat];
        if (!items?.length) return `- ${cat.toUpperCase()}: (none)`;
        return `- ${cat.toUpperCase()}:\n` + items.map((i) => `  • ${i.name}${i.company ? ` @ ${i.company}` : ""}${i.notes ? ` — ${i.notes}` : ""}`).join("\n");
      }).join("\n");

    const prompt = `You are a B2B sales strategist generating warm intro paths.

USER'S NETWORK (workspace: ${workspaceKey}):
${networkBlock}

TARGET LEAD:
- Name: ${lead.name}
- Title: ${lead.title || "unknown"}
- Company: ${lead.company || "unknown"}
- Persona: ${lead.persona_tag || "unknown"}
- Reason of fit: ${lead.reason || lead.summary || "n/a"}

Generate the TOP 3 warm intro paths. Reason about realistic connection vectors: shared investors, board overlaps, partner ecosystems, alumni networks, customer relationships, mutual portfolio companies. Rank by likelihood. If the network is sparse, suggest cold-but-strategic angles instead (e.g. "engage via shared investor X" only if X is plausibly connected to ${lead.company}).`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{
          type: "function",
          function: {
            name: "return_intro_paths",
            description: "Return ranked warm intro paths",
            parameters: {
              type: "object",
              properties: {
                paths: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      rank: { type: "integer" },
                      title: { type: "string", description: "Short headline (e.g. 'Via shared investor Sequoia')" },
                      confidence: { type: "string", enum: ["high", "medium", "low"] },
                      description: { type: "string", description: "1-2 sentence rationale" },
                      bridge_contacts: { type: "array", items: { type: "string" }, description: "Named people/entities from the user's network used to bridge" },
                      action_steps: { type: "array", items: { type: "string" }, description: "3 concrete steps to execute this path" },
                    },
                    required: ["rank", "title", "confidence", "description", "bridge_contacts", "action_steps"],
                  },
                  minItems: 3,
                  maxItems: 3,
                },
              },
              required: ["paths"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "return_intro_paths" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway failed", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "AI generation failed", details: txt }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { paths: [] };
    const paths = args.paths || [];

    // Cache
    if (lead.id && paths.length > 0) {
      await supabase.from("warm_paths").upsert({
        user_id: user.id,
        lead_id: lead.id,
        workspace_key: workspaceKey,
        paths,
      }, { onConflict: "user_id,lead_id" });
    }

    return new Response(JSON.stringify({ paths, cached: false }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("generate-warm-paths error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
