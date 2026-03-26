/**
 * CodexPanel — Tool Arsenal: collection of AI Tool Drops earned from simulations.
 * Shows discovered tools grouped by category with related skill navigation.
 */
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wrench, ChevronDown, ChevronUp, Compass, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ToolDrop {
  id: string;
  tool_name: string;
  tool_icon: string;
  tool_company: string;
  related_skills: string[];
  completed_at: string;
  job_title: string;
  task_name: string;
}

const DEMO_DROPS: ToolDrop[] = [
  { id: "demo-1", tool_name: "Cursor", tool_icon: "⌨️", tool_company: "Anysphere", related_skills: ["AI Code Audit", "Prompt Engineering", "Agentic Coding"], completed_at: new Date().toISOString(), job_title: "Software Engineer", task_name: "Code Review Automation" },
  { id: "demo-2", tool_name: "Claude", tool_icon: "🧠", tool_company: "Anthropic", related_skills: ["Prompt Engineering", "AI Output Evaluation"], completed_at: new Date().toISOString(), job_title: "Product Manager", task_name: "PRD Drafting" },
  { id: "demo-3", tool_name: "Midjourney", tool_icon: "🎨", tool_company: "Midjourney Inc.", related_skills: ["AI-Augmented Design", "Prompt Engineering"], completed_at: new Date().toISOString(), job_title: "UX Designer", task_name: "Visual Concept Generation" },
  { id: "demo-4", tool_name: "Perplexity", tool_icon: "🔍", tool_company: "Perplexity AI", related_skills: ["AI-Powered Research", "Information Synthesis"], completed_at: new Date().toISOString(), job_title: "Market Analyst", task_name: "Competitive Intelligence" },
  { id: "demo-5", tool_name: "Copilot", tool_icon: "✈️", tool_company: "Microsoft", related_skills: ["Workflow Automation", "AI Integration"], completed_at: new Date().toISOString(), job_title: "Data Analyst", task_name: "Report Automation" },
  { id: "demo-6", tool_name: "Devin", tool_icon: "🤖", tool_company: "Cognition", related_skills: ["Agentic Coding", "Multi-Agent Orchestration"], completed_at: new Date().toISOString(), job_title: "Engineering Lead", task_name: "Autonomous Bug Fixing" },
];

interface CodexPanelProps {
  onSelectTool?: (toolName: string) => void;
}

export default function CodexPanel({ onSelectTool }: CodexPanelProps) {
  const { user } = useAuth();
  const [drops, setDrops] = useState<ToolDrop[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) { setDrops(DEMO_DROPS); setLoading(false); return; }
    supabase
      .from("completed_simulations")
      .select("id, job_title, task_name, completed_at, elevation_narrative")
      .eq("user_id", user.id)
      .not("elevation_narrative", "is", null)
      .order("completed_at", { ascending: false })
      .then(({ data }) => {
        const parsed: ToolDrop[] = [];
        const seen = new Set<string>();
        for (const row of data || []) {
          const elev = row.elevation_narrative as any;
          if (elev?.type === "tool_drop" && elev.tool_name && !seen.has(elev.tool_name)) {
            seen.add(elev.tool_name);
            parsed.push({
              id: row.id,
              tool_name: elev.tool_name,
              tool_icon: elev.tool_icon || "🔧",
              tool_company: elev.tool_company || "",
              related_skills: elev.related_skills || [],
              completed_at: row.completed_at,
              job_title: row.job_title,
              task_name: row.task_name,
            });
          }
        }
        setDrops(parsed.length > 0 ? parsed : DEMO_DROPS);
        setLoading(false);
      });
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center space-y-2">
          <Wrench className="h-5 w-5 text-primary/40 mx-auto animate-pulse" />
          <p className="text-xs text-muted-foreground">Loading Arsenal…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 py-3 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Wrench className="h-3.5 w-3.5 text-primary" />
          <span
            className="text-[11px] font-bold uppercase tracking-[0.12em] text-primary"
            style={{ fontFamily: "'Cinzel', serif" }}
          >
            Tool Arsenal
          </span>
        </div>
        <span className="text-[10px] text-muted-foreground tabular-nums">
          {drops.length} {drops.length === 1 ? "tool" : "tools"} collected
        </span>
      </div>

      {/* Tool cards */}
      {drops.map((drop, i) => {
        const isExpanded = expandedId === drop.id;
        return (
          <motion.div
            key={drop.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="rounded-xl overflow-hidden cursor-pointer"
            style={{
              background: "hsl(var(--primary) / 0.04)",
              border: "1px solid hsl(var(--primary) / 0.12)",
            }}
            onClick={() => setExpandedId(isExpanded ? null : drop.id)}
          >
            {/* Collapsed row */}
            <div className="flex items-center gap-2.5 px-3 py-2.5">
              <span className="text-lg shrink-0">{drop.tool_icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-bold text-foreground/90">{drop.tool_name}</p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {drop.tool_company} · from {drop.task_name}
                </p>
              </div>
              {drop.related_skills.length > 0 && (
                <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0"
                  style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}
                >
                  {drop.related_skills.length} skills
                </span>
              )}
              {isExpanded ? (
                <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
              )}
            </div>

            {/* Expanded: related skills */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="px-3 pb-3 space-y-2">
                    {drop.related_skills.length > 0 && (
                      <div>
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">
                          Related Skills — Explore on Map
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {drop.related_skills.map((skill, si) => (
                            <span
                              key={si}
                              className="text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
                              style={{
                                background: "hsl(var(--primary) / 0.1)",
                                color: "hsl(var(--primary))",
                              }}
                            >
                              <Compass className="h-2.5 w-2.5" />
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 italic">
                      Dropped during "{drop.job_title}" battle
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}
