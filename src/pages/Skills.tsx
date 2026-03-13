import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Wrench, Heart, Sparkles, Save, ExternalLink, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, SkillCategory, SkillPriority } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";

const categoryConfig: Record<SkillCategory, { label: string; icon: typeof Wrench; description: string }> = {
  ai_tools: { label: "AI Tools to Learn", icon: Wrench, description: "Master these tools to boost your productivity" },
  human_skills: { label: "Human Skills to Strengthen", icon: Heart, description: "Double down on what makes you irreplaceable" },
  new_capabilities: { label: "New Capabilities to Build", icon: Sparkles, description: "Develop these emerging skills to stay ahead" },
};

const priorityStyles: Record<SkillPriority, string> = {
  high: "bg-destructive/10 text-destructive border-destructive/20",
  medium: "bg-warning/10 text-warning border-warning/20",
  low: "bg-muted text-muted-foreground border-border",
};

const Skills = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const company = searchParams.get("company") || "";
  const jobTitle = searchParams.get("title") || "";
  const [result, setResult] = useState<JobAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobTitle) {
      navigate("/");
      return;
    }

    const load = async () => {
      setLoading(true);
      const prebuilt = findPrebuiltRole(jobTitle);
      if (prebuilt) {
        await new Promise((r) => setTimeout(r, 600));
        setResult({ ...prebuilt, company });
      } else {
        try {
          const aiResult = await analyzeJobWithAI(jobTitle, company);
          setResult(aiResult);
        } catch {
          navigate(`/analysis?company=${encodeURIComponent(company)}&title=${encodeURIComponent(jobTitle)}`);
        }
      }
      setLoading(false);
    };

    load();
  }, [jobTitle, company, navigate]);

  const handleSave = () => {
    toast({
      title: "Coming soon!",
      description: "Sign up to save your learning path and track progress.",
    });
  };

  if (loading || !result) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="max-w-2xl mx-auto space-y-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const grouped = result.skills.reduce(
    (acc, skill) => {
      acc[skill.category] = acc[skill.category] || [];
      acc[skill.category].push(skill);
      return acc;
    },
    {} as Record<SkillCategory, typeof result.skills>,
  );

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              navigate(`/analysis?company=${encodeURIComponent(company)}&title=${encodeURIComponent(jobTitle)}`)
            }
            className="mb-6 -ml-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to analysis
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">Skill Recommendations</h1>
          <p className="mt-1 text-muted-foreground">
            for {result.jobTitle}
            {result.company ? ` at ${result.company}` : ""}
          </p>
        </motion.div>

        {/* Skill Categories */}
        {(["ai_tools", "human_skills", "new_capabilities"] as SkillCategory[]).map((cat, catIndex) => {
          const config = categoryConfig[cat];
          const skills = grouped[cat] || [];
          if (!skills.length) return null;
          const Icon = config.icon;

          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + catIndex * 0.1 }}
              className="mb-8"
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-4 w-4 text-primary" />
                <h2 className="font-display font-semibold text-foreground">{config.label}</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{config.description}</p>

              <div className="space-y-3">
                {skills.map((skill, i) => (
                  <Card key={i} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-foreground">{skill.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">{skill.description}</p>

                          {/* Learning Resources */}
                          {skill.resources && skill.resources.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-2">
                              {skill.resources.map((resource, ri) => (
                                <a
                                  key={ri}
                                  href={resource.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  title={resource.summary}
                                  className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-md bg-accent text-accent-foreground hover:bg-accent/80 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  {resource.name}
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                        <Badge variant="outline" className={`shrink-0 capitalize ${priorityStyles[skill.priority]}`}>
                          {skill.priority}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>
          );
        })}

        {/* Save CTA */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-12 text-center"
        >
          <Card className="border-border bg-accent/30">
            <CardContent className="p-6">
              <h3 className="font-display font-semibold text-foreground mb-2">Save your learning path</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a free account to save your analysis, track progress, and revisit your skills roadmap.
              </p>
              <Button onClick={handleSave} className="gap-2">
                <Save className="w-4 h-4" /> Save My Path
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Skills;
