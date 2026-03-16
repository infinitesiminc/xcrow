/**
 * Generates mock team-progress data from REAL jobs & task clusters in the database.
 * Each job gets 1 mock employee; ~70% are "started" with realistic simulation records.
 */

import { supabase } from "@/integrations/supabase/client";

export interface DemoProgressRow {
  user_id: string;
  display_name: string;
  job_title: string;
  task_name: string;
  sim_job_title: string;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  department: string;
  tool_awareness_score: number;
  human_value_add_score: number;
  adaptive_thinking_score: number;
  domain_judgment_score: number;
}

export interface DemoEmployee {
  id: string;
  name: string;
  dept: string;
  role: string;
  analyzed: boolean;
  started: boolean;
}

export interface DemoFunnelStats {
  jobsImported: number;
  jobsAnalyzed: number;
  rolesActivated: number;
  employeesStarted: number;
}

export interface WeeklyTrend {
  week: string;
  score: number;
}

export interface DeptTrendData {
  dept: string;
  employees: number;
  analyzedRoles: number;
  started: number;
  completionRate: number;
  avgReadiness: number;
  weakestPillar: string;
  weakestScore: number;
  trend: WeeklyTrend[];
  delta: number;
}

/* ── Seeded random ── */
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const FIRST_NAMES = [
  "Aaliya","Adem","Aisha","Alex","Amara","Ana","Andrei","Anita","Anton","Aria",
  "Ben","Bianca","Boris","Camila","Carlos","Carmen","Celine","Chen","Clara","Corey",
  "Dalia","Daniel","Dara","David","Diana","Diego","Eli","Elena","Emil","Emma",
  "Ethan","Farah","Felix","Freya","Gabriel","Grace","Hana","Harper","Hassan","Hugo",
  "Ida","Ines","Isaac","Ivan","Jade","James","Jana","Javier","Jia","Joel",
  "Jordan","Julia","Kai","Karen","Kira","Kofi","Lara","Leo","Lena","Liam",
  "Lily","Lin","Luca","Luna","Mai","Marco","Maria","Marina","Mateo","Maya",
  "Mia","Milan","Mira","Nadia","Nate","Nina","Noah","Noor","Olga","Omar",
  "Pablo","Pari","Paul","Petra","Quinn","Rafael","Ravi","Reina","Ren","Rhea",
  "Rita","Rosa","Ryan","Sadie","Sam","Sara","Sasha","Seo-yun","Simone","Sofia",
  "Soren","Tara","Teo","Theo","Tina","Uma","Vera","Victor","Wendy","Yara",
  "Yuki","Zara","Zoe","Amira","Baran","Cai","Devi","Ezra","Fiona","Gael",
  "Hiro","Isla","Jay","Kaya","Lars","Mei","Nia","Odin","Priya","Rio",
  "Ayla","Bao","Cora","Dane","Eve","Finn","Gwen","Heath","Ivy","Jin",
  "Kara","Lane","Max","Nell","Oz","Penn","Remy","Sky","Troy","Val",
  "Wren","Xia","Yves","Zion","Ada","Blu","Cruz","Drew","Elm","Fox",
  "Gia","Hal","Io","Jude","Kit","Lou","Neo","Ora","Pax","Rue",
  "Sol","Ty","Uri","Viv","Wes","Xen","Yael","Zen","Ash","Bay",
  "Col","Dot","Emi","Fay","Gil","Hue","Isa","Jet","Kol","Luz",
  "Moe","Nia","Ori","Pi","Qi","Rex","Sia","Tom","Una","Vox",
];

const LAST_NAMES = [
  "Agarwal","Andersson","Becker","Bergström","Castillo","Chang","Chen","Cho","Cruz","Dubois",
  "Eriksson","Fernandez","Fischer","Garcia","Gomes","Gupta","Hansen","Hernandez","Ibrahim","Ito",
  "Jansen","Johnson","Kang","Kim","Klein","Kumar","Larsson","Lee","Li","Lindqvist",
  "Lopez","Lund","Martinez","Meyer","Mora","Morales","Müller","Nakamura","Ng","Nielsen",
  "O'Brien","Okafor","Olsen","Ortiz","Park","Patel","Petrov","Ramirez","Ramos","Reyes",
  "Rivera","Rodriguez","Rossi","Sato","Schmidt","Schneider","Shah","Sharma","Silva","Singh",
  "Soto","Suzuki","Takahashi","Tanaka","Torres","Tran","Vargas","Vasquez","Volkov","Wagner",
  "Wang","Weber","Williams","Wong","Wu","Yamamoto","Yang","Yilmaz","Zhang","Zhou",
  "Abbott","Blair","Choi","Diaz","Evans","Flynn","Grant","Hayes","Irwin","James",
  "Knox","Lewis","Moore","Nash","Owen","Price","Quinn","Reed","Stone","Todd",
];

interface DbJob {
  id: string;
  title: string;
  department: string | null;
  augmented_percent: number | null;
}

interface DbCluster {
  job_id: string;
  cluster_name: string;
  ai_exposure_score: number | null;
}

/* ── Cache ── */
let _cache: {
  employees: DemoEmployee[];
  progress: DemoProgressRow[];
  funnel: DemoFunnelStats;
  trends: DeptTrendData[];
} | null = null;

export async function generateMockFromDB(): Promise<{
  employees: DemoEmployee[];
  progress: DemoProgressRow[];
  funnel: DemoFunnelStats;
  trends: DeptTrendData[];
}> {
  if (_cache) return _cache;

  // Fetch all jobs (paginated for >1000)
  const allJobs: DbJob[] = [];
  let from = 0;
  const batchSize = 1000;
  while (true) {
    const { data } = await supabase
      .from("jobs")
      .select("id, title, department, augmented_percent")
      .order("title")
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allJobs.push(...(data as DbJob[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  // Fetch all task clusters (paginated)
  const allClusters: DbCluster[] = [];
  from = 0;
  while (true) {
    const { data } = await supabase
      .from("job_task_clusters")
      .select("job_id, cluster_name, ai_exposure_score")
      .range(from, from + batchSize - 1);
    if (!data || data.length === 0) break;
    allClusters.push(...(data as DbCluster[]));
    if (data.length < batchSize) break;
    from += batchSize;
  }

  // Group clusters by job_id
  const clustersByJob: Record<string, DbCluster[]> = {};
  for (const c of allClusters) {
    (clustersByJob[c.job_id] ??= []).push(c);
  }

  const rand = seededRandom(42);
  const simRand = seededRandom(1337);
  const pick = <T>(arr: T[]): T => arr[Math.floor(simRand() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(simRand() * (max - min + 1)) + min;

  const usedNames = new Set<string>();
  const getName = () => {
    let name: string;
    let attempts = 0;
    do {
      name = `${FIRST_NAMES[Math.floor(rand() * FIRST_NAMES.length)]} ${LAST_NAMES[Math.floor(rand() * LAST_NAMES.length)]}`;
      attempts++;
    } while (usedNames.has(name) && attempts < 200);
    usedNames.add(name);
    return name;
  };

  // Determine which jobs are analyzed (have task clusters)
  const analyzedJobIds = new Set(Object.keys(clustersByJob));

  const employees: DemoEmployee[] = [];
  const progressRows: DemoProgressRow[] = [];
  const baseDate = new Date("2026-03-15T00:00:00Z").getTime();

  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];
    const dept = job.department || "Other";
    const isAnalyzed = analyzedJobIds.has(job.id);
    // ~70% of analyzed employees have started
    const hasStarted = isAnalyzed && rand() < 0.7;

    const emp: DemoEmployee = {
      id: `mock-${i}`,
      name: getName(),
      dept,
      role: job.title,
      analyzed: isAnalyzed,
      started: hasStarted,
    };
    employees.push(emp);

    if (!hasStarted) continue;

    // Generate 1-4 simulation records using real task cluster names
    const jobClusters = clustersByJob[job.id] || [];
    if (jobClusters.length === 0) continue;

    const simCount = simRand() < 0.3 ? 1 : simRand() < 0.6 ? 2 : simRand() < 0.85 ? 3 : 4;
    const usedTasks = new Set<string>();

    for (let s = 0; s < Math.min(simCount, jobClusters.length); s++) {
      let cluster: DbCluster;
      let attempts = 0;
      do {
        cluster = pick(jobClusters);
        attempts++;
      } while (usedTasks.has(cluster.cluster_name) && attempts < 20);
      usedTasks.add(cluster.cluster_name);

      const daysAgo = randInt(0, 27);
      const hoursOffset = randInt(7, 18);
      const completedAt = new Date(baseDate - daysAgo * 86400000 + hoursOffset * 3600000).toISOString();

      const total = 5;
      const correct = Math.min(total, Math.max(1, randInt(2, 5)));

      // Archetype-based scoring for realistic spread
      const archetype = Math.floor(simRand() * 5);
      const base = archetype === 3 ? randInt(25, 45) : archetype === 4 ? randInt(80, 95) : archetype === 0 ? randInt(55, 75) : randInt(50, 70);
      const clamp = (v: number) => Math.min(100, Math.max(10, v));

      progressRows.push({
        user_id: emp.id,
        display_name: emp.name,
        job_title: emp.role,
        task_name: cluster.cluster_name,
        sim_job_title: emp.role,
        correct_answers: correct,
        total_questions: total,
        completed_at: completedAt,
        department: dept,
        tool_awareness_score: clamp(base + (archetype === 1 ? randInt(15, 30) : archetype === 3 ? randInt(-20, -5) : randInt(-8, 12))),
        human_value_add_score: clamp(base + (archetype === 2 ? randInt(15, 30) : archetype === 4 ? randInt(-25, -10) : randInt(-10, 8))),
        adaptive_thinking_score: clamp(base + (archetype === 0 ? randInt(-25, -8) : randInt(-5, 15))),
        domain_judgment_score: clamp(base + (archetype === 1 ? randInt(-20, -5) : archetype === 4 ? randInt(10, 25) : randInt(-8, 10))),
      });
    }
  }

  // Build funnel stats
  const funnel: DemoFunnelStats = {
    jobsImported: allJobs.length,
    jobsAnalyzed: employees.filter(e => e.analyzed).length,
    rolesActivated: employees.filter(e => e.analyzed).length,
    employeesStarted: employees.filter(e => e.started).length,
  };

  // Build department trends
  const pillarKeys = ["tool_awareness_score", "human_value_add_score", "adaptive_thinking_score", "domain_judgment_score"] as const;
  const pillarLabels = ["Tool Awareness", "Human Value-Add", "Adaptive Thinking", "Domain Judgment"];
  const deptSet = new Set(employees.map(e => e.dept));
  const trendRand = seededRandom(9999);

  const trends: DeptTrendData[] = Array.from(deptSet).map(dept => {
    const deptEmps = employees.filter(e => e.dept === dept);
    const deptProgress = progressRows.filter(r => r.department === dept);
    const analyzedCount = deptEmps.filter(e => e.analyzed).length;
    const startedCount = deptEmps.filter(e => e.started).length;
    const completionRate = deptEmps.length > 0 ? Math.round((startedCount / deptEmps.length) * 100) : 0;

    const allScores = deptProgress.flatMap(r => pillarKeys.map(k => r[k]).filter((v): v is number => v != null));
    const avgReadiness = allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0;

    const pillarAvgs = pillarKeys.map((k, i) => {
      const scores = deptProgress.map(r => r[k]).filter((v): v is number => v != null);
      return { label: pillarLabels[i], avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0 };
    });
    const weakest = [...pillarAvgs].sort((a, b) => a.avg - b.avg)[0];

    const baseW1 = Math.max(20, avgReadiness - Math.floor(trendRand() * 15) - 8);
    const trend: WeeklyTrend[] = [
      { week: "W1", score: baseW1 },
      { week: "W2", score: Math.min(100, baseW1 + Math.floor(trendRand() * 6) + 2) },
      { week: "W3", score: Math.min(100, baseW1 + Math.floor(trendRand() * 10) + 5) },
      { week: "W4", score: avgReadiness },
    ];

    return {
      dept,
      employees: deptEmps.length,
      analyzedRoles: analyzedCount,
      started: startedCount,
      completionRate,
      avgReadiness,
      weakestPillar: weakest.label,
      weakestScore: weakest.avg,
      trend,
      delta: trend[3].score - trend[0].score,
    };
  }).sort((a, b) => b.employees - a.employees);

  _cache = { employees, progress: progressRows, funnel, trends };
  return _cache;
}
