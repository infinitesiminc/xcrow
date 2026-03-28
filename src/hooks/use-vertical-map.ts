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

export interface DisruptorMaturity {
  avgFunding: string;
  avgSize: string;
  avgArr: string;
  count: number;
}

export interface AgentScore {
  agent_score: number;
  agent_verdict: string | null;
  key_opportunities: string[];
  workflow_types: string[];
}

export interface SubVerticalAgentScore {
  agent_score: number;
  agent_verdict: string | null;
  automatable_workflows: { name: string; automation_level: string; description: string }[];
  agent_play: string | null;
  workflow_types: string[];
}

export interface VerticalStats {
  id: number;
  name: string;
  counts: { incumbent: number; disruptor: number; transitioning: number; total: number };
  sub_verticals: SubVertical[];
  opportunityScore: number;
  disruptorMaturity: DisruptorMaturity;
  verdict: string;
  agentScore?: AgentScore;
}

function computeWhitespace(counts: { incumbent: number; disruptor: number }): WhitespaceLabel {
  if (counts.incumbent > 0 && counts.disruptor === 0) return "open";
  if (counts.incumbent > 0 && counts.incumbent > counts.disruptor * 2) return "low-competition";
  return "crowded";
}

function parseFundingOrdinal(f: string | null): number {
  if (!f) return 0;
  const lower = f.toLowerCase();
  if (lower.includes("pre-seed") || lower.includes("bootstrap")) return 1;
  if (lower.includes("seed")) return 1;
  if (lower.includes("series a") || lower === "a") return 2;
  if (lower.includes("series b") || lower === "b") return 3;
  if (lower.includes("series c") || lower.includes("series d") || lower.includes("late")) return 4;
  if (lower.includes("public") || lower.includes("ipo")) return 5;
  return 2; // default mid
}

function parseEmployeeOrdinal(e: string | null): number {
  if (!e) return 0;
  const num = parseInt(e.replace(/[^0-9]/g, ""));
  if (isNaN(num)) {
    const lower = e.toLowerCase();
    if (lower.includes("1-10") || lower.includes("<10")) return 1;
    if (lower.includes("10-50") || lower.includes("11-50")) return 2;
    if (lower.includes("50-200") || lower.includes("51-200")) return 3;
    return 2;
  }
  if (num <= 10) return 1;
  if (num <= 50) return 2;
  if (num <= 200) return 3;
  return 4;
}

function fundingOrdinalToLabel(avg: number): string {
  if (avg <= 1.2) return "Pre-Seed/Seed";
  if (avg <= 2.2) return "Seed–A";
  if (avg <= 3.2) return "Series A–B";
  if (avg <= 4.2) return "Series C+";
  return "Late/Public";
}

function sizeOrdinalToLabel(avg: number): string {
  if (avg <= 1.3) return "1-10";
  if (avg <= 2.3) return "10-50";
  if (avg <= 3.3) return "50-200";
  return "200+";
}

function arrOrdinalToLabel(companies: VerticalCompany[]): string {
  const vals = companies.filter(c => c.estimated_arr).map(c => c.estimated_arr!);
  if (vals.length === 0) return "Unknown";
  // Simple frequency approach
  const counts: Record<string, number> = {};
  vals.forEach(v => { counts[v] = (counts[v] || 0) + 1; });
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
}

function computeVerdict(score: number, maturity: DisruptorMaturity, openCount: number, incumbentCount: number): string {
  if (score >= 8) return "Prime opportunity — early-stage disruptors, wide-open niches for AI-native entry.";
  if (score >= 6) return "Strong opportunity — moderate competition, room for differentiated AI plays.";
  if (score >= 4) return "Moderate opportunity — some niches open but maturing disruptor field.";
  if (score >= 2) return "Competitive — well-funded disruptors already present. Needs sharp niche focus.";
  return "Crowded — heavily contested by funded challengers. Requires 10x differentiation.";
}

function computeOpportunityScore(
  subVerticals: SubVertical[],
  disruptorCompanies: VerticalCompany[],
  incumbentCount: number
): { score: number; maturity: DisruptorMaturity; verdict: string } {
  const totalNiches = subVerticals.length || 1;
  const openNiches = subVerticals.filter(s => s.whitespace === "open").length;

  // 1. Whitespace ratio (0-4)
  const whitespaceScore = (openNiches / totalNiches) * 4;

  // 2. Disruptor immaturity (0-3) — lower maturity = higher score
  let immaturityScore = 3; // default if no disruptors = max opportunity
  if (disruptorCompanies.length > 0) {
    const fundingVals = disruptorCompanies.map(c => parseFundingOrdinal(c.estimated_funding)).filter(v => v > 0);
    const sizeVals = disruptorCompanies.map(c => parseEmployeeOrdinal(c.estimated_employees)).filter(v => v > 0);
    const avgFunding = fundingVals.length > 0 ? fundingVals.reduce((a, b) => a + b, 0) / fundingVals.length : 2;
    const avgSize = sizeVals.length > 0 ? sizeVals.reduce((a, b) => a + b, 0) / sizeVals.length : 2;
    const avgMaturity = (avgFunding + avgSize) / 2; // 1-5 scale
    immaturityScore = Math.max(0, 3 - (avgMaturity - 1) * 0.75);
  }

  // 3. Market size (0-3)
  const marketScore = Math.min(3, incumbentCount / 5);

  const score = Math.min(10, Math.round((whitespaceScore + immaturityScore + marketScore) * 10) / 10);

  // Compute maturity labels
  const fundingVals = disruptorCompanies.map(c => parseFundingOrdinal(c.estimated_funding)).filter(v => v > 0);
  const sizeVals = disruptorCompanies.map(c => parseEmployeeOrdinal(c.estimated_employees)).filter(v => v > 0);
  const avgF = fundingVals.length > 0 ? fundingVals.reduce((a, b) => a + b, 0) / fundingVals.length : 0;
  const avgS = sizeVals.length > 0 ? sizeVals.reduce((a, b) => a + b, 0) / sizeVals.length : 0;

  const maturity: DisruptorMaturity = {
    avgFunding: fundingVals.length > 0 ? fundingOrdinalToLabel(avgF) : "N/A",
    avgSize: sizeVals.length > 0 ? sizeOrdinalToLabel(avgS) : "N/A",
    avgArr: arrOrdinalToLabel(disruptorCompanies),
    count: disruptorCompanies.length,
  };

  const verdict = computeVerdict(score, maturity, openNiches, incumbentCount);

  return { score, maturity, verdict };
}

export function useVerticalMap() {
  return useQuery({
    queryKey: ["vertical-map"],
    queryFn: async (): Promise<VerticalStats[]> => {
      const [mapResult, agentResult] = await Promise.all([
        supabase
          .from("company_vertical_map")
          .select("vertical_id, vertical_name, sub_vertical, role, companies(id, name, industry, description, employee_range, logo_url, estimated_arr, estimated_employees, estimated_funding, enrichment_confidence)")
          .order("vertical_id"),
        supabase
          .from("vertical_agent_scores")
          .select("vertical_id, agent_score, agent_verdict, key_opportunities, workflow_types"),
      ]);

      if (mapResult.error) throw mapResult.error;
      const agentScores = agentResult.data || [];

      const verticals: Record<number, VerticalStats> = {};
      for (const row of mapResult.data || []) {
        const vid = row.vertical_id;
        if (!verticals[vid]) {
          verticals[vid] = {
            id: vid,
            name: row.vertical_name,
            counts: { incumbent: 0, disruptor: 0, transitioning: 0, total: 0 },
            sub_verticals: [],
            opportunityScore: 0,
            disruptorMaturity: { avgFunding: "N/A", avgSize: "N/A", avgArr: "N/A", count: 0 },
            verdict: "",
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

      // Compute whitespace + opportunity scores + attach agent scores
      for (const v of Object.values(verticals)) {
        for (const sv of v.sub_verticals) {
          sv.whitespace = computeWhitespace(sv.counts);
        }
        const order: Record<WhitespaceLabel, number> = { open: 0, "low-competition": 1, crowded: 2 };
        v.sub_verticals.sort((a, b) => order[a.whitespace] - order[b.whitespace]);

        const disruptorCompanies = v.sub_verticals.flatMap(s => s.companies.filter(c => c.role === "disruptor"));
        const { score, maturity, verdict } = computeOpportunityScore(v.sub_verticals, disruptorCompanies, v.counts.incumbent);
        v.opportunityScore = score;
        v.disruptorMaturity = maturity;
        v.verdict = verdict;

        // Attach agent score
        const as_ = agentScores.find(a => a.vertical_id === v.id);
        if (as_) {
          v.agentScore = {
            agent_score: as_.agent_score,
            agent_verdict: as_.agent_verdict,
            key_opportunities: as_.key_opportunities || [],
            workflow_types: as_.workflow_types || [],
          };
        }
      }

      const result = Object.values(verticals).sort((a, b) => a.id - b.id);
      return result;
    },
    staleTime: 5 * 60 * 1000,
  });
}
