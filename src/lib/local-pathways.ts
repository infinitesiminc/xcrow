import { prebuiltRoles } from "@/data/prebuilt-roles";
import type { EscoMatchResult, EscoPathway } from "@/lib/esco-api";

/**
 * Generate career pathways locally from prebuilt roles data
 * when the ESCO API is unavailable.
 */
export function generateLocalPathways(jobTitle: string): EscoMatchResult | null {
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

  const currentSkills = new Set(
    currentRole.skills.map(s => s.name.toLowerCase())
  );

  const pathways: EscoPathway[] = [];

  for (const [key, role] of Object.entries(prebuiltRoles)) {
    if (key === currentKey) continue;

    const roleSkillNames = role.skills.map(s => s.name.toLowerCase());
    const shared = roleSkillNames.filter(s => currentSkills.has(s));
    const overlap = currentSkills.size > 0
      ? Math.round((shared.length / currentSkills.size) * 100)
      : 0;

    // Also check task similarity for roles with no direct skill overlap
    const currentTaskKeywords = new Set(
      currentRole.tasks.flatMap(t => t.name.toLowerCase().split(/\s+/))
    );
    const taskOverlap = role.tasks.filter(t =>
      t.name.toLowerCase().split(/\s+/).some(w => currentTaskKeywords.has(w) && w.length > 3)
    ).length;

    const combinedScore = overlap + (taskOverlap * 5);

    if (combinedScore > 0) {
      pathways.push({
        title: role.jobTitle,
        uri: `local:${key}`,
        skillOverlap: Math.min(overlap + taskOverlap * 3, 95),
        sharedSkills: shared.map(s =>
          role.skills.find(sk => sk.name.toLowerCase() === s)?.name || s
        ).slice(0, 5),
        totalSkills: role.skills.length,
        newSkillsNeeded: roleSkillNames
          .filter(s => !currentSkills.has(s))
          .map(s => role.skills.find(sk => sk.name.toLowerCase() === s)?.name || s)
          .slice(0, 5),
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
