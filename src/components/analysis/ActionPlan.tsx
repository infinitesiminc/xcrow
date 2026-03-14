import { useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, Heart, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { JobAnalysisResult, SkillCategory } from "@/types/analysis";

interface ActionPlanProps {
  result: JobAnalysisResult;
}

const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench; dotColor: string }> = {
  ai_tools: { label: "AI Tools & Platforms", icon: Wrench, dotColor: "bg-dot-blue" },
  human_skills: { label: "Human-Edge Skills", icon: Heart, dotColor: "bg-dot-teal" },
  new_capabilities: { label: "New Capabilities", icon: Sparkles, dotColor: "bg-dot-purple" },
};

// Map skills to recommended tool names for marketplace linking
const skillToTools: Record<string, string[]> = {
  "AI HR Platforms": ["Salesforce Einstein", "HubSpot AI"],
  "AI-Powered L&D": ["Coursera for Business", "LinkedIn Learning"],
  "Empathetic Leadership": ["BetterUp", "Hone"],
  "Change Management": ["Coursera for Business", "MasterClass for Business"],
  "AI Content Creation": ["Jasper", "ChatGPT Enterprise"],
  "Data Analytics": ["Tableau AI", "DataCamp"],
  "Prompt Engineering": ["ChatGPT Enterprise", "GitHub Copilot"],
  "No-Code Automation": ["Zapier", "Make (Integromat)"],
  "AI Writing": ["Grammarly Business", "Jasper"],
  "Video Production": ["Synthesia"],
  "Meeting Intelligence": ["Fireflies.ai"],
  "Design with AI": ["Midjourney"],
  "Coding with AI": ["GitHub Copilot", "Replit"],
  "AI/ML Fundamentals": ["Deeplearning.AI", "DataCamp"],
  "Workflow Automation": ["Zapier", "Make (Integromat)"],
  "AI Project Management": ["Notion AI", "Microsoft Copilot"],
};

function getToolsForSkill(skillName: string): string[] {
  // Exact match first
  if (skillToTools[skillName]) return skillToTools[skillName];
  // Partial match
  const lower = skillName.toLowerCase();
  for (const [key, tools] of Object.entries(skillToTools)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower)) return tools;
  }
  // Default tools by common keywords
  if (lower.includes("ai") || lower.includes("automat")) return ["ChatGPT Enterprise", "Microsoft Copilot"];
  if (lower.includes("lead") || lower.includes("manag")) return ["BetterUp", "Coursera for Business"];
  if (lower.includes("data") || lower.includes("analy")) return ["Tableau AI", "DataCamp"];
  return ["ChatGPT Enterprise"];
}

export function ActionPlan({ result }: ActionPlanProps) {
  const navigate = useNavigate();

  const groupedSkills = useMemo(() => {
    return result.skills.reduce((acc, skill) => {
      acc[skill.category] = acc[skill.category] || [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<SkillCategory, typeof result.skills>);
  }, [result.skills]);

  const handleToolClick = (toolName: string) => {
    navigate(`/tools?tool=${encodeURIComponent(toolName)}&role=${encodeURIComponent(result.jobTitle)}`);
  };

  const handleBrowseAll = (category?: string) => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    params.set("role", result.jobTitle);
    navigate(`/tools?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {(Object.keys(categoryConfig) as SkillCategory[]).map((cat, catIdx) => {
        const skills = groupedSkills[cat];
        if (!skills?.length) return null;
        const config = categoryConfig[cat];
        const CatIcon = config.icon;

        return (
          <motion.div
            key={cat}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: catIdx * 0.08 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} shrink-0`} />
                  <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">{config.label}</span>
                </div>

                <div className="space-y-3">
                  {skills.map((skill, si) => {
                    const tools = getToolsForSkill(skill.name);
                    return (
                      <div key={si} className="pb-3 border-b border-border/30 last:border-0 last:pb-0">
                        <p className="text-xs font-semibold text-foreground mb-0.5">{skill.name}</p>
                        <p className="text-[11px] text-muted-foreground leading-relaxed mb-2">{skill.description}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {tools.map(toolName => (
                            <button
                              key={toolName}
                              onClick={() => handleToolClick(toolName)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-secondary hover:bg-accent text-[11px] text-foreground/80 hover:text-foreground transition-colors border border-border/40 cursor-pointer"
                            >
                              <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                              {toolName}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground mt-2 w-full"
                  onClick={() => handleBrowseAll(cat)}
                >
                  Browse all {config.label.toLowerCase()} <ArrowRight className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
