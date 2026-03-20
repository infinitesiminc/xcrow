/**
 * Skill Relationships — defines edges between skills based on semantic proximity.
 * No categories — skills cluster organically by how they relate in real work.
 * 
 * Relationship strength: 1 (weak) to 3 (strong)
 * This drives the force-directed layout: stronger = closer.
 */

export interface SkillEdge {
  from: string;
  to: string;
  strength: 1 | 2 | 3;
}

/**
 * Hand-curated relationship graph.
 * Skills that frequently co-occur in jobs or share transferable knowledge.
 */
export const SKILL_EDGES: SkillEdge[] = [
  // Software ecosystem
  { from: "code-dev", to: "system-design", strength: 3 },
  { from: "code-dev", to: "testing-qa", strength: 3 },
  { from: "code-dev", to: "devops", strength: 2 },
  { from: "code-dev", to: "ai-ml", strength: 2 },
  { from: "code-dev", to: "data-engineering", strength: 2 },
  { from: "code-dev", to: "prompt-eng", strength: 2 },
  { from: "system-design", to: "security", strength: 2 },
  { from: "system-design", to: "devops", strength: 2 },
  { from: "testing-qa", to: "security", strength: 2 },
  { from: "devops", to: "security", strength: 2 },
  
  // Data & AI cluster
  { from: "ai-ml", to: "data-engineering", strength: 3 },
  { from: "ai-ml", to: "data-analysis", strength: 2 },
  { from: "ai-ml", to: "prompt-eng", strength: 3 },
  { from: "data-engineering", to: "data-analysis", strength: 3 },
  { from: "data-analysis", to: "financial-modeling", strength: 2 },
  { from: "data-analysis", to: "research", strength: 2 },
  
  // Strategy & thinking
  { from: "strategy", to: "critical-thinking", strength: 3 },
  { from: "strategy", to: "project-mgmt", strength: 2 },
  { from: "strategy", to: "product-sense", strength: 2 },
  { from: "critical-thinking", to: "risk-assessment", strength: 2 },
  { from: "critical-thinking", to: "research", strength: 2 },
  
  // People & communication
  { from: "team-mgmt", to: "emotional-iq", strength: 3 },
  { from: "team-mgmt", to: "change-mgmt", strength: 3 },
  { from: "team-mgmt", to: "stakeholder-mgmt", strength: 2 },
  { from: "emotional-iq", to: "stakeholder-mgmt", strength: 2 },
  { from: "emotional-iq", to: "negotiation", strength: 2 },
  { from: "stakeholder-mgmt", to: "presentation", strength: 2 },
  { from: "stakeholder-mgmt", to: "negotiation", strength: 2 },
  { from: "negotiation", to: "sales", strength: 3 },
  
  // Communication
  { from: "writing-docs", to: "presentation", strength: 2 },
  { from: "writing-docs", to: "content-seo", strength: 2 },
  { from: "presentation", to: "sales", strength: 2 },
  
  // Creative & product
  { from: "design-ux", to: "product-sense", strength: 3 },
  { from: "design-ux", to: "brand-creative", strength: 2 },
  { from: "brand-creative", to: "content-seo", strength: 3 },
  { from: "product-sense", to: "research", strength: 2 },
  
  // Process & operations
  { from: "process-optimization", to: "project-mgmt", strength: 2 },
  { from: "process-optimization", to: "vendor-mgmt", strength: 2 },
  { from: "vendor-mgmt", to: "negotiation", strength: 2 },
  
  // Governance & compliance
  { from: "regulatory", to: "audit-control", strength: 3 },
  { from: "regulatory", to: "risk-assessment", strength: 3 },
  { from: "audit-control", to: "financial-modeling", strength: 2 },
  { from: "risk-assessment", to: "process-optimization", strength: 1 },
  
  // Cross-domain bridges
  { from: "change-mgmt", to: "process-optimization", strength: 2 },
  { from: "prompt-eng", to: "content-seo", strength: 1 },
  { from: "data-analysis", to: "process-optimization", strength: 1 },
  { from: "sales", to: "brand-creative", strength: 1 },
  { from: "project-mgmt", to: "team-mgmt", strength: 2 },
];

/**
 * Get all edges for a given skill.
 */
export function getSkillEdges(skillId: string): SkillEdge[] {
  return SKILL_EDGES.filter(e => e.from === skillId || e.to === skillId);
}

/**
 * Get neighbor skill IDs with their strength.
 */
export function getNeighbors(skillId: string): { id: string; strength: number }[] {
  return SKILL_EDGES
    .filter(e => e.from === skillId || e.to === skillId)
    .map(e => ({
      id: e.from === skillId ? e.to : e.from,
      strength: e.strength,
    }));
}
