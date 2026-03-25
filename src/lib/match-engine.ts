/**
 * match-engine.ts — Composite scoring engine for the Scout panel.
 *
 * Score = (50% × Skill Overlap) + (25% × Task Familiarity) + (25% × Department Affinity)
 *
 * All scoring runs client-side (MVP approach).
 */

import { resolveUserCanonicalSkills, GENERIC_TO_CANONICAL } from "./skill-id-map";
import { supabase } from "@/integrations/supabase/client";

/* ── Types ── */

export interface UserProfile {
  earnedSkillIds: string[];
  completedTaskNames: string[];
  departments: string[];
  jobTitles: string[];
}

export interface JobCandidate {
  id: string;
  title: string;
  company: string | null;
  companyLogo: string | null;
  department: string | null;
  location: string | null;
  seniority: string | null;
  slug: string | null;
  canonicalSkillIds: string[];
  taskClusterNames: string[];
  matchScore: number;
  skillOverlap: number;
  taskFamiliarity: number;
  departmentAffinity: number;
  matchedSkills: string[];
}

/* ── Helpers ── */

/** Normalize strings for comparison */
function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

/** Simple similarity: longest common substring ratio */
function similarity(a: string, b: string): number {
  const an = norm(a);
  const bn = norm(b);
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.8;

  // Word overlap ratio
  const aWords = new Set(an.split(/\s+/));
  const bWords = new Set(bn.split(/\s+/));
  let overlap = 0;
  for (const w of aWords) {
    if (bWords.has(w) && w.length > 2) overlap++;
  }
  const maxLen = Math.max(aWords.size, bWords.size);
  return maxLen > 0 ? overlap / maxLen : 0;
}

/** Department affinity: 1.0 exact, 0.5 related, 0 unrelated */
function departmentAffinity(jobDept: string | null, userDepts: string[]): number {
  if (!jobDept || userDepts.length === 0) return 0;
  const jn = norm(jobDept);

  for (const ud of userDepts) {
    const un = norm(ud);
    if (jn === un) return 1.0;
    if (jn.includes(un) || un.includes(jn)) return 0.8;
    if (similarity(jn, un) > 0.5) return 0.5;
  }

  return 0;
}

/* ── Core Scoring ── */

function scoreJob(
  job: {
    canonicalSkillIds: string[];
    taskClusterNames: string[];
    department: string | null;
  },
  userCanonical: Set<string>,
  userTaskNames: string[],
  userDepts: string[],
): { score: number; skillOverlap: number; taskFamiliarity: number; deptAffinity: number; matchedSkills: string[] } {
  // Skill Overlap (50%)
  const jobSkills = job.canonicalSkillIds;
  let skillOverlap = 0;
  const matchedSkills: string[] = [];
  if (jobSkills.length > 0) {
    for (const sk of jobSkills) {
      if (userCanonical.has(sk)) {
        matchedSkills.push(sk);
      }
    }
    skillOverlap = matchedSkills.length / jobSkills.length;
  }

  // Task Familiarity (25%)
  let taskFamiliarity = 0;
  if (job.taskClusterNames.length > 0 && userTaskNames.length > 0) {
    let matched = 0;
    for (const tc of job.taskClusterNames) {
      for (const ut of userTaskNames) {
        if (similarity(tc, ut) > 0.5) {
          matched++;
          break;
        }
      }
    }
    taskFamiliarity = matched / job.taskClusterNames.length;
  }

  // Department Affinity (25%)
  const deptAffinity = departmentAffinity(job.department, userDepts);

  const score = Math.round(
    (skillOverlap * 50 + taskFamiliarity * 25 + deptAffinity * 25)
  );

  return { score, skillOverlap, taskFamiliarity, deptAffinity, matchedSkills };
}

/* ── Data Fetching & Assembly ── */

/**
 * Build the user's matching profile from their completed simulations.
 */
export async function buildUserProfile(userId: string): Promise<UserProfile> {
  const { data: sims } = await supabase
    .from("completed_simulations")
    .select("task_name, job_title, department, skills_earned")
    .eq("user_id", userId);

  const earnedIds = new Set<string>();
  const taskNames = new Set<string>();
  const departments = new Set<string>();
  const jobTitles = new Set<string>();

  for (const sim of sims || []) {
    if (sim.task_name) taskNames.add(sim.task_name);
    if (sim.department) departments.add(sim.department);
    if (sim.job_title) jobTitles.add(sim.job_title);

    const earned = sim.skills_earned as { skill_id: string }[] | null;
    if (Array.isArray(earned)) {
      for (const se of earned) earnedIds.add(se.skill_id);
    }
  }

  return {
    earnedSkillIds: [...earnedIds],
    completedTaskNames: [...taskNames],
    departments: [...departments],
    jobTitles: [...jobTitles],
  };
}

/**
 * Fetch and score jobs against a user profile. Returns sorted candidates.
 */
export async function matchJobsForUser(
  profile: UserProfile,
  limit = 100,
): Promise<JobCandidate[]> {
  // Resolve user's canonical skills
  const { data: allCanonical } = await supabase
    .from("canonical_future_skills")
    .select("id");
  const canonicalIdSet = new Set<string>((allCanonical || []).map(s => s.id));
  const userCanonical = resolveUserCanonicalSkills(profile.earnedSkillIds, canonicalIdSet);

  if (userCanonical.size === 0 && profile.completedTaskNames.length === 0 && profile.departments.length === 0) {
    return [];
  }

  // Fetch jobs that have either canonical links or task clusters
  // We fetch more than `limit` and filter client-side
  const { data: jobs } = await supabase
    .from("jobs")
    .select(`
      id, title, department, location, seniority, slug,
      company_id,
      companies!jobs_company_id_fkey ( name, logo_url )
    `)
    .not("title", "is", null)
    .limit(1000);

  if (!jobs || jobs.length === 0) return [];

  const jobIds = jobs.map(j => j.id);

  // Batch fetch canonical skill links and task clusters
  const [skillLinksRes, clustersRes] = await Promise.all([
    supabase
      .from("job_future_skills")
      .select("job_id, canonical_skill_id")
      .in("job_id", jobIds)
      .not("canonical_skill_id", "is", null),
    supabase
      .from("job_task_clusters")
      .select("job_id, cluster_name, skill_names")
      .in("job_id", jobIds),
  ]);

  // Build lookup maps
  const jobSkillMap = new Map<string, Set<string>>();
  for (const link of skillLinksRes.data || []) {
    if (!link.canonical_skill_id) continue;
    let set = jobSkillMap.get(link.job_id!);
    if (!set) { set = new Set(); jobSkillMap.set(link.job_id!, set); }
    set.add(link.canonical_skill_id);
  }

  // Also fuzzy-match task cluster skill_names to canonical skills
  const canonicalNames = new Map<string, string>(); // norm(name) → id
  for (const id of canonicalIdSet) {
    // We need names — reconstruct from ID (slug form)
    canonicalNames.set(id, id);
  }

  const jobClusterMap = new Map<string, string[]>();
  for (const cluster of clustersRes.data || []) {
    const jobId = cluster.job_id!;
    let names = jobClusterMap.get(jobId);
    if (!names) { names = []; jobClusterMap.set(jobId, names); }
    names.push(cluster.cluster_name);

    // Also expand skill_names into canonical links
    const skillNames = cluster.skill_names as string[] | null;
    if (skillNames) {
      let skillSet = jobSkillMap.get(jobId);
      if (!skillSet) { skillSet = new Set(); jobSkillMap.set(jobId, skillSet); }
      for (const sn of skillNames) {
        const snLower = norm(sn);
        // Check all canonical IDs for fuzzy match
        for (const cid of canonicalIdSet) {
          const cidClean = cid.replace(/-/g, " ");
          if (similarity(snLower, cidClean) > 0.6) {
            skillSet.add(cid);
          }
        }
      }
    }
  }

  // Score each job
  const candidates: JobCandidate[] = [];
  for (const job of jobs) {
    const canonicalSkillIds = [...(jobSkillMap.get(job.id) || [])];
    const taskClusterNames = jobClusterMap.get(job.id) || [];

    // Skip jobs with no matching data at all
    if (canonicalSkillIds.length === 0 && taskClusterNames.length === 0) continue;

    const { score, skillOverlap, taskFamiliarity, deptAffinity, matchedSkills } = scoreJob(
      { canonicalSkillIds, taskClusterNames, department: job.department },
      userCanonical,
      profile.completedTaskNames,
      profile.departments,
    );

    if (score < 10) continue;

    const company = (job as any).companies;

    candidates.push({
      id: job.id,
      title: job.title,
      company: company?.name || null,
      companyLogo: company?.logo_url || null,
      department: job.department,
      location: job.location,
      seniority: job.seniority,
      slug: job.slug,
      canonicalSkillIds,
      taskClusterNames,
      matchScore: score,
      skillOverlap: Math.round(skillOverlap * 100),
      taskFamiliarity: Math.round(taskFamiliarity * 100),
      departmentAffinity: Math.round(deptAffinity * 100),
      matchedSkills,
    });
  }

  // Sort by score desc
  candidates.sort((a, b) => b.matchScore - a.matchScore);

  return candidates.slice(0, limit);
}
