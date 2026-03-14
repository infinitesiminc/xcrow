import { prebuiltRoles } from "@/data/prebuilt-roles";

export interface CareerPathway {
  title: string;
  uri: string;
  skillOverlap: number;
  sharedSkills: string[];
  totalSkills: number;
  newSkillsNeeded: string[];
}

export interface CareerMatchResult {
  primary: {
    title: string;
    uri: string;
    skillCount: number;
    essentialSkills: string[];
  };
  pathways: CareerPathway[];
}

/** Extract meaningful keywords from a skill/task name */
function extractKeywords(text: string): Set<string> {
  const stopWords = new Set([
    "a", "an", "the", "and", "or", "for", "of", "in", "to", "with", "&",
    "is", "are", "was", "be", "has", "had", "do", "does", "did", "not",
  ]);
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w))
  );
}

/** Calculate keyword overlap score between two sets of keywords */
function keywordOverlap(setA: Set<string>, setB: Set<string>): number {
  let matches = 0;
  for (const word of setA) {
    if (setB.has(word)) matches++;
  }
  return matches;
}

/**
 * Generate career pathways locally from prebuilt roles data
 * when the ESCO API is unavailable.
 */
export function generateLocalPathways(jobTitle: string): CareerMatchResult | null {
  const normalized = jobTitle.toLowerCase().trim();

  // Find the current role
  let currentKey: string | null = null;
  for (const key of Object.keys(prebuiltRoles)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      currentKey = key;
      break;
    }
  }

  const currentRole = currentKey ? prebuiltRoles[currentKey] : null;
  if (!currentRole) return null;

  // Build keyword profile for current role from skills + tasks
  const currentSkillKeywords = new Set<string>();
  for (const s of currentRole.skills) {
    for (const kw of extractKeywords(s.name)) currentSkillKeywords.add(kw);
    for (const kw of extractKeywords(s.description)) currentSkillKeywords.add(kw);
  }
  const currentTaskKeywords = new Set<string>();
  for (const t of currentRole.tasks) {
    for (const kw of extractKeywords(t.name)) currentTaskKeywords.add(kw);
  }

  const pathways: CareerPathway[] = [];

  for (const [key, role] of Object.entries(prebuiltRoles)) {
    if (key === currentKey) continue;

    // Build keyword profile for candidate role
    const roleSkillKeywords = new Set<string>();
    for (const s of role.skills) {
      for (const kw of extractKeywords(s.name)) roleSkillKeywords.add(kw);
      for (const kw of extractKeywords(s.description)) roleSkillKeywords.add(kw);
    }
    const roleTaskKeywords = new Set<string>();
    for (const t of role.tasks) {
      for (const kw of extractKeywords(t.name)) roleTaskKeywords.add(kw);
    }

    // Calculate overlap scores
    const skillKwOverlap = keywordOverlap(currentSkillKeywords, roleSkillKeywords);
    const taskKwOverlap = keywordOverlap(currentTaskKeywords, roleTaskKeywords);
    const totalCurrentKw = currentSkillKeywords.size + currentTaskKeywords.size;

    const overlapPercent = totalCurrentKw > 0
      ? Math.round(((skillKwOverlap * 1.5 + taskKwOverlap) / totalCurrentKw) * 100)
      : 0;

    // Clamp to reasonable range
    const clampedOverlap = Math.min(Math.max(overlapPercent, 0), 92);

    if (clampedOverlap >= 15) {
      // Find shared skill themes (human-readable)
      const sharedSkills: string[] = [];
      for (const s of role.skills) {
        const sKw = extractKeywords(s.name);
        if (keywordOverlap(sKw, currentSkillKeywords) >= 1) {
          sharedSkills.push(s.name);
        }
      }

      // Find new skills needed
      const newSkills: string[] = [];
      for (const s of role.skills) {
        const sKw = extractKeywords(s.name);
        if (keywordOverlap(sKw, currentSkillKeywords) === 0) {
          newSkills.push(s.name);
        }
      }

      pathways.push({
        title: role.jobTitle,
        uri: `local:${key}`,
        skillOverlap: clampedOverlap,
        sharedSkills: sharedSkills.slice(0, 5),
        totalSkills: role.skills.length,
        newSkillsNeeded: newSkills.slice(0, 5),
      });
    }
  }

  pathways.sort((a, b) => b.skillOverlap - a.skillOverlap);

  return {
    primary: {
      title: currentRole.jobTitle,
      uri: `local:${currentKey}`,
      skillCount: currentRole.skills.length,
      essentialSkills: currentRole.skills
        .filter(s => s.priority === "high")
        .map(s => s.name),
    },
    pathways: pathways.slice(0, 5),
  };
}
