/**
 * SkillSuggestionCards — pre-chat skill cards for signed-in users.
 * Shows 2-3 highest-leverage skills from their journey bullseye data.
 * Each card = one task, one skill, N roles moved closer.
 */
import { useMemo, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, Sparkles, Play, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

/* ─── Minimal taxonomy for skill matching (subset of JourneyDashboard) ─── */
interface TaxonomySkill {
  id: string; name: string; category: string;
  keywords: string[]; aiExposure: number;
  humanEdge?: string;
}

const TAXONOMY: TaxonomySkill[] = [
  { id: "code-dev", name: "Software Development", category: "Technical", aiExposure: 72, keywords: ["code", "development", "engineering", "component", "pipeline", "deploy", "api", "software", "build", "feature"], humanEdge: "System thinking" },
  { id: "data-analysis", name: "Data Analysis", category: "Analytical", aiExposure: 80, keywords: ["analysis", "analytics", "data", "metrics", "dashboard", "reporting", "insight", "kpi"], humanEdge: "Asking the right questions" },
  { id: "stakeholder-mgmt", name: "Stakeholder Management", category: "Communication", aiExposure: 15, keywords: ["stakeholder", "client", "customer", "relationship", "cross-functional", "collaboration"], humanEdge: "Trust building" },
  { id: "project-mgmt", name: "Project Management", category: "Leadership", aiExposure: 40, keywords: ["project", "sprint", "planning", "coordination", "launch", "roadmap", "agile"], humanEdge: "Priority judgment" },
  { id: "strategy", name: "Strategy & Planning", category: "Leadership", aiExposure: 25, keywords: ["strategy", "roadmap", "positioning", "go-to-market", "planning", "vision"], humanEdge: "Competitive intuition" },
  { id: "writing-docs", name: "Writing & Documentation", category: "Communication", aiExposure: 82, keywords: ["documentation", "writing", "content", "email", "knowledge base", "communication"], humanEdge: "Voice & persuasion" },
  { id: "financial-modeling", name: "Financial Modeling", category: "Analytical", aiExposure: 70, keywords: ["financial model", "valuation", "forecast", "budget", "revenue", "pricing"], humanEdge: "Assumption judgment" },
  { id: "design-ux", name: "Design & UX", category: "Creative", aiExposure: 55, keywords: ["design", "ux", "wireframe", "prototype", "usability", "ui"], humanEdge: "Empathy-driven design" },
  { id: "research", name: "Research & Discovery", category: "Analytical", aiExposure: 75, keywords: ["research", "audit", "review", "market research", "competitive", "survey"], humanEdge: "Novel hypothesis formation" },
  { id: "team-mgmt", name: "Team Management", category: "Leadership", aiExposure: 12, keywords: ["team", "coaching", "talent", "hiring", "people", "leadership", "training"], humanEdge: "Empathy & culture" },
];

function matchTaskToSkills(taskName: string): string[] {
  const lower = taskName.toLowerCase();
  return TAXONOMY.filter(s => s.keywords.some(kw => lower.includes(kw))).map(s => s.id);
}

interface SkillSuggestion {
  skillName: string;
  category: string;
  dotsAffected: number;
  taskName: string;
  company: string;
  jobTitle: string;
  humanEdge?: string;
}

export default function SkillSuggestionCards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<SkillSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { setLoading(false); return; }

    async function compute() {
      try {
        // Fetch user's practiced skills
        const { data: sims } = await supabase
          .from("completed_simulations")
          .select("job_title, task_name, tool_awareness_score, human_value_add_score, adaptive_thinking_score, domain_judgment_score")
          .eq("user_id", user!.id)
          .limit(200);

        if (!sims || sims.length < 3) { setLoading(false); return; }

        // Build user skill set
        const practicedSkills = new Set<string>();
        for (const sim of sims) {
          const ids = [...matchTaskToSkills(sim.task_name), ...matchTaskToSkills(sim.job_title)];
          const pillars = [sim.tool_awareness_score, sim.human_value_add_score, sim.adaptive_thinking_score, sim.domain_judgment_score].filter((s): s is number => s != null);
          const avg = pillars.length > 0 ? pillars.reduce((a, b) => a + b, 0) / pillars.length : 0;
          if (avg >= 40) ids.forEach(id => practicedSkills.add(id));
        }

        // Fetch job templates
        const { data: clusters } = await supabase
          .from("job_task_clusters")
          .select("cluster_name, job_id, jobs!inner(id, title, department, company_id, companies(name))")
          .order("job_id")
          .limit(500);

        if (!clusters?.length) { setLoading(false); return; }

        // Group by job
        const jobMap = new Map<string, { title: string; company: string; tasks: string[] }>();
        for (const c of clusters) {
          const job = (c as any).jobs;
          if (!job) continue;
          const companyName = job.companies?.name || "Unknown";
          const key = `${job.title}|${companyName}`;
          if (!jobMap.has(key)) jobMap.set(key, { title: job.title, company: companyName, tasks: [] });
          jobMap.get(key)!.tasks.push(c.cluster_name);
        }

        // Count gap skills across all jobs
        const gapImpact = new Map<string, { count: number; bestTask: { taskName: string; company: string; jobTitle: string } | null }>();
        for (const job of jobMap.values()) {
          const jobSkills = new Set<string>();
          const taskBySkill = new Map<string, string>();
          for (const t of job.tasks) {
            for (const id of matchTaskToSkills(t)) {
              jobSkills.add(id);
              if (!taskBySkill.has(id)) taskBySkill.set(id, t);
            }
          }
          for (const id of jobSkills) {
            if (!practicedSkills.has(id)) {
              const entry = gapImpact.get(id) || { count: 0, bestTask: null };
              entry.count++;
              if (!entry.bestTask) {
                entry.bestTask = { taskName: taskBySkill.get(id)!, company: job.company, jobTitle: job.title };
              }
              gapImpact.set(id, entry);
            }
          }
        }

        // Rank by impact
        const ranked: SkillSuggestion[] = [];
        for (const [id, impact] of gapImpact) {
          const tax = TAXONOMY.find(t => t.id === id);
          if (!tax || !impact.bestTask) continue;
          ranked.push({
            skillName: tax.name,
            category: tax.category,
            dotsAffected: impact.count,
            taskName: impact.bestTask.taskName,
            company: impact.bestTask.company,
            jobTitle: impact.bestTask.jobTitle,
            humanEdge: tax.humanEdge,
          });
        }
        ranked.sort((a, b) => b.dotsAffected - a.dotsAffected);
        setSuggestions(ranked.slice(0, 3));
      } catch {
        // Silent fail
      }
      setLoading(false);
    }

    compute();
  }, [user]);

  if (loading || suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="w-full max-w-xl mx-auto mb-4"
    >
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <Zap className="h-3.5 w-3.5 text-primary" />
        <span className="text-xs font-semibold text-foreground">Continue Building</span>
        <span className="text-[10px] text-muted-foreground">— skills that move you closest</span>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1 px-1">
        {suggestions.map((s, i) => (
          <motion.button
            key={s.skillName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08 }}
            onClick={() => {
              const params = new URLSearchParams({ title: s.jobTitle });
              if (s.company) params.set("company", s.company);
              params.set("task", s.taskName);
              navigate(`/analysis?${params.toString()}`);
            }}
            className="flex-1 min-w-[150px] max-w-[200px] rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 p-3 text-left transition-all hover:shadow-md hover:shadow-primary/10 group"
          >
            <p className="text-[11px] font-semibold text-foreground truncate group-hover:text-primary transition-colors">
              {s.skillName}
            </p>
            <div className="flex items-center gap-1 mt-1">
              <Sparkles className="h-3 w-3 text-primary/70" />
              <span className="text-[10px] text-primary font-medium">
                {s.dotsAffected} role{s.dotsAffected !== 1 ? "s" : ""} closer
              </span>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1 truncate">
              {s.taskName}
            </p>
            <div className="flex items-center gap-1 mt-1.5 text-[9px] text-muted-foreground/70">
              <Play className="h-2.5 w-2.5" />
              <span className="truncate">{s.company}</span>
            </div>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
