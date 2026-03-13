import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, X, Users, BarChart3, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobAnalysisResult, SkillCategory } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";
import { useToast } from "@/hooks/use-toast";

interface RoleEntry {
  id: string;
  title: string;
}

const categoryLabels: Record<SkillCategory, string> = {
  ai_tools: "AI Tools",
  human_skills: "Human Skills",
  new_capabilities: "New Capabilities",
};

const Team = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [roles, setRoles] = useState<RoleEntry[]>([
    { id: crypto.randomUUID(), title: "" },
    { id: crypto.randomUUID(), title: "" },
  ]);
  const [results, setResults] = useState<JobAnalysisResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  const addRole = () => {
    if (roles.length >= 10) return;
    setRoles([...roles, { id: crypto.randomUUID(), title: "" }]);
  };

  const removeRole = (id: string) => {
    if (roles.length <= 2) return;
    setRoles(roles.filter((r) => r.id !== id));
  };

  const updateRole = (id: string, title: string) => {
    setRoles(roles.map((r) => (r.id === id ? { ...r, title } : r)));
  };

  const handleAnalyze = async () => {
    const filledRoles = roles.filter((r) => r.title.trim());
    if (filledRoles.length < 2) {
      toast({ title: "Add at least 2 roles", description: "Enter job titles for your team members." });
      return;
    }

    setLoading(true);
    setAnalyzed(false);

    try {
      const promises = filledRoles.map(async (role) => {
        const prebuilt = findPrebuiltRole(role.title);
        if (prebuilt) return { ...prebuilt, company: "" };
        return analyzeJobWithAI(role.title, "");
      });

      const allResults = await Promise.all(promises);
      setResults(allResults);
      setAnalyzed(true);
    } catch {
      toast({ title: "Analysis failed", description: "Some roles couldn't be analyzed. Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Aggregate data
  const avgAugmented = results.length ? Math.round(results.reduce((s, r) => s + r.summary.augmentedPercent, 0) / results.length) : 0;
  const avgAutomation = results.length ? Math.round(results.reduce((s, r) => s + r.summary.automationRiskPercent, 0) / results.length) : 0;
  const avgNewSkills = results.length ? Math.round(results.reduce((s, r) => s + r.summary.newSkillsPercent, 0) / results.length) : 0;

  // Skill frequency across roles
  const skillFreq = new Map<string, { count: number; category: SkillCategory; description: string }>();
  results.forEach((r) => {
    r.skills.forEach((s) => {
      const existing = skillFreq.get(s.name);
      if (existing) {
        existing.count++;
      } else {
        skillFreq.set(s.name, { count: 1, category: s.category, description: s.description });
      }
    });
  });

  const sortedSkills = [...skillFreq.entries()].sort((a, b) => b[1].count - a[1].count);
  const sharedSkills = sortedSkills.filter(([, v]) => v.count > 1);
  const uniqueSkills = sortedSkills.filter(([, v]) => v.count === 1).slice(0, 8);

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back to home
          </Button>

          <div className="flex items-center gap-3 mb-2">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-display font-bold text-foreground">Team AI Impact</h1>
          </div>
          <p className="text-muted-foreground mb-8">
            Add your team's roles to see combined AI impact and shared skill gaps.
          </p>
        </motion.div>

        {/* Role inputs */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-3 mb-6">
          <AnimatePresence>
            {roles.map((role, i) => (
              <motion.div
                key={role.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex gap-2"
              >
                <Input
                  placeholder={`Role ${i + 1} — e.g. Software Engineer`}
                  value={role.title}
                  onChange={(e) => updateRole(role.id, e.target.value)}
                  className="h-11 bg-card border-border"
                />
                {roles.length > 2 && (
                  <Button variant="ghost" size="icon" onClick={() => removeRole(role.id)} className="shrink-0 text-muted-foreground">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          <div className="flex gap-3">
            <Button variant="outline" size="sm" onClick={addRole} disabled={roles.length >= 10} className="gap-1">
              <Plus className="h-3.5 w-3.5" /> Add role
            </Button>
            <Button onClick={handleAnalyze} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />}
              {loading ? "Analyzing..." : "Analyze Team"}
            </Button>
          </div>
        </motion.div>

        {/* Results */}
        {analyzed && results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 mt-10">
            {/* Summary */}
            <div>
              <h2 className="font-display font-semibold text-foreground mb-4">Team Overview</h2>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Avg. Augmented", value: avgAugmented },
                  { label: "Avg. Automation Risk", value: avgAutomation },
                  { label: "Avg. New Skills Needed", value: avgNewSkills },
                ].map((stat) => (
                  <Card key={stat.label} className="border-border">
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-foreground">{stat.value}%</p>
                      <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Per-role bars */}
            <div>
              <h2 className="font-display font-semibold text-foreground mb-4">AI Impact by Role</h2>
              <div className="space-y-3">
                {results.map((r) => (
                  <Card key={r.jobTitle} className="border-border">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground text-sm">{r.jobTitle}</span>
                        <span className="text-xs text-muted-foreground">{r.summary.automationRiskPercent}% automation risk</span>
                      </div>
                      <Progress value={r.summary.augmentedPercent} className="h-2" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            {/* Shared skill gaps */}
            {sharedSkills.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <h2 className="font-display font-semibold text-foreground">Shared Skill Gaps</h2>
                </div>
                <p className="text-sm text-muted-foreground mb-4">Skills needed across multiple roles — high-impact training investments.</p>
                <div className="space-y-2">
                  {sharedSkills.map(([name, data]) => (
                    <Card key={name} className="border-border">
                      <CardContent className="p-3 flex items-center justify-between">
                        <div>
                          <span className="font-medium text-foreground text-sm">{name}</span>
                          <p className="text-xs text-muted-foreground">{data.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline" className="text-xs">{categoryLabels[data.category]}</Badge>
                          <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{data.count} roles</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Role-specific skills */}
            {uniqueSkills.length > 0 && (
              <div>
                <h2 className="font-display font-semibold text-foreground mb-4">Role-Specific Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {uniqueSkills.map(([name, data]) => (
                    <Badge key={name} variant="outline" className="text-xs py-1.5" title={data.description}>
                      {name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Team;
