/**
 * Interest Graph Engine
 *
 * Builds a weighted user interest graph from engagement signals,
 * clusters related roles, and generates personalized recommendations.
 *
 * Signal weights (TikTok-inspired):
 *   Practice (completed sim)  → 5 pts per session
 *   Bookmark                  → 3 pts
 *   View (analysis history)   → 1 pt
 *   Re-practice (same task)   → 2 bonus pts per repeat
 *   High score (≥80%)         → 1.5x multiplier on practice pts
 */

/* ── Signal weights ── */
const W = {
  practice: 5,
  bookmark: 3,
  view: 1,
  rePractice: 2,       // bonus per repeat session on same task
  highScoreMultiplier: 1.5, // applied when score ≥ 80%
  recencyHalfLife: 14,      // days — older signals decay
} as const;

/* ── Role adjacency clusters ── */
const ROLE_CLUSTERS: string[][] = [
  ["product manager", "business analyst", "project manager", "product designer", "product operations manager"],
  ["software engineer", "devops engineer", "platform engineer", "qa engineer", "data engineer"],
  ["data analyst", "data scientist", "analytics engineer", "machine learning engineer", "research scientist"],
  ["marketing manager", "content strategist", "seo specialist", "brand strategist", "social media manager", "growth manager", "copywriter"],
  ["financial analyst", "accountant", "tax advisor", "investment banker", "investment analyst", "fp&a manager"],
  ["ux designer", "product designer", "ui engineer"],
  ["sales engineer", "solutions architect", "account executive"],
  ["hr manager", "recruiter", "people operations"],
  ["compliance officer", "risk manager", "legal ops manager", "corporate lawyer"],
  ["operations manager", "supply chain manager", "procurement manager", "supply chain analyst"],
  ["customer success manager", "support engineer"],
  ["security analyst", "cybersecurity analyst"],
];

/* ── Input types ── */
export interface CompletionSignal {
  task_name: string;
  job_title: string;
  company: string | null;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
}

export interface AnalysisSignal {
  job_title: string;
  company: string | null;
  analyzed_at: string;
}

export interface BookmarkSignal {
  job_title: string;
  company: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
  bookmarked_at: string;
}

/* ── Output types ── */
export interface RoleNode {
  role: string;
  company: string | null;
  /** Weighted interest score — higher = more engaged */
  score: number;
  /** Individual signal breakdown */
  signals: {
    views: number;
    practices: number;
    bookmarks: number;
    rePractices: number;
  };
  /** Distinct tasks practiced */
  taskCount: number;
  /** Best score per task */
  tasks: { name: string; bestScore: number; sessions: number }[];
  /** Average best score across tasks */
  avgProficiency: number;
  /** Engagement tier derived from score */
  tier: "core" | "exploring" | "peripheral";
  /** Cluster IDs this role belongs to */
  clusterIds: number[];
}

export interface ClusterSummary {
  id: number;
  roles: string[];
  totalScore: number;
  avgProficiency: number;
  topRole: string;
}

export interface Recommendation {
  jobTitle: string;
  company: string | null;
  matchScore: number;
  reason: string;
  tag: "adjacent" | "deepen" | "stretch";
  sourceCluster: number;
}

export interface InterestGraph {
  nodes: RoleNode[];
  clusters: ClusterSummary[];
  recommendations: Recommendation[];
  stats: {
    totalEngagement: number;
    rolesExplored: number;
    rolesPracticed: number;
    totalSessions: number;
    strongestCluster: string | null;
  };
}

/* ── Helpers ── */
function recencyWeight(dateStr: string): number {
  const daysAgo = (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24);
  return Math.pow(0.5, daysAgo / W.recencyHalfLife); // exponential decay
}

function getClusterIds(role: string): number[] {
  const lower = role.toLowerCase();
  const ids: number[] = [];
  for (let i = 0; i < ROLE_CLUSTERS.length; i++) {
    if (ROLE_CLUSTERS[i].some(r => lower.includes(r) || r.includes(lower))) {
      ids.push(i);
    }
  }
  return ids;
}

function getClusterRoles(clusterId: number): string[] {
  return ROLE_CLUSTERS[clusterId] || [];
}

/* ── Main engine ── */
export function buildInterestGraph(
  completions: CompletionSignal[],
  analyses: AnalysisSignal[],
  bookmarks: BookmarkSignal[],
): InterestGraph {
  const nodeMap = new Map<string, RoleNode>();

  function getOrCreate(role: string, company: string | null): RoleNode {
    const key = role.toLowerCase();
    if (!nodeMap.has(key)) {
      nodeMap.set(key, {
        role,
        company,
        score: 0,
        signals: { views: 0, practices: 0, bookmarks: 0, rePractices: 0 },
        taskCount: 0,
        tasks: [],
        avgProficiency: 0,
        tier: "peripheral",
        clusterIds: getClusterIds(role),
      });
    }
    return nodeMap.get(key)!;
  }

  // 1. Process views (analysis history)
  for (const a of analyses) {
    const node = getOrCreate(a.job_title, a.company);
    const weight = W.view * recencyWeight(a.analyzed_at);
    node.score += weight;
    node.signals.views += 1;
  }

  // 2. Process practices (completed simulations)
  const taskSessions = new Map<string, number>(); // "role|task" → count
  for (const c of completions) {
    const node = getOrCreate(c.job_title, c.company);
    const scorePercent = c.total_questions > 0 ? (c.correct_answers / c.total_questions) * 100 : 0;
    const recency = recencyWeight(c.completed_at);

    let pts = W.practice * recency;
    if (scorePercent >= 80) pts *= W.highScoreMultiplier;

    // Track re-practices
    const taskKey = `${c.job_title.toLowerCase()}|${c.task_name.toLowerCase()}`;
    const prevSessions = taskSessions.get(taskKey) || 0;
    taskSessions.set(taskKey, prevSessions + 1);
    if (prevSessions > 0) {
      pts += W.rePractice * recency;
      node.signals.rePractices += 1;
    }

    node.score += pts;
    node.signals.practices += 1;

    // Update task-level data
    const existing = node.tasks.find(t => t.name.toLowerCase() === c.task_name.toLowerCase());
    if (existing) {
      existing.bestScore = Math.max(existing.bestScore, scorePercent);
      existing.sessions += 1;
    } else {
      node.tasks.push({ name: c.task_name, bestScore: scorePercent, sessions: 1 });
      node.taskCount += 1;
    }
  }

  // 3. Process bookmarks
  for (const b of bookmarks) {
    const node = getOrCreate(b.job_title, b.company);
    node.score += W.bookmark * recencyWeight(b.bookmarked_at);
    node.signals.bookmarks += 1;
  }

  // 4. Finalize nodes
  const nodes = Array.from(nodeMap.values());
  const maxScore = Math.max(...nodes.map(n => n.score), 1);

  for (const node of nodes) {
    // Calculate avg proficiency
    if (node.tasks.length > 0) {
      node.avgProficiency = Math.round(
        node.tasks.reduce((s, t) => s + t.bestScore, 0) / node.tasks.length
      );
      node.tasks.sort((a, b) => b.bestScore - a.bestScore);
    }

    // Assign tier based on normalized score
    const normalized = node.score / maxScore;
    node.tier = normalized >= 0.5 ? "core" : normalized >= 0.15 ? "exploring" : "peripheral";
  }

  nodes.sort((a, b) => b.score - a.score);

  // 5. Build cluster summaries
  const clusterMap = new Map<number, ClusterSummary>();
  for (const node of nodes) {
    for (const cid of node.clusterIds) {
      if (!clusterMap.has(cid)) {
        clusterMap.set(cid, { id: cid, roles: [], totalScore: 0, avgProficiency: 0, topRole: "" });
      }
      const cluster = clusterMap.get(cid)!;
      cluster.roles.push(node.role);
      cluster.totalScore += node.score;
    }
  }
  for (const cluster of clusterMap.values()) {
    const clusterNodes = nodes.filter(n => n.clusterIds.includes(cluster.id));
    const practiced = clusterNodes.filter(n => n.tasks.length > 0);
    cluster.avgProficiency = practiced.length > 0
      ? Math.round(practiced.reduce((s, n) => s + n.avgProficiency, 0) / practiced.length)
      : 0;
    cluster.topRole = clusterNodes[0]?.role || "";
  }
  const clusters = Array.from(clusterMap.values()).sort((a, b) => b.totalScore - a.totalScore);

  // 6. Generate recommendations
  const recommendations = generateGraphRecommendations(nodes, clusters);

  // 7. Stats
  const rolesPracticed = nodes.filter(n => n.signals.practices > 0).length;
  const totalSessions = nodes.reduce((s, n) => s + n.signals.practices, 0);
  const strongestCluster = clusters[0]
    ? ROLE_CLUSTERS[clusters[0].id]?.slice(0, 3).map(r => r.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")).join(", ") || null
    : null;

  return {
    nodes,
    clusters,
    recommendations,
    stats: {
      totalEngagement: Math.round(nodes.reduce((s, n) => s + n.score, 0)),
      rolesExplored: nodes.length,
      rolesPracticed,
      totalSessions,
      strongestCluster,
    },
  };
}

/* ── Recommendation generation ── */
function generateGraphRecommendations(
  nodes: RoleNode[],
  clusters: ClusterSummary[],
): Recommendation[] {
  const recs: Recommendation[] = [];
  const exploredRoles = new Set(nodes.map(n => n.role.toLowerCase()));

  // 1. "Deepen" — roles with high engagement but low proficiency
  for (const node of nodes) {
    if (node.tier === "core" && node.avgProficiency > 0 && node.avgProficiency < 65) {
      recs.push({
        jobTitle: node.role,
        company: node.company,
        matchScore: Math.min(95, 70 + Math.round(node.score / 2)),
        reason: `You've shown strong interest (${node.signals.practices} sessions) but your avg score is ${node.avgProficiency}% — focused practice would level you up.`,
        tag: "deepen",
        sourceCluster: node.clusterIds[0] ?? -1,
      });
    }
  }

  // 2. "Adjacent" — unexplored roles in engaged clusters
  for (const cluster of clusters.slice(0, 4)) {
    const clusterRoles = getClusterRoles(cluster.id);
    for (const adjRole of clusterRoles) {
      if (!exploredRoles.has(adjRole)) {
        const topNode = nodes.find(n => n.clusterIds.includes(cluster.id) && n.tier === "core");
        if (topNode) {
          const title = adjRole.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
          recs.push({
            jobTitle: title,
            company: null,
            matchScore: Math.min(92, 60 + Math.round(cluster.totalScore / 3)),
            reason: `Related to your strength in ${topNode.role} — skills transfer well.`,
            tag: "adjacent",
            sourceCluster: cluster.id,
          });
        }
      }
    }
  }

  // 3. "Stretch" — top roles from unengaged clusters
  const engagedClusterIds = new Set(clusters.filter(c => c.totalScore > 3).map(c => c.id));
  for (let i = 0; i < ROLE_CLUSTERS.length && recs.length < 8; i++) {
    if (!engagedClusterIds.has(i)) {
      const representative = ROLE_CLUSTERS[i][0];
      if (representative && !exploredRoles.has(representative)) {
        const title = representative.split(" ").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
        recs.push({
          jobTitle: title,
          company: null,
          matchScore: 45 + Math.floor(Math.random() * 15),
          reason: "Expand your horizon — this is outside your current clusters.",
          tag: "stretch",
          sourceCluster: i,
        });
        break; // only 1 stretch rec
      }
    }
  }

  // Sort by matchScore desc and limit
  recs.sort((a, b) => b.matchScore - a.matchScore);
  return recs.slice(0, 6);
}
