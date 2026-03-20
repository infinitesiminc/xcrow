import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { action, payload } = await req.json();

    if (action === "generate_drop") {
      // Generate a new AI skill drop based on market trends
      const { theme, rarity = "rare" } = payload || {};

      // Fetch existing skill IDs to avoid duplicates
      const { data: existing } = await supabase.from("skills").select("id, name");
      const existingNames = (existing || []).map((s: any) => s.name.toLowerCase());
      const existingIds = new Set((existing || []).map((s: any) => s.id));

      const prompt = `You are a skill taxonomy expert for AI-era careers. Generate ONE new, specific, emerging skill that would be valuable for professionals adapting to AI.

${theme ? `Theme/industry focus: ${theme}` : "Pick a trending AI-adjacent skill."}
Rarity: ${rarity} (common = broad skill, rare = specialized, legendary = cutting-edge niche)

EXISTING SKILLS (do NOT duplicate these): ${existingNames.join(", ")}

Return a JSON object with these exact fields:
- id: kebab-case unique identifier (e.g. "ai-governance")
- name: short display name (2-4 words)
- category: one of "technical", "analytical", "communication", "leadership", "creative", "compliance"
- keywords: array of 5-8 lowercase matching keywords
- ai_exposure: integer 0-100 (how much AI can do this task)
- human_edge: short phrase describing the human advantage
- description: one sentence describing what this skill is about
- icon_emoji: single emoji representing this skill

Make it specific and actionable, not generic. Think emerging AI-era skills like "AI Safety Auditing", "Synthetic Media Literacy", "Human-AI Teaming", "Responsible AI Design", etc.`;

      const aiResp = await fetch(
        "https://ai.gateway.lovable.dev/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: "You are a skill taxonomy designer. Return ONLY valid JSON, no markdown." },
              { role: "user", content: prompt },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "create_skill",
                  description: "Create a new skill for the taxonomy",
                  parameters: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      name: { type: "string" },
                      category: { type: "string", enum: ["technical", "analytical", "communication", "leadership", "creative", "compliance"] },
                      keywords: { type: "array", items: { type: "string" } },
                      ai_exposure: { type: "integer" },
                      human_edge: { type: "string" },
                      description: { type: "string" },
                      icon_emoji: { type: "string" },
                    },
                    required: ["id", "name", "category", "keywords", "ai_exposure", "human_edge", "description", "icon_emoji"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "create_skill" } },
          }),
        }
      );

      if (!aiResp.ok) {
        const status = aiResp.status;
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limited, try again later" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        throw new Error(`AI gateway error: ${status}`);
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) throw new Error("No tool call in AI response");

      const skill = JSON.parse(toolCall.function.arguments);

      // Ensure unique ID
      let skillId = skill.id;
      if (existingIds.has(skillId)) {
        skillId = `${skillId}-${Date.now().toString(36).slice(-4)}`;
      }

      // Set expiration for drops (7 days for rare, 3 days for legendary)
      const expiresInDays = rarity === "legendary" ? 3 : rarity === "rare" ? 7 : 14;
      const dropExpiresAt = new Date(Date.now() + expiresInDays * 86400000).toISOString();

      // Insert into skills table
      const { data: inserted, error: insertError } = await supabase
        .from("skills")
        .insert({
          id: skillId,
          name: skill.name,
          category: skill.category,
          keywords: skill.keywords,
          ai_exposure: skill.ai_exposure,
          human_edge: skill.human_edge,
          description: skill.description,
          icon_emoji: skill.icon_emoji,
          unlock_type: "drop",
          unlock_requirement: { type: "task_completion", min_score: 60 },
          is_default: false,
          rarity,
          drop_expires_at: dropExpiresAt,
        })
        .select()
        .single();

      if (insertError) throw new Error(`Insert failed: ${insertError.message}`);

      return new Response(JSON.stringify({ skill: inserted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unlock") {
      // Unlock a skill for a user
      const { userId, skillId, method = "task_completion" } = payload;
      if (!userId || !skillId) throw new Error("userId and skillId required");

      // Verify skill exists
      const { data: skill } = await supabase
        .from("skills")
        .select("id, unlock_type, unlock_requirement, drop_expires_at")
        .eq("id", skillId)
        .single();

      if (!skill) throw new Error("Skill not found");

      // Check if drop has expired
      if (skill.drop_expires_at && new Date(skill.drop_expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "This skill drop has expired" }), {
          status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("user_skill_unlocks")
        .upsert(
          { user_id: userId, skill_id: skillId, unlock_method: method },
          { onConflict: "user_id,skill_id" }
        );

      if (error) throw new Error(`Unlock failed: ${error.message}`);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "unlock_via_invite") {
      // Unlock a special skill when a friend accepts an invite
      const { referrerId, referredUserId } = payload;
      if (!referrerId || !referredUserId) throw new Error("Both user IDs required");

      // Find an available invite-unlock skill
      const { data: inviteSkills } = await supabase
        .from("skills")
        .select("id")
        .eq("unlock_type", "invite")
        .or(`drop_expires_at.is.null,drop_expires_at.gt.${new Date().toISOString()}`);

      if (!inviteSkills || inviteSkills.length === 0) {
        return new Response(JSON.stringify({ error: "No invite skills available" }), {
          status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Unlock for both users
      const skillId = inviteSkills[0].id;
      await Promise.all([
        supabase.from("user_skill_unlocks").upsert(
          { user_id: referrerId, skill_id: skillId, unlock_method: "invite_sent" },
          { onConflict: "user_id,skill_id" }
        ),
        supabase.from("user_skill_unlocks").upsert(
          { user_id: referredUserId, skill_id: skillId, unlock_method: "invite_accepted" },
          { onConflict: "user_id,skill_id" }
        ),
      ]);

      return new Response(JSON.stringify({ success: true, skillId }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("skill-drops error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
