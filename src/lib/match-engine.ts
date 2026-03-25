/**
 * match-engine.ts — Composite scoring engine for the Scout panel.
 *
 * Score = (50% × Skill Overlap) + (25% × Task Familiarity) + (25% × Department Affinity)
 *
 * Strategy: Start from jobs that have canonical skill links (2,900+),
 * then enrich with task clusters for scoring.
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

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
}

function similarity(a: string, b: string): number {
  const an = norm(a);
  const bn = norm(b);
  if (an === bn) return 1;
  if (an.includes(bn) || bn.includes(an)) return 0.8;
  const aWords = new Set(an.split(/\s+/));
  const bWords = new Set(bn.split(/\s+/));
  let overlap = 0;
  for (const w of aWords) {
    if (bWords.has(w) && w.length > 2) overlap++;
  }
  const maxLen = Math.max(aWords.size, bWords.size);
  return maxLen > 0 ? overlap / maxLen : 0;
}

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

  const deptAffinity = departmentAffinity(job.department, userDepts);

  const score = Math.round(
    (skillOverlap * 50 + taskFamiliarity * 25 + deptAffinity * 25)
  );

  return { score, skillOverlap, taskFamiliarity, deptAffinity, matchedSkills };
}

/* ── Data Fetching & Assembly ── */

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
 * Helper to paginate a supabase query to avoid the 1000-row default limit.
 */
async function fetchAllSkillLinks(): Promise<{ job_id: string; canonical_skill_id: string }[]> {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("job_future_skills")
      .select("job_id, canonical_skill_id")
      .not("canonical_skill_id", "is", null)
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function fetchAllClusters(): Promise<{ job_id: string; cluster_name: string; skill_names: string[] | null }[]> {
  const PAGE = 1000;
  const all: any[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from("job_task_clusters")
      .select("job_id, cluster_name, skill_names")
      .range(from, from + PAGE - 1);
    if (error || !data || data.length === 0) break;
    all.push(...data);
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
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
    .select("id, aliases");
  const canonicalIdSet = new Set<string>((allCanonical || []).map(s => s.id));
  const userCanonical = resolveUserCanonicalSkills(profile.earnedSkillIds, canonicalIdSet);

  // Even if userCanonical is empty, the user may have task/dept matches
  // Only bail if truly no signal
  if (
    userCanonical.size === 0 &&
    profile.completedTaskNames.length === 0 &&
    profile.departments.length === 0
  ) {
    return [];
  }

  // Step 1: Get all canonical skill links (job_id → skill_id)
  const allSkillLinks = await fetchAllSkillLinks();

  // Build job → canonical skills map
  const jobSkillMap = new Map<string, Set<string>>();
  const jobIdsWithSkills = new Set<string>();
  for (const link of allSkillLinks) {
    if (!link.canonical_skill_id || !link.job_id) continue;
    jobIdsWithSkills.add(link.job_id);
    let set = jobSkillMap.get(link.job_id);
    if (!set) { set = new Set(); jobSkillMap.set(link.job_id, set); }
    set.add(link.canonical_skill_id);
  }

  // Step 2: Get task clusters for those jobs (paginated)
  const allClusters = await fetchAllClusters();

  const jobClusterMap = new Map<string, string[]>();
  for (const cluster of allClusters) {
    if (!cluster.job_id) continue;
    let names = jobClusterMap.get(cluster.job_id);
    if (!names) { names = []; jobClusterMap.set(cluster.job_id, names); }
    names.push(cluster.cluster_name);

    // Also expand skill_names into canonical links via fuzzy match
    const skillNames = cluster.skill_names;
    if (skillNames && skillNames.length > 0) {
      let skillSet = jobSkillMap.get(cluster.job_id);
      if (!skillSet) { skillSet = new Set(); jobSkillMap.set(cluster.job_id, skillSet); }
      for (const sn of skillNames) {
        const snLower = norm(sn);
        for (const cid of canonicalIdSet) {
          const cidClean = cid.replace(/-/g, " ");
          if (similarity(snLower, cidClean) > 0.6) {
            skillSet.add(cid);
          }
        }
      }
    }
  }

  // Collect all relevant job IDs (have skills or clusters)
  const allJobIds = new Set<string>();
  for (const jid of jobSkillMap.keys()) allJobIds.add(jid);
  for (const jid of jobClusterMap.keys()) allJobIds.add(jid);

  if (allJobIds.size === 0) return [];

  // Step 3: Fetch job metadata for relevant jobs (paginated)
  const jobIdArr = [...allJobIds];
  const jobsMap = new Map<string, any>();

  // Fetch in batches of 500 to avoid URL length issues
  const BATCH = 500;
  for (let i = 0; i < jobIdArr.length; i += BATCH) {
    const batch = jobIdArr.slice(i, i + BATCH);
    const { data } = await supabase
      .from("jobs")
      .select("id, title, department, location, seniority, slug, company_id, companies!jobs_company_id_fkey ( name, logo_url )")
      .in("id", batch);
    if (data) {
      for (const j of data) jobsMap.set(j.id, j);
    }
  }

  // Step 4: Score each job
  const candidates: JobCandidate[] = [];
  for (const jobId of allJobIds) {
    const job = jobsMap.get(jobId);
    if (!job) continue;

    const canonicalSkillIds = [...(jobSkillMap.get(jobId) || [])];
    const taskClusterNames = jobClusterMap.get(jobId) || [];

    if (canonicalSkillIds.length === 0 && taskClusterNames.length === 0) continue;

    const { score, skillOverlap, taskFamiliarity, deptAffinity, matchedSkills } = scoreJob(
      { canonicalSkillIds, taskClusterNames, department: job.department },
      userCanonical,
      profile.completedTaskNames,
      profile.departments,
    );

    // Lower threshold — show anything with signal
    if (score < 5) continue;

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

  candidates.sort((a, b) => b.matchScore - a.matchScore);
  return candidates.slice(0, limit);
}
