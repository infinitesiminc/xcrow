/**
 * Seniority classifier for decision-maker ranking.
 * Maps job titles to a 1-5 rank and generates a plain-English role explanation.
 */

export interface SeniorityResult {
  rank: number;       // 1 = C-suite, 2 = SVP/EVP, 3 = VP, 4 = AVP/Director, 5 = Manager/Other
  label: string;      // e.g. "C-Suite", "SVP", "VP"
  decisionRole: string; // Plain-English buying authority explanation
}

const TITLE_PATTERNS: { test: RegExp; rank: number; label: string; role: string }[] = [
  // C-suite (rank 1)
  { test: /\b(chief|^c[a-z]o$|^ceo$|^cto$|^cfo$|^cio$|^coo$|^cpo$|^cro$|^cmo$|^cso$)\b/i, rank: 1, label: "C-Suite", role: "C-suite executive with ultimate budget authority and strategic direction" },
  // EVP / SVP (rank 2)
  { test: /\b(executive\s+vice\s+president|evp|senior\s+vice\s+president|svp)\b/i, rank: 2, label: "SVP/EVP", role: "Senior VP with cross-functional budget authority and strategic oversight" },
  // VP (rank 3)
  { test: /\b(vice\s+president|^vp\b)/i, rank: 3, label: "VP", role: "VP-level leader who evaluates vendors and owns departmental budget" },
  // AVP / Director / Head of (rank 4)
  { test: /\b(associate\s+vice\s+president|avp|director|head\s+of)\b/i, rank: 4, label: "Director", role: "Director-level leader who recommends purchases and influences budget decisions" },
  // Manager / Other (rank 5)
  { test: /\b(manager|lead|principal|senior\s+(?!vice))/i, rank: 5, label: "Manager", role: "Mid-level influencer who champions tools to leadership" },
];

export function classifySeniority(title: string | null | undefined): SeniorityResult {
  if (!title) return { rank: 5, label: "Unknown", decisionRole: "Role seniority unknown — verify decision-making authority" };

  const normalized = title.trim();

  for (const pattern of TITLE_PATTERNS) {
    if (pattern.test.test(normalized)) {
      // Generate a contextual role description based on the title's functional area
      const area = extractFunctionalArea(normalized);
      const contextualRole = area
        ? `${pattern.role} — owns ${area} decisions`
        : pattern.role;
      return { rank: pattern.rank, label: pattern.label, decisionRole: contextualRole };
    }
  }

  return { rank: 5, label: "Other", decisionRole: "Role may have limited direct purchasing authority" };
}

function extractFunctionalArea(title: string): string | null {
  const t = title.toLowerCase();
  if (/product/i.test(t)) return "product strategy & roadmap";
  if (/technolog|engineer|it\b|information/i.test(t)) return "technology stack & software";
  if (/sale|revenue|business\s+dev/i.test(t)) return "sales enablement & revenue tools";
  if (/market/i.test(t)) return "marketing & demand generation";
  if (/operat/i.test(t)) return "operations & process optimization";
  if (/financ|treasury/i.test(t)) return "finance & procurement";
  if (/underw|claims|insur/i.test(t)) return "underwriting & insurance operations";
  if (/digital|transform/i.test(t)) return "digital transformation";
  if (/innovat|strateg/i.test(t)) return "innovation & strategic initiatives";
  return null;
}

/** Bulk-classify an array of leads, returning seniority data keyed by index */
export function classifyLeadsBatch(leads: { title?: string | null }[]): SeniorityResult[] {
  return leads.map(l => classifySeniority(l.title));
}

/** Sort comparator: lower rank = higher authority = first */
export function seniorityComparator(a: { seniority_rank?: number | null }, b: { seniority_rank?: number | null }): number {
  const ra = a.seniority_rank ?? 99;
  const rb = b.seniority_rank ?? 99;
  return ra - rb;
}
