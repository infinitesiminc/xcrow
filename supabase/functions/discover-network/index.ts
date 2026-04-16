// AI auto-discovers user's network (customers, investors, partners, team) from their own company website.
// Triggered when user toggles "Auto-discover network" ON in Network Manager.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NETWORK_PATTERNS = [
  /\/(about|team|leadership|people|company)\/?$/i,
  /\/(customers?|case-stud(y|ies)|success-stor(y|ies)|stories|clients?)\/?$/i,
  /\/(investors?|backers?|funding)\/?$/i,
  /\/(partners?|integrations?|alliances?|ecosystem)\/?$/i,
  /\/(press|news|media)\/?$/i,
];

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 XcrowBot/1.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const html = await res.text();
    return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<style[\s\S]*?<\/style>/gi, "");
  } catch {
    return null;
  }
}

function rootDomain(host: string): string {
  const parts = host.split(".");
  return parts.length >= 2 ? parts.slice(-2).join(".") : host;
}

function extractLinks(html: string, baseUrl: string): { sameHost: string[]; subdomains: string[] } {
  const sameHost = new Set<string>();
  const subdomains = new Set<string>();
  const base = new URL(baseUrl);
  const baseRoot = rootDomain(base.hostname);
  const re = /href=["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], baseUrl);
      if (!/^https?:$/.test(u.protocol)) continue;
      const clean = u.toString().split("#")[0];
      if (u.hostname === base.hostname) {
        sameHost.add(clean);
      } else if (rootDomain(u.hostname) === baseRoot) {
        // same root domain, different subdomain (e.g. blog.example.com, customers.example.com)
        subdomains.add(`${u.protocol}//${u.hostname}`);
      }
    } catch { /* skip */ }
  }
  return { sameHost: [...sameHost], subdomains: [...subdomains] };
}

function pickRelevantUrls(links: string[]): string[] {
  const matched = links.filter((l) => {
    try { return NETWORK_PATTERNS.some((re) => re.test(new URL(l).pathname)); }
    catch { return false; }
  });
  return [...new Set(matched)].slice(0, 12);
}

function htmlToText(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 12000);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { workspaceKey, extraUrls } = await req.json();
    if (!workspaceKey) {
      return new Response(JSON.stringify({ error: "workspaceKey required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    ).auth.getUser();

    if (!user) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Build website URL from workspace key
    const cleanDomain = workspaceKey.replace(/^https?:\/\//, "").replace(/\/$/, "");
    const websiteUrl = `https://${cleanDomain}`;

    // Step 1: fetch homepage
    const homepageHtml = await fetchPage(websiteUrl);
    if (!homepageHtml) {
      return new Response(JSON.stringify({ error: "Could not reach website" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Step 2: discover relevant pages on main host + same-root subdomains
    const { sameHost, subdomains } = extractLinks(homepageHtml, websiteUrl);
    const relevantUrls = pickRelevantUrls(sameHost);

    // Step 2b: scan up to 3 discovered subdomains for relevant pages too
    const subdomainUrls: string[] = [];
    const subToScan = subdomains.slice(0, 3);
    for (const sub of subToScan) {
      const subHtml = await fetchPage(sub);
      if (!subHtml) continue;
      const { sameHost: subLinks } = extractLinks(subHtml, sub);
      // include the subdomain root + its relevant pages
      subdomainUrls.push(sub);
      subdomainUrls.push(...pickRelevantUrls(subLinks).slice(0, 3));
    }

    // Step 2c: include user-supplied URLs (e.g. Deep Research case-study URLs)
    const userUrls: string[] = Array.isArray(extraUrls)
      ? extraUrls.filter((u: any) => typeof u === "string" && /^https?:\/\//i.test(u)).slice(0, 8)
      : [];

    // Step 3: scrape all selected pages (cap to keep latency sane)
    const pagesToScrape = [
      websiteUrl,
      ...relevantUrls,
      ...subdomainUrls,
      ...userUrls,
    ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 18);

    const pageContents: Array<{ url: string; text: string }> = [];
    for (const url of pagesToScrape) {
      const html = url === websiteUrl ? homepageHtml : await fetchPage(url);
      if (html) pageContents.push({ url, text: htmlToText(html) });
    }

    // Step 4: AI extracts network entities
    const aiPrompt = `You are analyzing a company's own website (including subdomains and provided case-study URLs) to extract their relationship network. Extract:
- CUSTOMERS: companies they sell to (logos, case studies, testimonials)
- INVESTORS: VCs, angels, funds that backed them
- PARTNERS: integration partners, technology alliances
- TEAM: notable executives, advisors, board members (name + title)

Pages from ${websiteUrl} and related sources:
${pageContents.map((p, i) => `--- PAGE ${i + 1}: ${p.url} ---\n${p.text}`).join("\n\n")}

Return ONLY entities clearly mentioned. Skip generic copy. Max 15 per category.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiPrompt }],
        tools: [{
          type: "function",
          function: {
            name: "save_network",
            description: "Save extracted network entities",
            parameters: {
              type: "object",
              properties: {
                customers: { type: "array", items: { type: "object", properties: { name: { type: "string" }, company: { type: "string" }, notes: { type: "string" } }, required: ["name"] } },
                investors: { type: "array", items: { type: "object", properties: { name: { type: "string" }, company: { type: "string" }, notes: { type: "string" } }, required: ["name"] } },
                partners: { type: "array", items: { type: "object", properties: { name: { type: "string" }, company: { type: "string" }, notes: { type: "string" } }, required: ["name"] } },
                team: { type: "array", items: { type: "object", properties: { name: { type: "string" }, company: { type: "string" }, notes: { type: "string" } }, required: ["name"] } },
              },
              required: ["customers", "investors", "partners", "team"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "save_network" } },
      }),
    });

    if (!aiRes.ok) {
      const txt = await aiRes.text();
      console.error("AI gateway failed", aiRes.status, txt);
      return new Response(JSON.stringify({ error: "AI extraction failed", details: txt }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { customers: [], investors: [], partners: [], team: [] };

    // Step 5: persist (replacing previous auto-discovered entries for this workspace)
    await supabase.from("user_network")
      .delete()
      .eq("user_id", user.id)
      .eq("workspace_key", workspaceKey)
      .eq("source", "auto_discovered");

    const rows: any[] = [];
    for (const [category, items] of Object.entries(args) as [string, any[]][]) {
      const cat = category === "customers" ? "customer" : category === "investors" ? "investor" : category === "partners" ? "partner" : "team";
      for (const item of items.slice(0, 15)) {
        rows.push({
          user_id: user.id,
          workspace_key: workspaceKey,
          category: cat,
          name: item.name,
          company: item.company || null,
          notes: item.notes || null,
          source: "auto_discovered",
        });
      }
    }

    if (rows.length > 0) {
      await supabase.from("user_network").insert(rows);
    }

    // Update workspace_settings
    await supabase.from("workspace_settings").upsert({
      user_id: user.id,
      workspace_key: workspaceKey,
      auto_discover_network: true,
      last_discovered_at: new Date().toISOString(),
    }, { onConflict: "user_id,workspace_key" });

    return new Response(JSON.stringify({
      success: true,
      pagesScraped: pageContents.length,
      counts: {
        customers: args.customers?.length || 0,
        investors: args.investors?.length || 0,
        partners: args.partners?.length || 0,
        team: args.team?.length || 0,
      },
      total: rows.length,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("discover-network error", e);
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
