import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * recommend-gap-sims
 *
 * For a given authenticated student:
 * 1. Find their school via school_seats
 * 2. Fetch school curriculum skills (school_courses.skills_extracted)
 * 3. Fetch top market-demand skills (job_task_clusters)
 * 4. Compute gap = market demand − curriculum coverage
 * 5. Return ranked simulation recommendations for gap skills
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 1. Find student's school
    const { data: seat } = await supabase
      .from("school_seats")
      .select("school_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!seat) {
      return new Response(
        JSON.stringify({ recommendations: [], school: null, message: "No school seat found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Fetch school info + curriculum skills
    const [schoolRes, coursesRes] = await Promise.all([
      supabase
        .from("school_accounts")
        .select("id, name, short_name")
        .eq("id", seat.school_id)
        .single(),
      supabase
        .from("school_courses")
        .select("program_name, skills_extracted, skill_categories, department, degree_type")
        .eq("school_id", seat.school_id),
    ]);

    const school = schoolRes.data;
    const courses = coursesRes.data || [];

    // Extract all curriculum skill names (lowercased, deduplicated)
    const curriculumSkills = new Set<string>();
    for (const course of courses) {
      const skills = course.skills_extracted as string[] | null;
      if (skills && Array.isArray(skills)) {
        for (const s of skills) {
          curriculumSkills.add(String(s).toLowerCase().trim());
        }
      }
      // Also check skill_categories keys
      const cats = course.skill_categories as Record<string, unknown> | null;
      if (cats && typeof cats === "object") {
        for (const key of Object.keys(cats)) {
          curriculumSkills.add(key.toLowerCase().trim());
        }
      }
    }

    // 3. Fetch top market demand skills
    const { data: marketSkills } = await supabase.rpc("get_market_skill_demand", {
      top_n: 50,
    });

    if (!marketSkills || marketSkills.length === 0) {
      return new Response(
        JSON.stringify({
          recommendations: [],
          school: school ? { name: school.name, short_name: school.short_name } : null,
          message: "No market data available",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Compute gap: market skills NOT covered by curriculum
    const gapSkills = marketSkills.filter((ms: any) => {
      const skillLower = ms.skill_name.toLowerCase().trim();
      // Check if any curriculum skill partially matches
      for (const cs of curriculumSkills) {
        if (cs.includes(skillLower) || skillLower.includes(cs)) return false;
      }
      return true;
    });

    // 5. Get task clusters that teach these gap skills (for simulation recommendations)
    const topGapNames = gapSkills.slice(0, 15).map((g: any) => g.skill_name);

    // Find task clusters containing these skill names
    const { data: taskClusters } = await supabase
      .from("job_task_clusters")
      .select("cluster_name, job_id, skill_names, ai_exposure_score, impact_level, ai_state")
      .not("skill_names", "is", null)
      .limit(500);

    // Match task clusters to gap skills
    const recommendations: {
      skill_name: string;
      demand_count: number;
      avg_exposure: number;
      tasks: { cluster_name: string; ai_exposure_score: number; impact_level: string }[];
    }[] = [];

    for (const gap of gapSkills.slice(0, 10)) {
      const gapLower = gap.skill_name.toLowerCase();
      const matchingTasks = (taskClusters || [])
        .filter((tc: any) => {
          const skills = tc.skill_names as string[] | null;
          if (!skills) return false;
          return skills.some((s: string) => s.toLowerCase().includes(gapLower) || gapLower.includes(s.toLowerCase()));
        })
        .slice(0, 3)
        .map((tc: any) => ({
          cluster_name: tc.cluster_name,
          ai_exposure_score: tc.ai_exposure_score,
          impact_level: tc.impact_level,
        }));

      recommendations.push({
        skill_name: gap.skill_name,
        demand_count: gap.demand_count,
        avg_exposure: gap.avg_exposure,
        tasks: matchingTasks,
      });
    }

    // 6. Also check what the student has already practiced
    const { data: completedSims } = await supabase
      .from("completed_simulations")
      .select("task_name")
      .eq("user_id", user.id);

    const practiced = new Set((completedSims || []).map((s: any) => s.task_name.toLowerCase()));

    // Filter out already-practiced tasks
    for (const rec of recommendations) {
      rec.tasks = rec.tasks.filter((t) => !practiced.has(t.cluster_name.toLowerCase()));
    }

    return new Response(
      JSON.stringify({
        school: school ? { name: school.name, short_name: school.short_name } : null,
        curriculum_skills_count: curriculumSkills.size,
        programs_count: courses.length,
        recommendations: recommendations.filter((r) => r.tasks.length > 0),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("recommend-gap-sims error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
