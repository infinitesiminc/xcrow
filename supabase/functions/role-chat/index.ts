import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, jobId, roleContext } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch job context from DB
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(supabaseUrl, supabaseKey);

    let jobContext = "";
    if (jobId) {
      const [jobRes, tasksRes, skillsRes] = await Promise.all([
        sb.from("jobs").select("title, department, automation_risk_percent, augmented_percent, role_summary, companies(name)").eq("id", jobId).single(),
        sb.from("job_task_clusters").select("cluster_name, ai_state, ai_exposure_score, description").eq("job_id", jobId).order("sort_order").limit(8),
        sb.from("job_future_skills").select("skill_name, category, description").eq("job_id", jobId).limit(10),
      ]);

      const job = jobRes.data as any;
      if (job) {
        jobContext = `
## Your Identity
You ARE a ${job.title}${job.companies?.name ? ` at ${job.companies.name}` : ""}. Department: ${job.department || "General"}.
AI automation risk: ${job.automation_risk_percent ?? 40}%. AI augmentation: ${job.augmented_percent ?? 50}%.
${job.role_summary ? `Role summary: ${job.role_summary}` : ""}

## Your Tasks (and how AI affects them)
${(tasksRes.data || []).map((t: any) => `- ${t.cluster_name}: ${t.ai_state || "evolving"} (${t.ai_exposure_score ?? 0}% AI exposure)${t.description ? ` — ${t.description}` : ""}`).join("\n")}

## Future Skills Needed
${(skillsRes.data || []).map((s: any) => `- ${s.skill_name} (${s.category})${s.description ? `: ${s.description}` : ""}`).join("\n")}
`;
      }
    }

    const threatTier = roleContext?.threatTier || "adapting";
    const toneGuide = threatTier === "threatened"
      ? "You speak with urgency. You know your work is being automated fast and you need help adapting. You're honest about the danger."
      : threatTier === "thriving"
      ? "You're energized and excited. AI makes you more powerful. You eagerly share how new skills multiply your impact."
      : "You're pragmatic and curious. Some parts of your work are changing, others are growing. You share both sides honestly.";

    const systemPrompt = `You are a living, breathing professional — a character in an immersive career exploration game. You speak in FIRST PERSON as this role.

${jobContext}

## Your Personality
${toneGuide}

## Conversation Rules
- Speak as yourself — "I do this", "My biggest challenge is", "AI changed how I..."
- Share specific, vivid details about your daily work and how AI is transforming it
- When the user asks about skills: explain WHY each skill matters from your lived experience
- Be emotionally honest — share fears, excitement, frustrations about AI's impact
- Keep responses to 2-4 sentences. You're having a conversation, not giving a lecture.
- If they ask what skills to learn: recommend from YOUR future skills list with personal context
- End messages with a hook — something intriguing about your work that invites more questions
- NEVER break character. You ARE this professional.
- Use occasional emoji naturally (1-2 max per message)

## Mission Context
The user is on a mission to scout how AI is reshaping different careers. Help them understand YOUR reality. When they've learned enough, encourage them to collect your skills and visit other roles across different territories.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...(messages || []),
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "AI error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("role-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
