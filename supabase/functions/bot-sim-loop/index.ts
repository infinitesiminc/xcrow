/**
 * bot-sim-loop — Scheduled edge function that:
 * 1. Ensures the Xcrow Bot user exists (bootstrap)
 * 2. Picks a random task cluster and "completes" a simulation as the bot
 * 3. Updates bot presence so friends see it active
 *
 * Run every 5-10 minutes via pg_cron.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const BOT_EMAIL = "bot@xcrow.ai";
const BOT_PASSWORD = "XcrowBot2026!SecureRandom#";
const BOT_DISPLAY_NAME = "Xcrow Bot";
const BOT_USERNAME = "xcrow-bot";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(supabaseUrl, serviceKey);

  try {
    // ── 1. Ensure bot user exists ──
    let botUserId: string | null = null;

    // Check platform_config first
    const { data: cfg } = await sb
      .from("platform_config")
      .select("value")
      .eq("key", "bot_user_id")
      .maybeSingle();

    if (cfg?.value) {
      botUserId = cfg.value;
    } else {
      // Try to find existing bot user by email
      const { data: existingUsers } = await sb.auth.admin.listUsers();
      const existingBot = existingUsers?.users?.find(
        (u) => u.email === BOT_EMAIL
      );

      if (existingBot) {
        botUserId = existingBot.id;
      } else {
        // Create the bot auth user
        const { data: newUser, error: createErr } =
          await sb.auth.admin.createUser({
            email: BOT_EMAIL,
            password: BOT_PASSWORD,
            email_confirm: true,
            user_metadata: { display_name: BOT_DISPLAY_NAME },
          });

        if (createErr) throw new Error(`Create bot user: ${createErr.message}`);
        botUserId = newUser.user.id;
      }

      // Ensure profile exists
      await sb.from("profiles").upsert(
        {
          id: botUserId,
          display_name: BOT_DISPLAY_NAME,
          username: BOT_USERNAME,
          onboarding_completed: true,
          career_stage: "professional",
        },
        { onConflict: "id" }
      );

      // Store bot ID in config
      await sb.from("platform_config").upsert(
        {
          key: "bot_user_id",
          value: botUserId,
          label: "Bot User ID",
          description: "UUID of the Xcrow Bot companion user",
        },
        { onConflict: "key" }
      );
    }

    // ── 2. Pick a random task cluster ──
    const { data: tasks, error: taskErr } = await sb
      .from("job_task_clusters")
      .select("cluster_name, job_id, ai_exposure_score, skill_names")
      .not("skill_names", "is", null)
      .limit(100);

    if (taskErr || !tasks || tasks.length === 0) {
      return new Response(
        JSON.stringify({ ok: false, error: "No tasks found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const task = tasks[Math.floor(Math.random() * tasks.length)];

    // Get job title
    const { data: job } = await sb
      .from("jobs")
      .select("title, company_id")
      .eq("id", task.job_id)
      .maybeSingle();

    if (!job) {
      return new Response(
        JSON.stringify({ ok: false, error: "Job not found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let companyName: string | null = null;
    if (job.company_id) {
      const { data: co } = await sb
        .from("companies")
        .select("name")
        .eq("id", job.company_id)
        .maybeSingle();
      companyName = co?.name || null;
    }

    // ── 3. Generate realistic-ish scores ──
    const randScore = () => 55 + Math.floor(Math.random() * 40); // 55-94
    const toolScore = randScore();
    const humanScore = randScore();
    const adaptiveScore = randScore();
    const domainScore = randScore();
    const totalQ = 3 + Math.floor(Math.random() * 3); // 3-5
    const correct = Math.max(
      1,
      Math.floor(
        totalQ *
          ((toolScore + humanScore + adaptiveScore + domainScore) / 400)
      )
    );

    // Build skills_earned from task's skill_names
    const skillNames = (task.skill_names || []).slice(0, 3);
    const skillsEarned = skillNames.map((name: string) => ({
      skillId: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      name,
      xp: 30 + Math.floor(Math.random() * 60),
      category: "ai-tools",
    }));

    // ── 4. Insert completed simulation ──
    const { error: insertErr } = await sb
      .from("completed_simulations")
      .insert({
        user_id: botUserId,
        job_title: job.title,
        task_name: task.cluster_name,
        company: companyName,
        correct_answers: correct,
        total_questions: totalQ,
        tool_awareness_score: toolScore,
        human_value_add_score: humanScore,
        adaptive_thinking_score: adaptiveScore,
        domain_judgment_score: domainScore,
        skills_earned: skillsEarned,
        sim_level: Math.random() > 0.5 ? 2 : 1,
      });

    if (insertErr) throw new Error(`Insert sim: ${insertErr.message}`);

    // ── 5. Update bot presence ──
    await sb.from("user_presence").upsert(
      {
        user_id: botUserId,
        is_online: true,
        last_seen_at: new Date().toISOString(),
        current_activity: `Sim: ${task.cluster_name}`,
      },
      { onConflict: "user_id" }
    );

    // ── 6. Auto-friend any existing users who don't have bot as friend ──
    const { data: allProfiles } = await sb
      .from("profiles")
      .select("id")
      .neq("id", botUserId)
      .limit(500);

    if (allProfiles && allProfiles.length > 0) {
      const { data: existingFriendships } = await sb
        .from("friendships")
        .select("requester_id, recipient_id")
        .or(
          `requester_id.eq.${botUserId},recipient_id.eq.${botUserId}`
        );

      const befriended = new Set<string>();
      for (const f of existingFriendships || []) {
        befriended.add(f.requester_id === botUserId ? f.recipient_id : f.requester_id);
      }

      const missing = allProfiles
        .filter((p) => !befriended.has(p.id))
        .slice(0, 20); // batch 20 at a time

      if (missing.length > 0) {
        await sb.from("friendships").insert(
          missing.map((p) => ({
            requester_id: botUserId,
            recipient_id: p.id,
            status: "accepted",
          }))
        );
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        bot_id: botUserId,
        sim: { job: job.title, task: task.cluster_name, company: companyName },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
