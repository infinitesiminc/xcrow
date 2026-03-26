/**
 * Automation Degree Framework (D1–D5)
 * Maps roles/tasks to a 5-level scale based on AI exposure and automation risk.
 */

export interface AutomationDegree {
  level: number;
  code: string;
  label: string;
  shortLabel: string;
  description: string;
  emoji: string;
  /** HSL hue for theming */
  hue: number;
}

export const AUTOMATION_DEGREES: AutomationDegree[] = [
  {
    level: 1,
    code: "D1",
    label: "Tool-Assisted",
    shortLabel: "Assisted",
    description: "AI handles simple subtasks; human does the core work with occasional tool help.",
    emoji: "🔧",
    hue: 210,
  },
  {
    level: 2,
    code: "D2",
    label: "Co-Piloted",
    shortLabel: "Co-Pilot",
    description: "AI drafts and suggests; human reviews, edits, and makes all key decisions.",
    emoji: "🤝",
    hue: 170,
  },
  {
    level: 3,
    code: "D3",
    label: "Supervised Autonomy",
    shortLabel: "Supervised",
    description: "AI executes most tasks independently; human sets goals and approves outputs.",
    emoji: "👁️",
    hue: 45,
  },
  {
    level: 4,
    code: "D4",
    label: "Managed Fleet",
    shortLabel: "Fleet Mgr",
    description: "Multiple AI agents run in parallel; human orchestrates, monitors, and intervenes on exceptions.",
    emoji: "🚀",
    hue: 25,
  },
  {
    level: 5,
    code: "D5",
    label: "Strategic Oversight",
    shortLabel: "Oversight",
    description: "AI systems handle end-to-end workflows; human focuses on strategy, ethics, and edge cases.",
    emoji: "🏛️",
    hue: 0,
  },
];

/**
 * Derive automation degree from risk + augmented percentages.
 * Higher risk + lower augmented = higher degree (more automated).
 */
export function getAutomationDegree(
  automationRiskPercent: number,
  augmentedPercent: number,
): AutomationDegree {
  // Composite score: 0–100 where 100 = fully autonomous
  const score = Math.round(automationRiskPercent * 0.6 + augmentedPercent * 0.4);

  if (score >= 80) return AUTOMATION_DEGREES[4]; // D5
  if (score >= 60) return AUTOMATION_DEGREES[3]; // D4
  if (score >= 40) return AUTOMATION_DEGREES[2]; // D3
  if (score >= 20) return AUTOMATION_DEGREES[1]; // D2
  return AUTOMATION_DEGREES[0]; // D1
}

/**
 * Get degree color as a CSS-compatible HSL string using the degree's hue.
 */
export function degreeColor(degree: AutomationDegree): string {
  return `hsl(${degree.hue} 70% 55%)`;
}

export function degreeBgClass(degree: AutomationDegree): string {
  // Return a consistent muted background based on level
  const map: Record<number, string> = {
    1: "bg-blue-500/15 text-blue-400",
    2: "bg-teal-500/15 text-teal-400",
    3: "bg-amber-500/15 text-amber-400",
    4: "bg-orange-500/15 text-orange-400",
    5: "bg-red-500/15 text-red-400",
  };
  return map[degree.level] || map[1];
}
