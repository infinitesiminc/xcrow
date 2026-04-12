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
      .select("id, display_name, company, job_title, created_at, onboarding_completed")
      .order("created_at", { ascending: false });

    // Get all auth users for emails
    const { data: authData } = await adminClient.auth.admin.listUsers({ perPage: 1000 });
    const emailMap = new Map<string, string>();
    const lastSignInMap = new Map<string, string | null>();
    authData?.users?.forEach((u: any) => {
      emailMap.set(u.id, u.email || "");
      lastSignInMap.set(u.id, u.last_sign_in_at || null);
    });

    // Get credit balances per user
    const { data: creditData } = await adminClient
      .from("credit_ledger")
      .select("user_id, delta");
    const creditMap = new Map<string, number>();
    creditData?.forEach((row: any) => {
      creditMap.set(row.user_id, (creditMap.get(row.user_id) || 0) + row.delta);
    });

    // Get lead counts per user
    const { data: leadData } = await adminClient
      .from("saved_leads")
      .select("user_id");
    const leadMap = new Map<string, number>();
    leadData?.forEach((row: any) => {
      leadMap.set(row.user_id, (leadMap.get(row.user_id) || 0) + 1);
    });

    // Get subscription info per user
    const { data: subData } = await adminClient
      .from("user_subscriptions")
      .select("user_id, plan, source, ends_at")
      .or("ends_at.is.null,ends_at.gt." + new Date().toISOString());
    const subMap = new Map<string, { plan: string; source: string }>();
    subData?.forEach((row: any) => {
      subMap.set(row.user_id, { plan: row.plan, source: row.source });
    });

    const result = (profiles || []).map((p: any) => ({
      user_id: p.id,
      display_name: p.display_name || "—",
      email: emailMap.get(p.id) || "—",
      company: p.company || "",
      job_title: p.job_title || "",
      created_at: p.created_at,
      onboarding_completed: p.onboarding_completed,
      credit_balance: creditMap.get(p.id) || 0,
      lead_count: leadMap.get(p.id) || 0,
      last_sign_in: lastSignInMap.get(p.id) || null,
      plan: subMap.get(p.id)?.plan || "free",
      plan_source: subMap.get(p.id)?.source || null,
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
