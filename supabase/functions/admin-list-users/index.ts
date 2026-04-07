import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing auth");

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const { data: isAdmin } = await anonClient.rpc("is_superadmin", { _user_id: caller.id });
    if (!isAdmin) throw new Error("Forbidden: superadmin only");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all profiles
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, display_name, company, job_title, created_at, onboarding_completed, career_stage")
      .order("created_at", { ascending: false });

    // Get all auth users for emails
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map<string, string>();
    authData?.users?.forEach((u: any) => emailMap.set(u.id, u.email || ""));

    const result = (profiles || []).map((p: any) => ({
      user_id: p.id,
      display_name: p.display_name || "—",
      email: emailMap.get(p.id) || "—",
      company: p.company || "",
      job_title: p.job_title || "",
      created_at: p.created_at,
      onboarding_completed: p.onboarding_completed,
      career_stage: p.career_stage || "",
    }));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
