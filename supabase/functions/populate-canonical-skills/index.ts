import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const CATEGORY_MAP: Record<string, string> = {};
const addKeys = (keys: string[], cat: string) => keys.forEach(k => CATEGORY_MAP[k] = cat);
addKeys(['technical', 'ai tools', 'ai_tools', 'technology', 'engineering', 'programming', 'automation', 'ai/ml', 'software', 'devops', 'cybersecurity', 'cloud', 'infrastructure', 'platform', 'digital', 'machine learning', 'data science', 'robotics', 'ai interaction', 'proficiency', 'data engineering', 'ai acumen', 'ai fluency', 'digital fluency', 'technical skills', 'technical proficiency', 'technical acumen', 'technology & ai', 'technology & ai fluency', 'technology & ai literacy', 'technical deep dive'], 'Technical');
addKeys(['analytical', 'analysis', 'critical thinking', 'critical', 'cognitive', 'cognitive skills', 'quality', 'evaluation', 'assessment', 'decision', 'decision making', 'oversight', 'supervision', 'data analysis', 'research', 'research skills', 'problem solving'], 'Analytical');
addKeys(['strategic', 'strategy', 'business', 'business acumen', 'business skills', 'management', 'planning', 'operations', 'operational', 'organizational', 'process', 'supply chain', 'financial', 'finance', 'transformation', 'change', 'workflow', 'domain', 'domain expertise', 'strategic thinking', 'strategic planning', 'managerial', 'innovation & development'], 'Strategic');
addKeys(['communication', 'communication skills', 'collaboration', 'interpersonal', 'interpersonal skills', 'stakeholder', 'client', 'customer', 'presentation', 'negotiation', 'relationship', 'teamwork', 'storytelling', 'content', 'writing', 'marketing', 'sales'], 'Communication');
addKeys(['leadership', 'people', 'team', 'mentoring', 'coaching', 'talent', 'hr', 'human resources', 'people management', 'team management', 'creative leadership', 'strategic leadership', 'interpersonal & leadership'], 'Leadership');
addKeys(['creative', 'creative skills', 'design', 'innovation', 'ux', 'ui', 'visual', 'media', 'branding', 'generative', 'design/strategy', 'design/soft skill', 'creative & innovation'], 'Creative');
addKeys(['ethics', 'ethical', 'compliance', 'governance', 'legal', 'regulatory', 'risk', 'privacy', 'security', 'safety', 'audit', 'bias', 'responsible', 'ethics & compliance', 'ethics & governance', 'ethical & governance', 'legal & regulatory', 'legal & ethical'], 'Ethics & Compliance');
addKeys(['human', 'human-centric', 'soft skill', 'soft skills', 'emotional', 'empathy', 'adaptability', 'resilience', 'judgment', 'learning', 'mindset', 'wellness', 'cultural', 'social', 'socio-emotional', 'action', 'professional', 'specialized', 'pedagog', 'learning & development', 'pedagogical', 'pedagogical skills', 'cross-functional', 'hybrid'], 'Human Edge');

function mapCategory(raw: string): string {
  if (!raw) return 'Technical';
  const low = raw.toLowerCase().trim();
  if (CATEGORY_MAP[low]) return CATEGORY_MAP[low];
  for (const [key, val] of Object.entries(CATEGORY_MAP)) {
    if (low.includes(key) || key.includes(low)) return val;
  }
  const kwFallback: [string[], string][] = [
    [['ai', 'tech', 'tool', 'code', 'system', 'ml', 'prompt', 'automat', 'engineer', 'software'], 'Technical'],
    [['analy', 'data', 'research', 'think', 'problem', 'cognitive'], 'Analytical'],
    [['strateg', 'business', 'manag', 'plan', 'financ', 'oper'], 'Strategic'],
    [['communic', 'collabor', 'stakeholder', 'client', 'market', 'writ'], 'Communication'],
    [['lead', 'people', 'team', 'mentor', 'coach'], 'Leadership'],
    [['creat', 'design', 'innovat', 'visual'], 'Creative'],
    [['ethic', 'compli', 'govern', 'legal', 'regulat', 'risk', 'privacy', 'safe'], 'Ethics & Compliance'],
    [['human', 'empath', 'adapt', 'resilien', 'emotion', 'judgment'], 'Human Edge'],
  ];
  for (const [keywords, cat] of kwFallback) {
    if (keywords.some(kw => low.includes(kw))) return cat;
  }
  return 'Technical';
}

function makeId(name: string): string {
  return name.toLowerCase().trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'unnamed';
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Step 1: Aggregate all future skills
    const { data: aggregated, error: aggErr } = await sb.rpc('exec_sql' as any, {}) as any;
    
    // Use direct query instead
    const { data: rawSkills, error: rawErr } = await sb
      .from('job_future_skills')
      .select('skill_name, category, icon_emoji, job_id')
      .limit(10000);

    if (rawErr) throw rawErr;
    
    console.log(`Fetched ${rawSkills.length} raw skills`);

    // Group by normalized name
    const groups = new Map<string, {
      names: Map<string, number>,
      categories: Map<string, number>,
      emojis: Map<string, number>,
      jobIds: Set<string>,
      count: number,
    }>();

    for (const row of rawSkills) {
      const normName = row.skill_name.toLowerCase().trim();
      if (!groups.has(normName)) {
        groups.set(normName, {
          names: new Map(), categories: new Map(), emojis: new Map(),
          jobIds: new Set(), count: 0,
        });
      }
      const g = groups.get(normName)!;
      g.count++;
      g.names.set(row.skill_name, (g.names.get(row.skill_name) || 0) + 1);
      if (row.category) g.categories.set(row.category, (g.categories.get(row.category) || 0) + 1);
      if (row.icon_emoji) g.emojis.set(row.icon_emoji, (g.emojis.get(row.icon_emoji) || 0) + 1);
      if (row.job_id) g.jobIds.add(row.job_id);
    }

    console.log(`Grouped into ${groups.size} unique skills`);

    // Build canonical entries
    const seenIds = new Set<string>();
    const canonical: any[] = [];
    const normToId = new Map<string, string>();

    for (const [normName, g] of groups) {
      // Best name (most common)
      let bestName = '';
      let bestCount = 0;
      for (const [name, count] of g.names) {
        if (count > bestCount) { bestName = name; bestCount = count; }
      }
      
      // Best category
      let bestCat = '';
      let bestCatCount = 0;
      for (const [cat, count] of g.categories) {
        if (count > bestCatCount) { bestCat = cat; bestCatCount = count; }
      }
      
      // Best emoji
      let bestEmoji = '🔧';
      let bestEmojiCount = 0;
      for (const [emoji, count] of g.emojis) {
        if (count > bestEmojiCount && emoji.length <= 4) { bestEmoji = emoji; bestEmojiCount = count; }
      }
      
      const mappedCat = mapCategory(bestCat);
      
      let cid = makeId(bestName);
      if (!cid) cid = `skill-${canonical.length}`;
      let origCid = cid;
      let counter = 2;
      while (seenIds.has(cid)) { cid = `${origCid}-${counter++}`; }
      seenIds.add(cid);
      
      // Aliases
      const aliases = Array.from(g.names.keys()).filter(n => n !== bestName).slice(0, 5);
      
      canonical.push({
        id: cid,
        name: bestName,
        category: mappedCat,
        icon_emoji: bestEmoji,
        demand_count: g.count,
        job_count: g.jobIds.size,
        aliases: aliases,
      });
      
      normToId.set(normName, cid);
    }

    // Sort by demand
    canonical.sort((a, b) => b.demand_count - a.demand_count);

    // Category distribution
    const catDist: Record<string, number> = {};
    for (const c of canonical) {
      catDist[c.category] = (catDist[c.category] || 0) + 1;
    }
    console.log('Category distribution:', catDist);

    // Step 2: Clear and insert canonical skills in batches
    await sb.from('canonical_future_skills').delete().neq('id', '___impossible___');
    
    const batchSize = 100;
    let inserted = 0;
    for (let i = 0; i < canonical.length; i += batchSize) {
      const batch = canonical.slice(i, i + batchSize);
      const { error: insertErr } = await sb.from('canonical_future_skills').upsert(batch, { onConflict: 'id' });
      if (insertErr) {
        console.error(`Batch ${i} error:`, insertErr.message);
        // Try individual
        for (const item of batch) {
          const { error: singleErr } = await sb.from('canonical_future_skills').upsert(item, { onConflict: 'id' });
          if (!singleErr) inserted++;
          else console.error(`Skip ${item.name}: ${singleErr.message}`);
        }
      } else {
        inserted += batch.length;
      }
    }

    console.log(`Inserted ${inserted}/${canonical.length} canonical skills`);

    // Step 3: Link job_future_skills to canonical entries
    let linked = 0;
    for (const [normName, cid] of normToId) {
      // Get all distinct skill_names for this norm
      const matchingNames = new Set<string>();
      for (const row of rawSkills) {
        if (row.skill_name.toLowerCase().trim() === normName) {
          matchingNames.add(row.skill_name);
        }
      }
      
      for (const sname of matchingNames) {
        const { count } = await sb
          .from('job_future_skills')
          .update({ canonical_skill_id: cid })
          .eq('skill_name', sname)
          .is('canonical_skill_id', null)
          .select('id', { count: 'exact', head: true });
        linked += count || 0;
      }
    }

    console.log(`Linked ${linked} job_future_skills rows`);

    return new Response(JSON.stringify({
      canonical_count: inserted,
      linked_count: linked,
      category_distribution: catDist,
      top_10: canonical.slice(0, 10).map(c => ({ name: c.name, category: c.category, demand: c.demand_count, jobs: c.job_count })),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
