/**
 * Generates 400 realistic mock employees with simulation completions
 * based on real Anthropic job titles and department distribution.
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

// Real Anthropic departments → sample job titles and tasks
const DEPT_DATA: Record<string, { roles: string[]; tasks: string[] }> = {
  "Sales": {
    roles: [
      "Enterprise Account Executive, Financial Services",
      "Enterprise Account Executive, Federal Civilian Sales",
      "Account Executive, Startups",
      "Account Executive, Mid Market - UKI",
      "Account Coordinator",
      "Business Development Representative",
      "Business Development Representative - EMEA",
      "Emerging Account Executive, Startups",
      "Customer Success Manager, Strategics",
      "Customer Success Manager, Digital Native Business",
      "Customer Success Manager - APAC",
      "Solutions Architect, Applied AI",
      "Claude Evangelist, Applied AI (Startups)",
      "Cloud GTM Partnerships Lead",
      "Customer Marketing Lead, Enterprise",
      "Customer Marketing Lead, Digital Native Business",
    ],
    tasks: [
      "Enterprise Deal Qualification", "Procurement Negotiation Strategy", "ROI Business Case Preparation",
      "Account Health Review", "Quarterly Business Review Prep", "Pipeline Forecasting",
      "Stakeholder Mapping Exercise", "Competitive Displacement Strategy", "Contract Renewal Negotiation",
      "Product Demo Preparation", "Technical Discovery Call", "Executive Sponsor Alignment",
      "Territory Planning Review", "Cross-Sell Opportunity Analysis", "Customer Onboarding Kickoff",
    ],
  },
  "Engineering": {
    roles: [
      "Applied AI Engineer",
      "Applied AI Engineer, Life Sciences",
      "Engineering Manager, Inference",
      "Engineering Manager, Cloud Security",
      "Engineering Manager, API Enterprise and Multicloud",
      "Engineering Manager, Access Management",
      "Engineering Manager, Detection & Response",
      "Engineering Manager, Secure Frameworks",
      "Engineering Manager, UI Claude Consumer Products",
      "Data Science Engineer, Capacity & Efficiency",
      "Design Engineer, Web",
      "Technical Program Manager, Compute",
      "Software Engineer, ML Networking",
      "Infrastructure Engineer, Cloud Platforms",
    ],
    tasks: [
      "Prompt Engineering for Clients", "Model Integration Testing", "Safety Evaluation Report",
      "API Performance Optimization", "Infrastructure Cost Analysis", "CI/CD Pipeline Review",
      "Code Architecture Decision", "Incident Response Triage", "Load Testing Framework",
      "Cloud Migration Planning", "Latency Profiling Exercise", "Feature Flag Strategy",
      "Capacity Planning Model", "Deployment Runbook Review", "Service Mesh Configuration",
    ],
  },
  "AI / Research": {
    roles: [
      "Research Scientist, Alignment Finetuning",
      "Research Engineer, Interpretability",
      "Research Engineer, Agents",
      "Research Engineer, Pre-training",
      "Research Engineer, Pretraining Scaling",
      "Research Scientist, Frontier Red Team",
      "Applied Safety Research Engineer, Safeguards",
      "ML Infrastructure Engineer, Safeguards",
      "Machine Learning Systems Engineer, RL Engineering",
      "Research Engineer, Discovery",
      "Senior Research Scientist, Reward Models",
      "Research Engineer, Production Model Post-Training",
      "Performance Engineer, GPU",
      "Research Engineer, Science of Scaling",
    ],
    tasks: [
      "RLHF Evaluation Protocol", "Red-Teaming Methodology Design", "Interpretability Experiment Review",
      "Model Capability Assessment", "Safety Benchmark Suite", "Alignment Metric Analysis",
      "Pre-training Data Curation", "Scaling Law Experiment", "Reward Model Calibration",
      "Agent Evaluation Framework", "Constitutional AI Audit", "Adversarial Robustness Testing",
      "Training Run Analysis", "Compute Efficiency Study", "Model Behavior Characterization",
    ],
  },
  "Security": {
    roles: [
      "Application Security Engineer",
      "Application Security Engineering Manager",
      "Engineering Manager, Cloud Security",
      "Engineering Manager, Detection & Response",
      "Campus Security Manager",
      "Customer Trust Lead",
    ],
    tasks: [
      "Threat Model Review", "Penetration Test Analysis", "Vulnerability Assessment Report",
      "Security Architecture Review", "Incident Response Simulation", "Access Control Audit",
      "Cloud Security Posture Review", "Supply Chain Security Assessment", "Data Classification Exercise",
    ],
  },
  "Finance": {
    roles: [
      "Corporate Finance & Strategy, Workforce & OPEX",
      "Cloud Service Provider Accounting Manager",
      "Compute Cost of Revenue Accountant",
      "Corporate Accountant, Accounting Operations",
      "Corporate Development Integration Lead",
      "Director, Accounting Operations",
      "Director, M&A Finance Integration",
    ],
    tasks: [
      "Headcount Budget Forecast", "OPEX Variance Analysis", "Revenue Recognition Review",
      "Cloud Spend Optimization", "Financial Close Procedures", "M&A Integration Planning",
      "Cost Allocation Model", "Audit Preparation Checklist", "Tax Provision Estimate",
    ],
  },
  "Operations": {
    roles: [
      "Data Center Operations Lead",
      "Data Center Controls Engineer",
      "Data Center Energy Lead",
      "Data Center Mechanical Engineer",
      "Data Center Hardware Operations Lead",
      "Compute Capacity Strategy & Operations",
      "Copyright Operations Program Manager",
    ],
    tasks: [
      "Infrastructure Capacity Planning", "Incident Escalation Workflow", "Facility Operations Audit",
      "Energy Efficiency Assessment", "Hardware Lifecycle Management", "Vendor SLA Review",
      "Disaster Recovery Tabletop", "Cooling System Optimization", "Power Distribution Planning",
    ],
  },
  "Marketing": {
    roles: [
      "Communications Manager, Enterprise",
      "Customer Marketing Lead, Startups - EMEA",
      "Developer Community Lead, EMEA",
      "Developer Relations Lead",
      "Developer Relations, MCP",
      "Developer Education Lead",
    ],
    tasks: [
      "Product Launch Messaging", "Analyst Briefing Preparation", "Content Calendar Planning",
      "Community Engagement Strategy", "Technical Blog Post Review", "Event Strategy Workshop",
      "Brand Positioning Exercise", "Social Media Campaign Review", "Developer Advocacy Plan",
    ],
  },
  "People": {
    roles: [
      "Recruiting Data Engineering & Analytics",
      "Engineering Manager, People Products",
      "Regional Head of Early Career Associates",
    ],
    tasks: [
      "Hiring Pipeline Analytics", "Talent Funnel Optimization", "Onboarding Program Review",
      "Employee Engagement Survey", "Compensation Benchmarking", "Performance Review Calibration",
    ],
  },
  "Legal": {
    roles: [
      "Commercial Counsel, GTM",
      "Commercial Counsel, Compute & Infrastructure",
      "Commercial Counsel, Datacenters & Construction",
      "Contracts Manager",
    ],
    tasks: [
      "Enterprise License Agreement Review", "Data Processing Addendum Drafting", "IP Risk Assessment",
      "Regulatory Compliance Review", "Contract Negotiation Playbook", "Vendor Agreement Audit",
    ],
  },
  "Compliance": {
    roles: [
      "Crisis Management Specialist",
      "Enforcement Operations Lead",
      "Biological Safety Research Scientist",
    ],
    tasks: [
      "Incident Response Tabletop Exercise", "Regulatory Impact Assessment", "Policy Gap Analysis",
      "Risk Register Update", "Compliance Training Design", "Audit Readiness Review",
    ],
  },
  "Communications": {
    roles: [
      "Audiovisual Broadcast Engineer, IT Engineering",
      "AI Solutions Architect, Communications",
    ],
    tasks: [
      "Internal Comms Strategy Review", "Broadcast System Architecture", "Stakeholder Update Briefing",
      "Crisis Communication Plan", "Media Monitoring Framework",
    ],
  },
  "Data": {
    roles: [
      "Analytics Data Engineer",
      "Analytics Data Engineering Manager, Product",
    ],
    tasks: [
      "Pipeline Optimization Review", "Data Quality Framework", "Dashboard Design Sprint",
      "ETL Architecture Assessment", "Data Governance Planning",
    ],
  },
};

// First names pool (gender-diverse, multicultural)
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

export function generateDemoProgress(employeeCount = 400): DemoProgressRow[] {
  const rand = seededRandom(42);
  const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
  const randInt = (min: number, max: number) => Math.floor(rand() * (max - min + 1)) + min;

  // Distribute employees by department proportionally to real Anthropic headcount
  const deptWeights: [string, number][] = [
    ["Sales", 124], ["Engineering", 65], ["AI / Research", 65], ["Security", 34],
    ["Finance", 31], ["Operations", 30], ["Marketing", 26], ["People", 8],
    ["Legal", 7], ["Compliance", 5], ["Communications", 3], ["Data", 2],
  ];
  const totalWeight = deptWeights.reduce((s, [, w]) => s + w, 0);

  // Assign employees to departments
  const employees: { id: string; name: string; dept: string; role: string }[] = [];
  const usedNames = new Set<string>();
  let empIdx = 0;

  for (const [dept, weight] of deptWeights) {
    const count = Math.max(1, Math.round((weight / totalWeight) * employeeCount));
    const deptData = DEPT_DATA[dept];

    for (let i = 0; i < count && employees.length < employeeCount; i++) {
      let name: string;
      do {
        name = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
      } while (usedNames.has(name));
      usedNames.add(name);

      employees.push({
        id: `demo-${empIdx++}`,
        name,
        dept,
        role: pick(deptData.roles),
      });
    }
  }

  // Generate simulation completions (1–4 per employee)
  const rows: DemoProgressRow[] = [];
  const baseDate = new Date("2026-03-15T00:00:00Z").getTime();

  for (const emp of employees) {
    const deptData = DEPT_DATA[emp.dept];
    const simCount = randInt(1, 4);
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

      // Simulate realistic scores (slight skew towards passing)
      const total = 5;
      const correct = Math.min(total, Math.max(1, randInt(2, 5)));

      // Generate per-category AI readiness scores
      // Create realistic variation: some employees are strong in certain areas
      const empArchetype = Math.floor(rand() * 4); // 0=balanced, 1=tech-strong, 2=human-strong, 3=struggling
      const baseScore = empArchetype === 3 ? randInt(30, 55) : empArchetype === 0 ? randInt(55, 80) : randInt(60, 85);
      
      const toolAwareness = Math.min(100, Math.max(10, baseScore + (empArchetype === 1 ? randInt(10, 25) : randInt(-15, 10))));
      const humanValueAdd = Math.min(100, Math.max(10, baseScore + (empArchetype === 2 ? randInt(10, 25) : randInt(-15, 10))));
      const adaptiveThinking = Math.min(100, Math.max(10, baseScore + randInt(-12, 12)));
      const domainJudgment = Math.min(100, Math.max(10, baseScore + randInt(-10, 15)));

      // Shorten sim_job_title (remove qualifiers after comma)
      const simTitle = emp.role.includes(",") ? emp.role.split(",")[0].trim() : emp.role;

      rows.push({
        user_id: emp.id,
        display_name: emp.name,
        job_title: emp.role,
        task_name: task,
        sim_job_title: simTitle,
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

  return rows;
}
