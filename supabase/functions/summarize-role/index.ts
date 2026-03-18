import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { jobId, jobTitle, company, description } = await req.json();
    if (!jobId || !description) {
      return new Response(JSON.stringify({ error: "jobId and description required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sbUrl = Deno.env.get("SUPABASE_URL")!;
    const sbKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const sb = createClient(sbUrl, sbKey);

    // Check cache first
    const { data: existing } = await sb
      .from("jobs")
      .select("role_summary")
      .eq("id", jobId)
      .single();

    if (existing?.role_summary) {
      return new Response(JSON.stringify({ summary: existing.role_summary }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) throw new Error("LOVABLE_API_KEY not set");

    const prompt = `You are a career coach writing for job seekers who may not know this company or role.

Given this job posting for "${jobTitle}"${company ? ` at ${company}` : ""}, write exactly TWO short sections:

1. **About the company** (1-2 sentences): What does this company do? What industry/market? Keep it simple and informative.
2. **About the role** (2-3 sentences): What would someone actually DO day-to-day in this job? Focus on responsibilities, not requirements. Make it concrete and engaging.

Rules:
- Write for someone unfamiliar with both the company and the role
- No buzzwords, no fluff, no "exciting opportunity" language
- Be specific about what makes this role interesting
- Total output under 120 words

Job posting text:
${description.slice(0, 3000)}`;

    const aiResp = await fetch(AI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!aiResp.ok) {
      const status = aiResp.status;
      const txt = await aiResp.text();
      console.error("AI error:", status, txt);
      return new Response(JSON.stringify({ error: "AI unavailable" }), {
        status: status === 429 ? 429 : status === 402 ? 402 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResp.json();
    const summary = aiData.choices?.[0]?.message?.content?.trim() || "";

    // Cache it
    if (summary) {
      await sb.from("jobs").update({ role_summary: summary }).eq("id", jobId);
    }

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("summarize-role error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
