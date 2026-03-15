/**
 * Generates demo data for the Anthropic HR dashboard.
 *
 * Funnel:
 *   400 jobs imported  →  77 analyzed  →  77 activated  →  55 employees started
 *
 * - 400 employees (one per job title) are created across departments.
 * - 77 of those roles are marked "analyzed" (have learning paths).
 * - Of those 77, exactly 55 employees have simulation completions
 *   at varying degrees of progress (1-4 sims each).
 * - The remaining 345 employees have no completions yet.
 * - "Jackson" is excluded from all name pools.
 */

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

// Real Anthropic jobs and task clusters from the database
const DEPT_DATA: Record<string, { roles: string[]; tasks: string[] }> = {
  "Sales": {
    roles: [
      "Account Coordinator",
      "Account Executive, Academic Medical Centers",
      "Account Executive, Mid Market - UKI",
      "Account Executive, Startups",
      "Account Executive, Universities",
      "Business Development Representative",
      "Business Development Representative - EMEA",
      "Claude Evangelist, Applied AI (Startups)",
      "Cloud GTM Partnerships Lead",
      "Customer Marketing Lead, Digital Native Business",
      "Customer Marketing Lead, Enterprise",
      "Customer Success Manager - APAC",
      "Customer Success Manager, Digital Native Business",
      "Customer Success Manager, Strategics",
      "Emerging Account Executive, Startups",
      "Enterprise Account Executive, Defense & Intelligence",
      "Enterprise Account Executive, Federal Civilian Sales",
      "Enterprise Account Executive, Financial Services",
      "Enterprise Account Executive, Healthcare & Life Sciences",
      "Enterprise Account Executive, Healthcare Providers",
      "Enterprise Account Executive, Insurance",
      "Enterprise Account Executive, Manufacturing",
      "Enterprise Account Executive, Retail",
      "Enterprise Account Executive, Technology",
      "GTM Operations Manager",
      "Partner Development Manager",
      "Partner Engineer",
      "Revenue Operations Analyst",
      "Revenue Strategy & Operations Manager",
      "Sales Engineer",
      "Solutions Architect, Applied AI (Industries)",
      "Solutions Architect, Applied AI (Platform)",
      "Solutions Architect, Applied AI (Startups)",
      "Technical Account Manager",
    ],
    tasks: [
      "Technical Discovery & Requirements Gathering",
      "Architecture Design & Proposal",
      "LLM Evaluation & Benchmarking",
      "Sales Pipeline Administration",
      "Enterprise Onboarding Support",
      "Account Health Monitoring",
      "Customer Adoption & Expansion Strategy",
      "Competitive Positioning Analysis",
      "Enterprise Deal Qualification & Strategy",
      "Revenue Forecasting & Pipeline Analytics",
      "Partner Ecosystem Development",
      "Solution Demo & POC Delivery",
      "Contract Negotiation & Renewal",
      "ROI & Business Case Development",
      "Stakeholder Mapping & Executive Alignment",
      "Territory & Account Planning",
      "Cross-Sell & Upsell Identification",
      "Customer Advocacy & Reference Building",
    ],
  },
  "Engineering": {
    roles: [
      "Applied AI Engineer",
      "Applied AI Engineer, Life Sciences",
      "Data Science Engineer, Capacity & Efficiency",
      "Design Engineer, Web",
      "Engineering Manager, Access Management",
      "Engineering Manager, API Enterprise and Multicloud",
      "Engineering Manager, Cloud Security",
      "Engineering Manager, Detection & Response",
      "Engineering Manager, Inference",
      "Engineering Manager, Secure Frameworks",
      "Engineering Manager, UI Claude Consumer Products",
      "Infrastructure Engineer, Cloud Platforms",
      "Product Manager, API",
      "Product Manager, Claude Code",
      "Product Manager, Claude Consumer Products",
      "Product Manager, Developer",
      "Product Manager, Enterprise",
      "Product Manager, Finance & Billing",
      "Product Manager, Integrations",
      "Product Manager, Internal Tools & Safety",
      "Product Manager, Trust & Safety",
      "Software Engineer, API",
      "Software Engineer, Backend",
      "Software Engineer, Claude Code",
      "Software Engineer, Desktop Applications",
      "Software Engineer, Enterprise",
      "Software Engineer, Full Stack",
      "Software Engineer, iOS",
      "Software Engineer, ML Networking",
      "Technical Program Manager, Compute",
      "Technical Program Manager, Infrastructure",
    ],
    tasks: [
      "Cross-functional Program Coordination",
      "Risk Assessment & Mitigation Planning",
      "API Performance Optimization",
      "Infrastructure Cost Analysis",
      "CI/CD Pipeline Review",
      "Code Architecture Decision",
      "Incident Response Triage",
      "Load Testing Framework Design",
      "Cloud Migration Planning",
      "Latency Profiling & Optimization",
      "Feature Flag Strategy",
      "Capacity Planning Model",
      "Deployment Runbook Review",
      "Service Mesh Configuration",
      "Security Architecture Review",
      "Product Roadmap Prioritization",
      "User Experience Research Synthesis",
    ],
  },
  "AI / Research": {
    roles: [
      "Anthropic AI Safety Fellow",
      "Applied Safety Research Engineer, Safeguards",
      "Certification Content & Systems Architect",
      "Design Engineer, AI Capability Development",
      "Engineering Manager, Inference",
      "Engineering Manager, ML Acceleration",
      "Full Stack Software Engineer, Reinforcement Learning",
      "Machine Learning Systems Engineer, Research Tools",
      "Machine Learning Systems Engineer, RL Engineering",
      "ML Infrastructure Engineer, Safeguards",
      "Performance Engineer, GPU",
      "Privacy Research Engineer, Safeguards",
      "Research Engineer, Agents",
      "Research Engineer, AI Observability",
      "Research Engineer, Discovery",
      "Research Engineer, Environment Scaling",
      "Research Engineer, Interpretability",
      "Research Engineer, Pre-training",
      "Research Engineer, Pretraining Scaling",
      "Research Engineer, Production Model Post-Training",
      "Research Engineer, Reward Models Platform",
      "Research Engineer, Science of Scaling",
      "Research Engineer, Virtual Collaborator",
      "Research Engineer/Research Scientist, Audio",
      "Research Engineer/Research Scientist, Biology",
      "Research Engineer/Research Scientist, Vision",
      "Research Lead, Training Insights",
      "Research Manager, Interpretability",
      "Research Scientist, Alignment Finetuning",
      "Research Scientist, Frontier Red Team",
      "Research Scientist, Societal Impacts",
      "Senior Research Scientist, Reward Models",
      "Software Engineer, Accelerator Build Infrastructure",
      "Software Engineer, Human Data Interface",
      "Software Engineer, Sandboxing",
      "Staff Research Engineer, Discovery Team",
      "Technical Program Manager, Research",
    ],
    tasks: [
      "RLHF Evaluation Protocol",
      "Red-Teaming Methodology Design",
      "Interpretability Experiment Review",
      "Model Capability Assessment",
      "Safety Benchmark Suite Design",
      "Alignment Metric Analysis",
      "Pre-training Data Curation",
      "Scaling Law Experiment",
      "Reward Model Calibration",
      "Agent Evaluation Framework",
      "Constitutional AI Audit",
      "Adversarial Robustness Testing",
      "Training Run Analysis",
      "Compute Efficiency Study",
      "Model Behavior Characterization",
      "Finetuning Pipeline Optimization",
      "Error Analysis and Model Debugging",
      "Post-Training Recipe Optimization",
      "Synthetic Data Generation",
      "ML Systems Optimization",
    ],
  },
  "Security": {
    roles: [
      "Application Security Engineer",
      "Application Security Engineering Manager",
      "Campus Security Manager",
      "Customer Trust Lead",
      "Engineering Manager, Cloud Security",
      "Engineering Manager, Detection & Response",
      "Engineering Manager, Secure Frameworks",
      "Security Engineer, Cloud Security",
      "Security Engineer, Detection & Response",
      "Security Engineer, Endpoint Security",
      "Security Operations Lead",
      "Trust & Safety Operations Lead",
    ],
    tasks: [
      "Threat Model Review",
      "Penetration Test Analysis",
      "Vulnerability Assessment Report",
      "Security Architecture Review",
      "Incident Response Simulation",
      "Access Control Audit",
      "Cloud Security Posture Review",
      "Supply Chain Security Assessment",
      "Data Classification Exercise",
      "Trust & Safety Policy Review",
    ],
  },
  "Finance": {
    roles: [
      "Cloud Service Provider Accounting Manager",
      "Compute Cost of Revenue Accountant",
      "Corporate Accountant, Accounting Operations",
      "Corporate Development Integration Lead",
      "Corporate Finance & Strategy, Workforce & OPEX",
      "Director, Accounting Operations",
      "Director, M&A Finance Integration",
      "Financial Analyst, FP&A",
      "Procurement Manager",
      "Senior Tax Analyst",
      "Treasury Analyst",
    ],
    tasks: [
      "Headcount Budget Forecast",
      "OPEX Variance Analysis",
      "Revenue Recognition Review",
      "Cloud Spend Optimization",
      "Financial Close Procedures",
      "M&A Integration Planning",
      "Cost Allocation Model",
      "Audit Preparation Checklist",
      "Tax Provision Estimate",
      "Procurement Strategy Review",
    ],
  },
  "Operations": {
    roles: [
      "Compute Capacity Strategy & Operations",
      "Copyright Operations Program Manager",
      "Data Center Controls Engineer",
      "Data Center Energy Lead",
      "Data Center Hardware Operations Lead",
      "Data Center Mechanical Engineer",
      "Data Center Operations Lead",
      "IT Systems Engineer",
      "Program Manager, Compute Operations",
      "Supply Chain Manager",
    ],
    tasks: [
      "Infrastructure Capacity Planning",
      "Incident Escalation Workflow",
      "Facility Operations Audit",
      "Energy Efficiency Assessment",
      "Hardware Lifecycle Management",
      "Vendor SLA Review",
      "Disaster Recovery Tabletop",
      "Cooling System Optimization",
      "Power Distribution Planning",
      "Supply Chain Risk Assessment",
    ],
  },
  "Marketing": {
    roles: [
      "Communications Manager, Enterprise",
      "Customer Marketing Lead, Startups - EMEA",
      "Developer Community Lead, EMEA",
      "Developer Education Lead",
      "Developer Relations Lead",
      "Developer Relations, MCP",
      "Growth Marketing Manager",
      "Product Marketing Manager",
    ],
    tasks: [
      "Product Launch Messaging",
      "Analyst Briefing Preparation",
      "Content Calendar Planning",
      "Community Engagement Strategy",
      "Technical Blog Post Review",
      "Event Strategy Workshop",
      "Brand Positioning Exercise",
      "Social Media Campaign Review",
      "Developer Advocacy Plan",
    ],
  },
  "People": {
    roles: [
      "Engineering Manager, People Products",
      "Recruiting Data Engineering & Analytics",
      "Regional Head of Early Career Associates",
    ],
    tasks: [
      "Pipeline Analytics & Reporting",
      "Hiring Pipeline Analytics",
      "Talent Funnel Optimization",
      "Onboarding Program Review",
      "Employee Engagement Survey",
      "Compensation Benchmarking",
    ],
  },
  "Legal": {
    roles: [
      "Commercial Counsel, Compute & Infrastructure",
      "Commercial Counsel, Datacenters & Construction",
      "Commercial Counsel, GTM",
      "Contracts Manager",
    ],
    tasks: [
      "Enterprise License Agreement Review",
      "Data Processing Addendum Drafting",
      "IP Risk Assessment",
      "Regulatory Compliance Review",
      "Contract Negotiation Playbook",
      "Vendor Agreement Audit",
    ],
  },
  "Compliance": {
    roles: [
      "Biological Safety Research Scientist",
      "Crisis Management Specialist",
      "Enforcement Operations Lead",
    ],
    tasks: [
      "Incident Response Tabletop Exercise",
      "Regulatory Impact Assessment",
      "Policy Gap Analysis",
      "Risk Register Update",
      "Compliance Training Design",
      "Audit Readiness Review",
    ],
  },
  "Communications": {
    roles: [
      "AI Solutions Architect, Communications",
      "Audiovisual Broadcast Engineer, IT Engineering",
    ],
    tasks: [
      "Internal Comms Strategy Review",
      "Broadcast System Architecture",
      "Stakeholder Update Briefing",
      "Crisis Communication Plan",
      "Media Monitoring Framework",
    ],
  },
  "Data": {
    roles: [
      "Analytics Data Engineer",
      "Analytics Data Engineering Manager, Product",
    ],
    tasks: [
      "Pipeline Optimization Review",
      "Data Quality Framework",
      "Dashboard Design Sprint",
      "ETL Architecture Assessment",
      "Data Governance Planning",
    ],
  },
};

// First names pool (gender-diverse, multicultural) — no "Jackson"
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
];

// Deterministic seeded random for consistent demo data
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/**
 * Build the full employee roster (400 people) and mark which ones
 * belong to analyzed roles (77) and which have started sims (55).
 */
function buildEmployeeRoster(rand: () => number) {
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];

  // Department weights proportional to real Anthropic headcount
  const deptWeights: [string, number][] = [
    ["Sales", 124], ["Engineering", 65], ["AI / Research", 65], ["Security", 34],
    ["Finance", 31], ["Operations", 30], ["Marketing", 26], ["People", 8],
    ["Legal", 7], ["Compliance", 5], ["Communications", 3], ["Data", 2],
  ];
  const totalWeight = deptWeights.reduce((s, [, w]) => s + w, 0);
  const EMPLOYEE_COUNT = 400;

  const employees: DemoEmployee[] = [];
  const usedNames = new Set<string>();
  let empIdx = 0;

  for (const [dept, weight] of deptWeights) {
    const count = Math.max(1, Math.round((weight / totalWeight) * EMPLOYEE_COUNT));
    const deptData = DEPT_DATA[dept];
    let roleIdx = 0;

    for (let i = 0; i < count && employees.length < EMPLOYEE_COUNT; i++) {
      let name: string;
      do {
        name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      const role = deptData.roles[roleIdx % deptData.roles.length];
      roleIdx++;

      employees.push({
        id: `demo-${empIdx++}`,
        name,
        dept,
        role,
        analyzed: false,
        started: false,
      });
    }
  }

  // Mark 77 employees as having analyzed roles (spread across departments proportionally)
  const ANALYZED_COUNT = 77;
  const analyzePerDept: Record<string, number> = {};
  for (const [dept, weight] of deptWeights) {
    analyzePerDept[dept] = Math.max(1, Math.round((weight / totalWeight) * ANALYZED_COUNT));
  }
  // Adjust to exactly 77
  let totalMarked = Object.values(analyzePerDept).reduce((s, n) => s + n, 0);
  const deptKeys = deptWeights.map(([d]) => d);
  while (totalMarked > ANALYZED_COUNT) {
    const d = deptKeys[Math.floor(rand() * deptKeys.length)];
    if (analyzePerDept[d] > 1) { analyzePerDept[d]--; totalMarked--; }
  }
  while (totalMarked < ANALYZED_COUNT) {
    const d = deptKeys[Math.floor(rand() * deptKeys.length)];
    analyzePerDept[d]++;
    totalMarked++;
  }

  // Apply analyzed flags
  for (const dept of deptKeys) {
    const deptEmps = employees.filter(e => e.dept === dept);
    const toAnalyze = Math.min(analyzePerDept[dept] || 0, deptEmps.length);
    for (let i = 0; i < toAnalyze; i++) {
      deptEmps[i].analyzed = true;
    }
  }

  // Of the 77 analyzed, mark 55 as started
  const STARTED_COUNT = 55;
  const analyzedEmps = employees.filter(e => e.analyzed);
  // Shuffle analyzed employees deterministically
  for (let i = analyzedEmps.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [analyzedEmps[i], analyzedEmps[j]] = [analyzedEmps[j], analyzedEmps[i]];
  }
  for (let i = 0; i < Math.min(STARTED_COUNT, analyzedEmps.length); i++) {
    analyzedEmps[i].started = true;
  }

  return employees;
}

export const FUNNEL_STATS: DemoFunnelStats = {
  jobsImported: 400,
  jobsAnalyzed: 77,
  rolesActivated: 77,
  employeesStarted: 55,
};

let _cachedEmployees: DemoEmployee[] | null = null;
let _cachedProgress: DemoProgressRow[] | null = null;

export function getDemoEmployees(): DemoEmployee[] {
  if (_cachedEmployees) return _cachedEmployees;
  const rand = seededRandom(42);
  _cachedEmployees = buildEmployeeRoster(rand);
  return _cachedEmployees;
}

export function generateDemoProgress(): DemoProgressRow[] {
  if (_cachedProgress) return _cachedProgress;

  const rand = seededRandom(42);
  const employees = buildEmployeeRoster(rand);
  _cachedEmployees = employees;

  // Use a second seeded random for sim generation to keep names stable
  const simRand = seededRandom(1337);
  const pick = <T>(arr: T[]): T => arr[Math.floor(simRand() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(simRand() * (max - min + 1)) + min;

  const startedEmps = employees.filter(e => e.started);
  const rows: DemoProgressRow[] = [];
  const baseDate = new Date("2026-03-15T00:00:00Z").getTime();

  for (const emp of startedEmps) {
    const deptData = DEPT_DATA[emp.dept];
    // 1-4 sims per employee, weighted toward fewer for realism
    const simCount = simRand() < 0.3 ? 1 : simRand() < 0.6 ? 2 : simRand() < 0.85 ? 3 : 4;
    const usedTasks = new Set<string>();

    for (let s = 0; s < simCount; s++) {
      let task: string;
      do {
        task = pick(deptData.tasks);
      } while (usedTasks.has(task) && usedTasks.size < deptData.tasks.length);
      usedTasks.add(task);

      const daysAgo = randInt(0, 13);
      const hoursOffset = randInt(7, 18);
      const completedAt = new Date(baseDate - daysAgo * 86400000 + hoursOffset * 3600000).toISOString();

      const total = 5;
      const correct = Math.min(total, Math.max(1, randInt(2, 5)));

      // AI readiness scores with realistic archetypes
      const empArchetype = Math.floor(simRand() * 4);
      const baseScore = empArchetype === 3 ? randInt(30, 55) : empArchetype === 0 ? randInt(55, 80) : randInt(60, 85);

      const toolAwareness = Math.min(100, Math.max(10, baseScore + (empArchetype === 1 ? randInt(10, 25) : randInt(-15, 10))));
      const humanValueAdd = Math.min(100, Math.max(10, baseScore + (empArchetype === 2 ? randInt(10, 25) : randInt(-15, 10))));
      const adaptiveThinking = Math.min(100, Math.max(10, baseScore + randInt(-12, 12)));
      const domainJudgment = Math.min(100, Math.max(10, baseScore + randInt(-10, 15)));

      rows.push({
        user_id: emp.id,
        display_name: emp.name,
        job_title: emp.role,
        task_name: task,
        sim_job_title: emp.role,
        correct_answers: correct,
        total_questions: total,
        completed_at: completedAt,
        department: emp.dept,
        tool_awareness_score: toolAwareness,
        human_value_add_score: humanValueAdd,
        adaptive_thinking_score: adaptiveThinking,
        domain_judgment_score: domainJudgment,
      });
    }
  }

  _cachedProgress = rows;
  return rows;
}
