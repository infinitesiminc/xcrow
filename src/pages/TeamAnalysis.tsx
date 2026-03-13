import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search, Sparkles, Bot, ShieldAlert, GraduationCap, Users, User, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JobAnalysisResult, SkillCategory, AIImpactLevel, TaskState } from "@/types/analysis";

const categoryLabels: Record<SkillCategory, string> = {
  ai_tools: "AI Tools",
  human_skills: "Human Skills",
  new_capabilities: "New Capabilities",
};

const impactColors: Record<AIImpactLevel, { bg: string; text: string; bar: string }> = {
  low: { bg: "bg-success/10", text: "text-success", bar: "bg-success" },
  medium: { bg: "bg-warning/10", text: "text-warning", bar: "bg-warning" },
  high: { bg: "bg-destructive/10", text: "text-destructive", bar: "bg-destructive" },
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

  // Determine dominant impact level per role
  const getRoleDominantImpact = (r: JobAnalysisResult): AIImpactLevel => {
    const counts = { low: 0, medium: 0, high: 0 };
    r.tasks.forEach((t) => counts[t.impactLevel]++);
    if (counts.high >= counts.medium && counts.high >= counts.low) return "high";
    if (counts.medium >= counts.low) return "medium";
    return "low";
  };

  const statCards = [
    {
      label: `${avgAugmented}% of tasks will involve AI tools`,
      value: avgAugmented,
      icon: Bot,
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      barColor: "bg-primary",
    },
    {
      label: `${avgAutomation}% could be fully automated`,
      value: avgAutomation,
      icon: ShieldAlert,
      iconBg: "bg-destructive/10",
      iconColor: "text-destructive",
      barColor: "bg-destructive",
    },
    {
      label: `${avgNewSkills}% require learning new skills`,
      value: avgNewSkills,
      icon: GraduationCap,
      iconBg: "bg-warning/10",
      iconColor: "text-warning",
      barColor: "bg-warning",
    },
  ];

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header — matches individual analysis */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-4 -ml-2 text-muted-foreground h-7 text-xs">
            <ArrowLeft className="w-3 h-3 mr-1" /> New analysis
          </Button>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-2xl font-display font-bold text-foreground">Team Overview</h1>
            <span className="text-sm text-muted-foreground">{teamResults.length} roles analyzed</span>
          </div>
        </motion.div>

        {/* Stat Cards — identical to individual */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statCards.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.07 }}>
                  <Card className="relative overflow-hidden border-border hover:border-primary/20 transition-colors">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`flex items-center justify-center w-10 h-10 rounded-xl shrink-0 ${stat.iconBg}`}>
                          <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                        </div>
                        <p className="text-sm font-semibold text-foreground leading-snug">{stat.label}</p>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${stat.barColor} transition-all duration-700`} style={{ width: `${stat.value}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* AI Impact by Role */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mb-8">
          <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">AI Impact by Role</h2>
          <div className="space-y-3">
            {teamResults.map((r, idx) => {
              const impact = getRoleDominantImpact(r);
              const colors = impactColors[impact];
              return (
                <motion.div key={r.jobTitle + idx} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 + idx * 0.04 }}>
                  <Card className={`border-border hover:border-primary/20 transition-colors border-l-4 ${
                    impact === "high" ? "border-l-destructive" : impact === "medium" ? "border-l-warning" : "border-l-success"
                  }`}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-lg shrink-0 ${colors.bg}`}>
                            {impact === "high" ? <Bot className={`h-4 w-4 ${colors.text}`} /> :
                             impact === "medium" ? <Users className={`h-4 w-4 ${colors.text}`} /> :
                             <User className={`h-4 w-4 ${colors.text}`} />}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-foreground text-sm block truncate">{r.jobTitle}</span>
                            <span className="text-[11px] text-muted-foreground">
                              {r.summary.augmentedPercent}% AI-augmented · {r.summary.automationRiskPercent}% automation risk
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1 text-primary hover:text-primary shrink-0"
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
                      <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                        <div className={`h-full rounded-full ${colors.bar} transition-all duration-700`} style={{ width: `${r.summary.augmentedPercent}%` }} />
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Shared Skill Gaps */}
        {sharedSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mb-8">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="h-3.5 w-3.5 text-primary" />
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Shared Skill Gaps</h2>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Skills needed across multiple roles — high-impact training investments.</p>
            <div className="space-y-2">
              {sharedSkills.map(([name, data]) => (
                <Card key={name} className="border-border hover:border-primary/20 transition-colors">
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="min-w-0">
                      <span className="font-medium text-foreground text-sm">{name}</span>
                      <p className="text-xs text-muted-foreground truncate">{data.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className="text-[10px]">{categoryLabels[data.category]}</Badge>
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[10px]">{data.count} roles</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {/* Role-Specific Skills */}
        {uniqueSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="mb-8">
            <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Role-Specific Skills</h2>
            <div className="flex flex-wrap gap-2">
              {uniqueSkills.map(([name, data]) => (
                <Badge key={name} variant="outline" className="text-xs py-1.5" title={data.description}>
                  {name}
                </Badge>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default TeamAnalysis;
