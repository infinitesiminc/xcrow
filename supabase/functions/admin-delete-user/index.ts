import { createClient } from "https://esm.sh/@supabase/supabase-js@2.99.1";

Deno.serve(async (req) => {
  const { email } = await req.json();
  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // List users to find by email
  const { data: { users }, error: listErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  if (listErr) return new Response(JSON.stringify({ error: listErr.message }), { status: 500 });

  const user = users.find(u => u.email === email);
  if (!user) return new Response(JSON.stringify({ error: "User not found", searched: email }), { status: 404 });

  const { error: delErr } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  if (delErr) return new Response(JSON.stringify({ error: delErr.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true, deletedId: user.id }));
});
