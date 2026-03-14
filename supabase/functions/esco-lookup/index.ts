import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ESCO_BASE = "https://ec.europa.eu/esco/api";

interface EscoSkill {
  uri: string;
  title: string;
  skillType?: string;
}

interface EscoOccupation {
  uri: string;
  title: string;
  description?: string;
  skills: EscoSkill[];
}

async function searchOccupations(query: string, limit = 10): Promise<{ uri: string; title: string }[]> {
  const url = `${ESCO_BASE}/search?text=${encodeURIComponent(query)}&type=occupation&language=en&full=false&limit=${limit}`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ESCO search failed: ${res.status}`);
  const data = await res.json();
  return (data._embedded?.results || []).map((r: any) => ({
    uri: r.uri,
    title: r.title || r.preferredLabel?.en || "",
  }));
}

async function getOccupationSkills(uri: string): Promise<EscoOccupation> {
  const url = `${ESCO_BASE}/resource/occupation?uri=${encodeURIComponent(uri)}&language=en`;
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ESCO occupation fetch failed: ${res.status}`);
  const data = await res.json();

  const skills: EscoSkill[] = [];
  const hasSkill = data._links?.hasEssentialSkill || [];
  const hasOptional = data._links?.hasOptionalSkill || [];

  for (const s of [...hasSkill, ...hasOptional]) {
    skills.push({
      uri: s.uri || "",
      title: s.title || "",
      skillType: hasSkill.includes(s) ? "essential" : "optional",
    });
  }

  return {
    uri: data.uri || uri,
    title: data.title || data.preferredLabel?.en || "",
    description: data.description?.en?.literal || "",
    skills,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, query, uri, limit } = await req.json();

    if (action === "search") {
      if (!query) {
        return new Response(JSON.stringify({ error: "query is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const results = await searchOccupations(query, limit || 10);
      return new Response(JSON.stringify({ results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "skills") {
      if (!uri) {
        return new Response(JSON.stringify({ error: "uri is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const occupation = await getOccupationSkills(uri);
      return new Response(JSON.stringify(occupation), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "match") {
      // Search for a job title, get its skills, then find related occupations
      if (!query) {
        return new Response(JSON.stringify({ error: "query is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 1. Find the best matching occupation
      const searchResults = await searchOccupations(query, 1);
      if (searchResults.length === 0) {
        return new Response(JSON.stringify({ error: "No matching occupation found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Get the primary occupation's skills
      const primary = await getOccupationSkills(searchResults[0].uri);
      const primarySkillNames = new Set(primary.skills.map((s) => s.title.toLowerCase()));

      // 3. Search for related occupations using top essential skills as queries
      const essentialSkills = primary.skills
        .filter((s) => s.skillType === "essential")
        .slice(0, 3);

      const relatedUris = new Set<string>();
      const relatedOccupations: { uri: string; title: string }[] = [];

      for (const skill of essentialSkills) {
        const related = await searchOccupations(skill.title, 5);
        for (const r of related) {
          if (r.uri !== primary.uri && !relatedUris.has(r.uri)) {
            relatedUris.add(r.uri);
            relatedOccupations.push(r);
          }
        }
      }

      // 4. Get skills for top related occupations and calculate overlap
      const pathways = [];
      const topRelated = relatedOccupations.slice(0, 8);

      for (const rel of topRelated) {
        try {
          const relOcc = await getOccupationSkills(rel.uri);
          const relSkillNames = relOcc.skills.map((s) => s.title.toLowerCase());
          const shared = relSkillNames.filter((s) => primarySkillNames.has(s));
          const overlapPercent = primarySkillNames.size > 0
            ? Math.round((shared.length / primarySkillNames.size) * 100)
            : 0;

          pathways.push({
            title: relOcc.title,
            uri: relOcc.uri,
            skillOverlap: overlapPercent,
            sharedSkills: shared.slice(0, 5),
            totalSkills: relOcc.skills.length,
            newSkillsNeeded: relSkillNames.filter((s) => !primarySkillNames.has(s)).slice(0, 5),
          });
        } catch (e) {
          console.error(`Failed to get skills for ${rel.title}:`, e);
        }
      }

      // Sort by skill overlap
      pathways.sort((a, b) => b.skillOverlap - a.skillOverlap);

      return new Response(
        JSON.stringify({
          primary: {
            title: primary.title,
            uri: primary.uri,
            skillCount: primary.skills.length,
            essentialSkills: primary.skills
              .filter((s) => s.skillType === "essential")
              .map((s) => s.title),
          },
          pathways: pathways.slice(0, 5),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: search, skills, or match" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("esco-lookup error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
