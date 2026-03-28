import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface VerticalCompany {
  id: string;
  name: string;
  industry: string | null;
  description: string | null;
  employee_range: string | null;
  logo_url: string | null;
  role: "incumbent" | "disruptor" | "transitioning";
}

export interface SubVertical {
  name: string;
  companies: VerticalCompany[];
}

export interface VerticalStats {
  id: number;
  name: string;
  counts: { incumbent: number; disruptor: number; transitioning: number; total: number };
  sub_verticals: SubVertical[];
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
        if (role in v.counts) v.counts[role]++;
        v.counts.total++;

        const svName = row.sub_vertical || "General";
        let sv = v.sub_verticals.find((s) => s.name === svName);
        if (!sv) {
          sv = { name: svName, companies: [] };
          v.sub_verticals.push(sv);
        }
        const company = row.companies as any;
        if (company) {
          sv.companies.push({ ...company, role: row.role as VerticalCompany["role"] });
        }
      }

      return Object.values(verticals).sort((a, b) => a.id - b.id);
    },
    staleTime: 5 * 60 * 1000,
  });
}
