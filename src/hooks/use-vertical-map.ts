import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VerticalCompany {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  employee_range: string | null;
  logo_url: string | null;
  estimated_arr: string | null;
  estimated_employees: string | null;
  estimated_funding: string | null;
  enrichment_confidence: string | null;
  role: "incumbent" | "disruptor" | "transitioning";
}

export type WhitespaceLabel = "open" | "low-competition" | "crowded";

export interface SubVertical {
  name: string;
  companies: VerticalCompany[];
  counts: { incumbent: number; disruptor: number; transitioning: number };
  whitespace: WhitespaceLabel;
}

export interface VerticalStats {
  id: number;
  name: string;
  counts: { incumbent: number; disruptor: number; transitioning: number; total: number };
  sub_verticals: SubVertical[];
}

function computeWhitespace(counts: { incumbent: number; disruptor: number }): WhitespaceLabel {
  if (counts.incumbent > 0 && counts.disruptor === 0) return "open";
  if (counts.incumbent > 0 && counts.incumbent > counts.disruptor * 2) return "low-competition";
  return "crowded";
}

export function useVerticalMap() {
  return useQuery({
    queryKey: ["vertical-map"],
    queryFn: async (): Promise<VerticalStats[]> => {
      const { data, error } = await supabase
        .from("company_vertical_map")
        .select("vertical_id, vertical_name, sub_vertical, role, companies(id, name, industry, description, employee_range, logo_url)")
        .order("vertical_id");

      if (error) throw error;

      const verticals: Record<number, VerticalStats> = {};
      for (const row of data || []) {
        const vid = row.vertical_id;
        if (!verticals[vid]) {
          verticals[vid] = {
            id: vid,
            name: row.vertical_name,
            counts: { incumbent: 0, disruptor: 0, transitioning: 0, total: 0 },
            sub_verticals: [],
          };
        }
        const v = verticals[vid];
        const role = row.role as keyof typeof v.counts;
        if (role in v.counts && role !== "total") (v.counts as any)[role]++;
        v.counts.total++;

        const svName = row.sub_vertical || "General";
        let sv = v.sub_verticals.find((s) => s.name === svName);
        if (!sv) {
          sv = { name: svName, companies: [], counts: { incumbent: 0, disruptor: 0, transitioning: 0 }, whitespace: "crowded" };
          v.sub_verticals.push(sv);
        }

        const r = row.role as "incumbent" | "disruptor" | "transitioning";
        if (r in sv.counts) sv.counts[r]++;

        const company = row.companies as any;
        if (company) {
          sv.companies.push({ ...company, role: r });
        }
      }

      // Compute whitespace labels
      for (const v of Object.values(verticals)) {
        for (const sv of v.sub_verticals) {
          sv.whitespace = computeWhitespace(sv.counts);
        }
        // Sort sub-verticals: open first, then low-competition, then crowded
        const order: Record<WhitespaceLabel, number> = { open: 0, "low-competition": 1, crowded: 2 };
        v.sub_verticals.sort((a, b) => order[a.whitespace] - order[b.whitespace]);
      }

      return Object.values(verticals).sort((a, b) => a.id - b.id);
    },
    staleTime: 5 * 60 * 1000,
  });
}
