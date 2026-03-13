import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { JobAnalysisResult, SkillCategory } from "@/types/analysis";

const categoryLabels: Record<SkillCategory, string> = {
  ai_tools: "AI Tools",
  human_skills: "Human Skills",
  new_capabilities: "New Capabilities",
};

const TeamAnalysis = () => {
  const navigate = useNavigate();
  const [teamResults, setTeamResults] = useState<JobAnalysisResult[]>([]);
  const [roleEntries, setRoleEntries] = useState<{ title: string; jdText?: string }[]>([]);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("team_results");
      const roles = sessionStorage.getItem("team_roles");
      if (raw) setTeamResults(JSON.parse(raw));
      if (roles) setRoleEntries(JSON.parse(roles));
    } catch {
      // ignore
    }
  }, []);

  if (teamResults.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">No team analysis data found.</p>
        <Button variant="outline" onClick={() => navigate("/")} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Button>
      </div>
    );
  }

  const avgAugmented = Math.round(teamResults.reduce((s, r) => s + r.summary.augmentedPercent, 0) / teamResults.length);
  const avgAutomation = Math.round(teamResults.reduce((s, r) => s + r.summary.automationRiskPercent, 0) / teamResults.length);
  const avgNewSkills = Math.round(teamResults.reduce((s, r) => s + r.summary.newSkillsPercent, 0) / teamResults.length);

  const skillFreq = new Map<string, { count: number; category: SkillCategory; description: string }>();
  teamResults.forEach((r) => {
    r.skills.forEach((s) => {
      const existing = skillFreq.get(s.name);
      if (existing) existing.count++;
      else skillFreq.set(s.name, { count: 1, category: s.category, description: s.description });
    });
  });
  const sortedSkills = [...skillFreq.entries()].sort((a, b) => b[1].count - a[1].count);
  const sharedSkills = sortedSkills.filter(([, v]) => v.count > 1);
  const uniqueSkills = sortedSkills.filter(([, v]) => v.count === 1).slice(0, 8);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 pt-12 pb-24">
        <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="gap-2 mb-8 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
          {/* Team Overview */}
          <div>
            <h1 className="font-display text-2xl font-bold text-foreground mb-6">Team Overview</h1>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: `${avgAugmented}% of tasks will involve AI tools`, value: avgAugmented },
                { label: `${avgAutomation}% of tasks could be fully automated`, value: avgAutomation },
                { label: `${avgNewSkills}% of roles require learning new skills`, value: avgNewSkills },
              ].map((stat, i) => (
                <Card key={i} className="border-border">
                  <CardContent className="p-4 text-center">
                    <p className="text-2xl font-bold text-foreground">{stat.value}%</p>
                    <p className="text-xs text-muted-foreground mt-1">{stat.label.replace(/^\d+% of /, "")}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* AI Impact by Role */}
          <div>
            <h2 className="font-display font-semibold text-foreground mb-4">AI Impact by Role</h2>
            <div className="space-y-3">
              {teamResults.map((r, idx) => (
                <Card key={r.jobTitle + idx} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm">{r.jobTitle}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{r.summary.automationRiskPercent}% automation risk</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-primary hover:text-primary"
                          onClick={() => {
                            const roleEntry = roleEntries[idx];
                            if (roleEntry?.jdText) {
                              sessionStorage.setItem("jd_text", roleEntry.jdText);
                            } else {
                              sessionStorage.removeItem("jd_text");
                            }
                            const params = new URLSearchParams({ title: r.jobTitle, company: r.company || "" });
                            if (roleEntry?.jdText) params.set("jd", "session");
                            navigate(`/analysis?${params.toString()}`);
                          }}
                        >
                          <Search className="h-3 w-3" /> Deep dive
                        </Button>
                      </div>
                    </div>
                    <Progress value={r.summary.augmentedPercent} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Shared Skill Gaps */}
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

          {/* Role-Specific Skills */}
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
      </div>
    </div>
  );
};

export default TeamAnalysis;
