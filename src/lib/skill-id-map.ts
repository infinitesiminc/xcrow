/**
 * skill-id-map.ts — Static mapping from legacy generic skill IDs
 * (used in completed_simulations.skills_earned) to canonical_future_skills.id values.
 *
 * Bucket A skills (direct canonical IDs) need no mapping — they pass through.
 * Bucket B skills (generic categories like "code-dev") are mapped here.
 */

export const GENERIC_TO_CANONICAL: Record<string, string[]> = {
  "code-dev": [
    "ai-code-review",
    "ai-code-audit-optimization",
    "algorithm-development",
  ],
  "data-analysis": [
    "critical-data-analysis",
    "data-architecture-design",
    "data-integrity-management",
  ],
  "team-mgmt": [
    "ai-collaboration-management-orchestration",
    "aihuman-teaming-collaboration",
  ],
  "testing-qa": [
    "intelligent-quality-strategy",
    "ai-model-auditing-validation",
  ],
  "strategy": [
    "strategic-planning",
    "strategic-analytical-thinking",
    "strategic-oversight-innovation",
  ],
  "design-ux": [
    "humancentric-design-empathy",
    "creative-direction-innovation",
    "aidriven-ux-strategy",
  ],
  "system-design": [
    "distributed-systems-architecture",
    "ai-agent-architecture-orchestration",
    "complex-solution-architecture",
  ],
  "writing-docs": [
    "ai-content-strategy-governance",
    "ai-content-curation-editing",
    "ai-documentation-curation",
  ],
  "ai-ml": [
    "ai-framework-expertise",
    "ai-tool-integration-mastery",
    "ai-model-management-refinement",
  ],
  "critical-thinking": [
    "strategic-problem-solving",
    "critical-ai-evaluation",
    "critical-systems-evaluation-thinking",
  ],
  "financial-modeling": [
    "financial-narrative-crafting",
    "proactive-cost-optimization",
    "performance-modeling-optimization",
  ],
  "sales": [
    "aienhanced-negotiation-ethics",
    "complex-deal-negotiation",
    "consultative-communication",
  ],
  "stakeholder-mgmt": [
    "stakeholder-communication",
    "stakeholder-empathy-in-the-ai-age",
    "stakeholder-ai-collaboration-empathy",
  ],
  "risk-assessment": [
    "aidriven-risk-management",
    "complex-threat-modeling",
  ],
  "regulatory": [
    "compliance-strategy",
    "policytech-translation",
    "aidriven-regulatory-interpretation",
  ],
  "research": [
    "ethical-ai-research",
    "trend-forecasting",
    "strategic-questioning-hypothesis-generation",
  ],
  "presentation": [
    "consultative-communication",
    "strategic-narrative-persuasion",
  ],
  "devops": [
    "distributed-systems-architecture",
    "ai-operations-aiops",
  ],
  "vendor-mgmt": [
    "ai-partnership-curation",
    "complex-deal-negotiation",
  ],
  "data-engineering": [
    "data-architecture-design",
    "data-integrity-management",
    "strategic-data-sourcing",
  ],
  "security": [
    "complex-threat-modeling",
    "data-security-analytics",
    "resilience-engineering",
  ],
  "project-mgmt": [
    "strategic-planning",
    "process-optimization-strategy",
  ],
  "marketing": [
    "aidriven-market-strategy",
    "algorithmic-brand-storytelling",
    "growth-hacking-experimentation",
  ],
  "customer-service": [
    "empathetic-aihuman-handoffs",
    "complex-conflict-resolution",
    "relational-intelligence",
  ],
  "hr": [
    "strategic-hr-planning",
    "datadriven-talent-analytics",
    "candidate-experience-design",
  ],
  "operations": [
    "process-optimization-strategy",
    "exception-handling-oversight",
    "ai-operations-aiops",
  ],
  "legal": [
    "legal-tech-integration",
    "compliance-strategy",
    "critical-compliance-analysis",
  ],
  "communication": [
    "strategic-narrative-persuasion",
    "crosscultural-ai-communication-management",
    "consultative-communication",
  ],
};

/**
 * Resolve a user's earned skill IDs into canonical future skill IDs.
 * Direct canonical IDs pass through; generic IDs are expanded via the map.
 */
export function resolveUserCanonicalSkills(
  earnedSkillIds: string[],
  canonicalIdSet: Set<string>,
): Set<string> {
  const resolved = new Set<string>();
  for (const id of earnedSkillIds) {
    if (canonicalIdSet.has(id)) {
      resolved.add(id);
    }
    const mapped = GENERIC_TO_CANONICAL[id];
    if (mapped) {
      for (const cid of mapped) resolved.add(cid);
    }
  }
  return resolved;
}
