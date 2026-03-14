import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobTitle, tasks, skills } = await req.json();
    if (!jobTitle) throw new Error("jobTitle is required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const taskContext = tasks?.length
      ? `\nKey tasks in this role: ${tasks.slice(0, 8).map((t: any) => t.name).join(", ")}`
      : "";
    const skillContext = skills?.length
      ? `\nKey skills: ${skills.slice(0, 8).map((s: any) => s.name).join(", ")}`
      : "";

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a career transition advisor. Given a job role, suggest 4 alternative career paths the person could transition to based on transferable skills. For each pathway provide: the target role title, estimated skill overlap percentage (20-85), up to 5 shared/transferable skills, and up to 5 new skills they would need to learn. Be realistic and practical.`,
          },
          {
            role: "user",
            content: `Suggest 4 career transition pathways for someone currently working as: "${jobTitle}"${taskContext}${skillContext}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_pathways",
              description: "Return 4 career transition pathways with skill overlap details.",
              parameters: {
                type: "object",
                properties: {
                  pathways: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Target role title" },
                        skillOverlap: { type: "number", description: "Percentage of skills that transfer (20-85)" },
                        sharedSkills: { type: "array", items: { type: "string" }, description: "Up to 5 transferable skills" },
                        newSkillsNeeded: { type: "array", items: { type: "string" }, description: "Up to 5 new skills needed" },
                      },
                      required: ["title", "skillOverlap", "sharedSkills", "newSkillsNeeded"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["pathways"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_pathways" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");

    const parsed = JSON.parse(toolCall.function.arguments);

    // Normalize and add URIs
    const pathways = parsed.pathways.map((p: any, i: number) => ({
      title: p.title,
      uri: `ai:${i}`,
      skillOverlap: Math.min(Math.max(Math.round(p.skillOverlap), 15), 90),
      sharedSkills: (p.sharedSkills || []).slice(0, 5),
      totalSkills: (p.sharedSkills?.length || 0) + (p.newSkillsNeeded?.length || 0),
      newSkillsNeeded: (p.newSkillsNeeded || []).slice(0, 5),
    }));

    pathways.sort((a: any, b: any) => b.skillOverlap - a.skillOverlap);

    return new Response(JSON.stringify({
      primary: { title: jobTitle, uri: "ai:current", skillCount: skills?.length || 0, essentialSkills: [] },
      pathways,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-pathways error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
