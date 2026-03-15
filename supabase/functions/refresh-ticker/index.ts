import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dateRange = `${thirtyDaysAgo.toLocaleDateString("en-US", { month: "short", day: "numeric" })} to ${today.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;

    const prompt = `You are a financial news analyst. Generate exactly 15 real, factual headlines about AI-driven disruption in business, jobs, and markets from the last 30 days (${dateRange}).

Each headline must be:
- Based on real events and company news
- Concise (under 100 characters)
- Focused on AI impact: layoffs, stock drops, product launches threatening incumbents, automation milestones

Return ONLY valid JSON array with objects like:
[{"date":"Mar 14","text":"Headline here"}]

Dates should be spread across the 30-day window. Use "Mon DD" format (e.g. "Mar 14", "Feb 28").`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch("https://ai.lovable.dev/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);
    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${responseText}`);
    }

    const data = JSON.parse(responseText);
    const content = data.choices?.[0]?.message?.content || "";

    // Extract JSON array from response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("Could not parse headlines from AI response");
    }

    const headlines: { date: string; text: string }[] = JSON.parse(jsonMatch[0]);

    if (!Array.isArray(headlines) || headlines.length === 0) {
      throw new Error("No headlines parsed");
    }

    // Clear old headlines and insert new ones
    await supabase.from("ticker_headlines").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    const { error } = await supabase.from("ticker_headlines").insert(
      headlines.map((h) => ({ date: h.date, text: h.text }))
    );

    if (error) throw error;

    return new Response(JSON.stringify({ success: true, count: headlines.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("refresh-ticker error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
