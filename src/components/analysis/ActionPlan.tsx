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

const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench; bg: string; iconColor: string }> = {
  ai_tools: { label: "AI Tools & Platforms", icon: Wrench, bg: "bg-primary/10", iconColor: "text-primary" },
  human_skills: { label: "Human-Edge Skills", icon: Heart, bg: "bg-destructive/10", iconColor: "text-destructive" },
  new_capabilities: { label: "New Capabilities", icon: Sparkles, bg: "bg-warning/10", iconColor: "text-warning" },
};

const priorityStyles: Record<string, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

export function ActionPlan({ result, topPathway, onPractice }: ActionPlanProps) {
  const steps = useMemo(() => {
    const plan: { number: number; headline: string; description: string; cta?: { label: string; action: () => void } | { label: string; url: string } }[] = [];

    // Step 1: Highest priority skill
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

    // Step 2: Most at-risk task to practice
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

    // Step 3: Career pathway
    if (topPathway) {
      plan.push({
        number: 3,
        headline: `Explore transition to ${topPathway.title}`,
        description: `You share ${topPathway.skillOverlap}% of skills. Bridge the gap by learning: ${topPathway.newSkillsNeeded.slice(0, 3).join(", ")}.`,
      });
    } else {
      // Fallback: another high-priority skill
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
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-display font-bold shrink-0">
                  {step.number}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-display font-bold text-foreground mb-0.5">{step.headline}</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
                  {step.cta && (
                    <div className="mt-2">
                      {"url" in step.cta ? (
                        <a href={step.cta.url} target="_blank" rel="noopener noreferrer">
                          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-primary hover:bg-primary/10">
                            <ExternalLink className="h-3 w-3" /> {step.cta.label}
                          </Button>
                        </a>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-primary hover:bg-primary/10"
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
                <div className="flex items-center gap-2">
                  <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${config.bg}`}>
                    <CatIcon className={`h-3.5 w-3.5 ${config.iconColor}`} />
                  </div>
                  <span className="text-xs font-bold text-foreground uppercase tracking-wide">{config.label}</span>
                  <Badge variant="secondary" className="text-[10px] ml-1">{skills.length}</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pb-1">
                  {skills.map((skill, si) => (
                    <div key={si} className="p-3 rounded-lg border border-border/50 bg-background">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`text-[9px] px-1.5 py-0 capitalize shrink-0 ${priorityStyles[skill.priority]}`}>
                          {skill.priority}
                        </Badge>
                        <span className="text-xs font-semibold text-foreground">{skill.name}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-relaxed">{skill.description}</p>
                      {skill.resources && skill.resources.length > 0 && (
                        <div className="mt-2 space-y-1.5">
                          {skill.resources.map((r, ri) => (
                            <a key={ri} href={r.url} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1.5 text-[11px] text-primary hover:underline">
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
