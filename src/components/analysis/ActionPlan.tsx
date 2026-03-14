import { useMemo } from "react";
import { motion } from "framer-motion";
import { BookOpen, Play, ArrowRight, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Wrench, Heart, Sparkles } from "lucide-react";
import type { JobAnalysisResult, SkillCategory } from "@/types/analysis";
import type { EscoPathway } from "@/lib/esco-api";

interface ActionPlanProps {
  result: JobAnalysisResult;
  topPathway: EscoPathway | null;
  onPractice: (taskName: string) => void;
}

// Colored dot icons, grayscale text
const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench; dotColor: string }> = {
  ai_tools: { label: "AI Tools & Platforms", icon: Wrench, dotColor: "bg-dot-blue" },
  human_skills: { label: "Human-Edge Skills", icon: Heart, dotColor: "bg-dot-teal" },
  new_capabilities: { label: "New Capabilities", icon: Sparkles, dotColor: "bg-dot-purple" },
};

const priorityDot: Record<string, string> = {
  high: "bg-dot-purple",
  medium: "bg-dot-amber",
  low: "bg-muted-foreground/30",
};

export function ActionPlan({ result, topPathway, onPractice }: ActionPlanProps) {
  const steps = useMemo(() => {
    const plan: { number: number; headline: string; description: string; cta?: { label: string; action: () => void } | { label: string; url: string } }[] = [];

    const topSkill = result.skills.find(s => s.priority === "high") || result.skills[0];
    if (topSkill) {
      const resource = topSkill.resources?.[0];
      plan.push({
        number: 1,
        headline: `Learn ${topSkill.name}`,
        description: topSkill.description,
        cta: resource ? { label: resource.name, url: resource.url } : undefined,
      });
    }

    const atRiskTask = result.tasks
      .filter(t => t.trend === "fully_ai_soon" || t.trend === "increasing_ai")
      .sort((a, b) => {
        const scoreA = (a.currentState === "mostly_ai" ? 3 : a.currentState === "human_ai" ? 2 : 1);
        const scoreB = (b.currentState === "mostly_ai" ? 3 : b.currentState === "human_ai" ? 2 : 1);
        return scoreB - scoreA;
      })[0];
    if (atRiskTask) {
      plan.push({
        number: 2,
        headline: `Practice "${atRiskTask.name}" with AI`,
        description: `This task is ${atRiskTask.trend === "fully_ai_soon" ? "rapidly moving to full automation" : "increasingly AI-assisted"}. Practice collaborating with AI on it now.`,
        cta: { label: "Start Practice", action: () => onPractice(atRiskTask.name) },
      });
    }

    if (topPathway) {
      plan.push({
        number: 3,
        headline: `Explore transition to ${topPathway.title}`,
        description: `You share ${topPathway.skillOverlap}% of skills. Bridge the gap by learning: ${topPathway.newSkillsNeeded.slice(0, 3).join(", ")}.`,
      });
    } else {
      const secondSkill = result.skills.filter(s => s.priority === "high")[1] || result.skills[1];
      if (secondSkill) {
        plan.push({
          number: 3,
          headline: `Build ${secondSkill.name}`,
          description: secondSkill.description,
        });
      }
    }

    return plan;
  }, [result, topPathway, onPractice]);

  const groupedSkills = useMemo(() => {
    return result.skills.reduce((acc, skill) => {
      acc[skill.category] = acc[skill.category] || [];
      acc[skill.category].push(skill);
      return acc;
    }, {} as Record<SkillCategory, typeof result.skills>);
  }, [result.skills]);

  return (
    <div>
      {/* 3-step plan */}
      <div className="space-y-3 mb-8">
        {steps.map((step, i) => (
          <motion.div
            key={step.number}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Card className="border-border/50">
              <CardContent className="p-4 flex items-start gap-4">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent text-foreground/60 text-sm font-sans font-bold shrink-0">
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-sans font-bold text-foreground mb-0.5">{step.headline}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  {step.cta && (
                    <div className="mt-2">
                      {"url" in step.cta ? (
                        <a href={step.cta.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground">
                            <ExternalLink className="h-3 w-3" /> {step.cta.label}
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-muted-foreground hover:text-foreground"
                          onClick={step.cta.action}
                        >
                          <Play className="h-3 w-3" /> {step.cta.label}
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Expandable skill categories */}
      <Accordion type="multiple" className="space-y-2">
        {(Object.keys(categoryConfig) as SkillCategory[]).map(cat => {
          const skills = groupedSkills[cat];
          if (!skills?.length) return null;
          const config = categoryConfig[cat];
          const CatIcon = config.icon;

          return (
            <AccordionItem key={cat} value={cat} className="border rounded-lg px-3">
              <AccordionTrigger className="py-3 hover:no-underline">
                <div className="flex items-center gap-2.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${config.dotColor} shrink-0`} />
                  <CatIcon className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">{config.label}</span>
                  <span className="text-[10px] text-muted-foreground ml-1">{skills.length}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-1">
                  {skills.map((skill, si) => (
                    <div key={si} className="p-3 rounded-lg border border-border/50 bg-background">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${priorityDot[skill.priority]} shrink-0`} />
                        <span className="text-[9px] uppercase tracking-wider text-muted-foreground capitalize">{skill.priority}</span>
                        <span className="text-xs font-semibold text-foreground">{skill.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{skill.description}</p>
                      {skill.resources && skill.resources.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {skill.resources.map((r, ri) => (
                            <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[11px] text-muted-foreground hover:text-foreground transition-colors">
                              <ExternalLink className="h-3 w-3 shrink-0" /> {r.name}
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
