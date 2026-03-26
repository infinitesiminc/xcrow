/**
 * Role NPCs — Maps real jobs from the DB into interactive characters on the territory map.
 * Each job becomes a character with personality shaped by its AI threat level.
 */
import type { FutureSkillCategory } from "@/hooks/use-future-skills";

export interface RoleNPC {
  jobId: string;
  title: string;
  company: string;
  department: string;
  automationRisk: number;       // 0-100
  augmentedPercent: number;     // 0-100
  territory: FutureSkillCategory;
  threatTier: "thriving" | "adapting" | "threatened";
  personality: string;
  greeting: string;
  slug?: string;
}

/** Map department strings to territory categories */
const DEPT_TO_TERRITORY: Record<string, FutureSkillCategory> = {
  "Engineering": "Technical",
  "Software Engineering": "Technical",
  "Product": "Strategic",
  "Product Management": "Strategic",
  "Design": "Creative",
  "UX Design": "Creative",
  "Marketing": "Creative",
  "Sales": "Communication",
  "Business Development": "Communication",
  "Customer Success": "Communication",
  "Data": "Analytical",
  "Data Science": "Analytical",
  "Analytics": "Analytical",
  "Research": "Analytical",
  "Finance": "Analytical",
  "Operations": "Strategic",
  "HR": "Leadership",
  "Human Resources": "Leadership",
  "People": "Leadership",
  "Legal": "Ethics",
  "Compliance": "Ethics",
  "Trust & Safety": "Ethics",
  "Security": "Ethics",
  "Infrastructure": "Technical",
  "IT": "Technical",
  "DevOps": "Technical",
  "General": "Strategic",
};

/** Fuzzy-match department to territory */
export function deptToTerritory(dept: string): FutureSkillCategory {
  if (!dept) return "Strategic";
  const lower = dept.toLowerCase();
  for (const [key, val] of Object.entries(DEPT_TO_TERRITORY)) {
    if (lower.includes(key.toLowerCase())) return val;
  }
  if (lower.includes("engine") || lower.includes("dev") || lower.includes("tech")) return "Technical";
  if (lower.includes("data") || lower.includes("analy") || lower.includes("research")) return "Analytical";
  if (lower.includes("design") || lower.includes("creat") || lower.includes("market")) return "Creative";
  if (lower.includes("sale") || lower.includes("business") || lower.includes("comm")) return "Communication";
  if (lower.includes("lead") || lower.includes("manag") || lower.includes("people") || lower.includes("hr")) return "Leadership";
  if (lower.includes("legal") || lower.includes("ethic") || lower.includes("secur") || lower.includes("trust")) return "Ethics";
  return "Strategic";
}

function getThreatTier(risk: number): "thriving" | "adapting" | "threatened" {
  if (risk >= 65) return "threatened";
  if (risk >= 35) return "adapting";
  return "thriving";
}

function getGreeting(title: string, tier: "thriving" | "adapting" | "threatened"): string {
  if (tier === "threatened") {
    return `I'm a ${title}. The ground is shifting beneath me — AI can already handle half of what I do. I need allies who understand what's coming.`;
  }
  if (tier === "adapting") {
    return `As a ${title}, I'm learning to work alongside AI every day. Some of my tasks are changing, but I'm finding new ways to add value. Want to see how?`;
  }
  return `Being a ${title} has never been more exciting. AI amplifies everything I do, and there are new skills emerging I never imagined. Let me show you.`;
}

function getPersonality(tier: "thriving" | "adapting" | "threatened"): string {
  if (tier === "threatened") return "Urgent and seeking help. Knows the clock is ticking.";
  if (tier === "adapting") return "Curious and resourceful. Actively evolving.";
  return "Confident and forward-looking. Embracing the future.";
}

export function jobToRoleNPC(job: {
  id: string;
  title: string;
  department?: string | null;
  automation_risk_percent?: number | null;
  augmented_percent?: number | null;
  slug?: string | null;
  companies?: { name: string } | null;
}): RoleNPC {
  const risk = job.automation_risk_percent ?? 40;
  const tier = getThreatTier(risk);
  return {
    jobId: job.id,
    title: job.title,
    company: job.companies?.name || "",
    department: job.department || "General",
    automationRisk: risk,
    augmentedPercent: job.augmented_percent ?? 50,
    territory: deptToTerritory(job.department || ""),
    threatTier: tier,
    personality: getPersonality(tier),
    greeting: getGreeting(job.title, tier),
    slug: job.slug ?? undefined,
  };
}

/** Threat tier colors */
export const THREAT_COLORS = {
  thriving:   { bg: "142 70% 45%", glow: "142 70% 55%", label: "Thriving" },
  adapting:   { bg: "45 90% 50%",  glow: "45 90% 60%",  label: "Adapting" },
  threatened: { bg: "0 70% 50%",   glow: "0 70% 60%",   label: "Threatened" },
} as const;

/** Territory hues for visual theming */
export const TERRITORY_HUES: Record<FutureSkillCategory, number> = {
  "Technical": 220,
  "Analytical": 200,
  "Creative": 30,
  "Strategic": 280,
  "Communication": 160,
  "Leadership": 45,
  "Ethics": 340,
  "Human Edge": 190,
};
