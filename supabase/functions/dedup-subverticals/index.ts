import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { dry_run = false, vertical_id: filterVid } = await req.json().catch(() => ({}));

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all distinct sub-verticals grouped by vertical
    let query = supabase
      .from("company_vertical_map")
      .select("vertical_id, vertical_name, sub_vertical")
      .order("vertical_id");
    if (filterVid) query = query.eq("vertical_id", filterVid);

    const { data: rows, error } = await query;
    if (error) throw error;

    // Group by vertical
    const byVertical: Record<number, { name: string; subs: Set<string> }> = {};
    for (const r of rows || []) {
      if (!byVertical[r.vertical_id]) {
        byVertical[r.vertical_id] = { name: r.vertical_name, subs: new Set() };
      }
      if (r.sub_vertical) byVertical[r.vertical_id].subs.add(r.sub_vertical);
    }

    const summary: any[] = [];

    for (const [vidStr, { name, subs }] of Object.entries(byVertical)) {
      const vid = Number(vidStr);
      const subList = Array.from(subs).sort();
      if (subList.length < 3) {
        summary.push({ vertical: name, before: subList.length, after: subList.length, merged: [] });
        continue;
      }

      // Ask AI to cluster
      const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are a startup market analyst. Group near-duplicate software sub-vertical names into canonical clusters. Each cluster gets ONE clear, founder-friendly canonical name (concise, no "AI" prefix unless essential). A sub-vertical that is already unique stays as its own cluster. Never lose a sub-vertical — every input must appear in exactly one cluster's members array.`
            },
            {
              role: "user",
              content: `Vertical: "${name}"\n\nSub-verticals (${subList.length}):\n${subList.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\nGroup these into canonical clusters. Merge duplicates and near-synonyms. Keep genuinely distinct niches separate.`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "cluster_subverticals",
              description: "Group sub-verticals into canonical clusters",
              parameters: {
                type: "object",
                properties: {
                  clusters: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        canonical_name: { type: "string", description: "The clean canonical name for this cluster" },
                        members: {
                          type: "array",
                          items: { type: "string" },
                          description: "Original sub-vertical names that belong to this cluster (exact match required)"
                        }
                      },
                      required: ["canonical_name", "members"],
                      additionalProperties: false
                    }
                  }
                },
                required: ["clusters"],
                additionalProperties: false
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "cluster_subverticals" } },
        }),
      });

      if (!aiResp.ok) {
        const errText = await aiResp.text();
        console.error(`AI error for ${name}: ${aiResp.status}`, errText);
        if (aiResp.status === 429) {
          await new Promise(r => setTimeout(r, 5000));
          continue;
        }
        throw new Error(`AI error: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall) {
        console.error(`No tool call for ${name}`);
        continue;
      }

      const { clusters } = JSON.parse(toolCall.function.arguments);
      const merged: { canonical: string; from: string[] }[] = [];

      for (const cluster of clusters) {
        // Only process clusters where members differ from canonical (actual merges)
        const membersToUpdate = cluster.members.filter(
          (m: string) => m !== cluster.canonical_name
        );

        if (membersToUpdate.length === 0) continue;

        merged.push({ canonical: cluster.canonical_name, from: membersToUpdate });

        if (!dry_run) {
          // Update company_vertical_map
          const { error: updateErr } = await supabase
            .from("company_vertical_map")
            .update({ sub_vertical: cluster.canonical_name })
            .in("sub_vertical", membersToUpdate)
            .eq("vertical_id", vid);

          if (updateErr) console.error(`Update error:`, updateErr);

          // Clean up orphaned subvertical_agent_scores
          const { error: deleteErr } = await supabase
            .from("subvertical_agent_scores")
            .delete()
            .in("sub_vertical", membersToUpdate)
            .eq("vertical_id", vid);

          if (deleteErr) console.error(`Delete scores error:`, deleteErr);
        }
      }

      summary.push({
        vertical: name,
        vertical_id: vid,
        before: subList.length,
        after: clusters.length,
        reduction: `${Math.round((1 - clusters.length / subList.length) * 100)}%`,
        merged,
      });

      // Rate limit between verticals
      await new Promise(r => setTimeout(r, 2000));
    }

    const totalBefore = summary.reduce((s, v) => s + v.before, 0);
    const totalAfter = summary.reduce((s, v) => s + v.after, 0);

    return new Response(JSON.stringify({
      dry_run,
      total_before: totalBefore,
      total_after: totalAfter,
      total_reduction: `${Math.round((1 - totalAfter / totalBefore) * 100)}%`,
      verticals: summary,
    }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
