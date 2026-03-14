import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, FolderKanban, Users, Sparkles, Plus, X, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";

const AI_TOOLS = ["ChatGPT", "Copilot", "Claude", "Midjourney", "Gemini", "Cursor", "Notion AI", "Jasper", "Perplexity", "Zapier AI"];
const HUMAN_SKILLS = ["Strategic Thinking", "Negotiation", "Leadership", "Communication", "Problem Solving", "Creativity", "Data Analysis", "Project Management", "Research", "Client Relations"];
const TECH_SKILLS = ["Python", "SQL", "React", "AWS", "Tableau", "Excel", "Figma", "Jira", "Salesforce", "Power BI"];

const ALL_SKILLS = [...AI_TOOLS, ...HUMAN_SKILLS, ...TECH_SKILLS];

const hashStr = (s: string) => {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
};

// Mock staff database
const MOCK_STAFF = [
  { name: "Sarah Chen", role: "Data Scientist", department: "Analytics" },
  { name: "Marcus Johnson", role: "Software Engineer", department: "Engineering" },
  { name: "Priya Sharma", role: "Product Manager", department: "Product" },
  { name: "James Wilson", role: "UX Designer", department: "Design" },
  { name: "Elena Rodriguez", role: "Marketing Manager", department: "Marketing" },
  { name: "David Kim", role: "Financial Analyst", department: "Finance" },
  { name: "Aisha Patel", role: "Project Manager", department: "Operations" },
  { name: "Tom Brennan", role: "DevOps Engineer", department: "Engineering" },
  { name: "Lisa Chang", role: "Content Strategist", department: "Marketing" },
  { name: "Ryan O'Brien", role: "Business Analyst", department: "Strategy" },
  { name: "Mei Wong", role: "QA Manager", department: "Engineering" },
  { name: "Alex Nguyen", role: "HR Manager", department: "People" },
  { name: "Chris Taylor", role: "Cybersecurity Analyst", department: "IT" },
  { name: "Sophie Martin", role: "Compliance Officer", department: "Legal" },
  { name: "Omar Hassan", role: "Operations Manager", department: "Operations" },
].map((s) => {
  const h = hashStr(s.name);
  const skillCount = 3 + (h % 4);
  const skills: { name: string; proficiency: number }[] = [];
  for (let i = 0; i < skillCount; i++) {
    const idx = (h + i * 13) % ALL_SKILLS.length;
    skills.push({ name: ALL_SKILLS[idx], proficiency: 30 + ((h >> (i + 1)) % 70) });
  }
  return { ...s, skills };
});

// Predefined project templates
const PROJECT_TEMPLATES = [
  { name: "AI Chatbot Launch", skills: ["ChatGPT", "Python", "React", "Project Management"] },
  { name: "Data Migration", skills: ["SQL", "AWS", "Python", "Project Management"] },
  { name: "Brand Refresh", skills: ["Figma", "Creativity", "Communication", "Midjourney"] },
  { name: "Compliance Audit", skills: ["Excel", "Research", "Data Analysis", "Communication"] },
];

const ProjectStaffing = ({ embedded }: { embedded?: boolean }) => {
  const [projectName, setProjectName] = useState("");
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [skillSearch, setSkillSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [expandedStaff, setExpandedStaff] = useState<string | null>(null);

  const filteredSuggestions = useMemo(() => {
    if (!skillSearch) return [];
    const q = skillSearch.toLowerCase();
    return ALL_SKILLS.filter(
      (s) => s.toLowerCase().includes(q) && !requiredSkills.includes(s)
    ).slice(0, 8);
  }, [skillSearch, requiredSkills]);

  const addSkill = (skill: string) => {
    if (!requiredSkills.includes(skill)) {
      setRequiredSkills([...requiredSkills, skill]);
    }
    setSkillSearch("");
    setShowSuggestions(false);
  };

  const removeSkill = (skill: string) => {
    setRequiredSkills(requiredSkills.filter((s) => s !== skill));
  };

  const applyTemplate = (template: typeof PROJECT_TEMPLATES[0]) => {
    setProjectName(template.name);
    setRequiredSkills(template.skills);
  };

  // Score each staff member against required skills
  const rankedStaff = useMemo(() => {
    if (requiredSkills.length === 0) return [];
    return MOCK_STAFF.map((staff) => {
      const matchedSkills = requiredSkills.map((req) => {
        const found = staff.skills.find((s) => s.name === req);
        return { skill: req, proficiency: found?.proficiency ?? 0, hasSkill: !!found };
      });
      const matchCount = matchedSkills.filter((m) => m.hasSkill).length;
      const avgProficiency = matchedSkills.length > 0
        ? Math.round(matchedSkills.reduce((s, m) => s + m.proficiency, 0) / matchedSkills.length)
        : 0;
      const fitScore = Math.round((matchCount / requiredSkills.length) * 60 + avgProficiency * 0.4);
      return { ...staff, matchedSkills, matchCount, avgProficiency, fitScore };
    })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 10);
  }, [requiredSkills]);

  return (
    <div className={embedded ? "" : "min-h-screen bg-background"}>
      <div className={embedded ? "" : "max-w-5xl mx-auto px-4 py-8"}>
        {/* Header */}
        {!embedded && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <FolderKanban className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-sans font-bold text-foreground">Project Skill Matcher</h1>
                <p className="text-sm text-muted-foreground">Find the best-fit staff for your project based on skill mapping</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Templates */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mb-6">
          <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-2">Quick Templates</p>
          <div className="flex flex-wrap gap-2">
            {PROJECT_TEMPLATES.map((t) => (
              <Button
                key={t.name}
                variant="outline"
                size="sm"
                className="text-xs h-7 gap-1"
                onClick={() => applyTemplate(t)}
              >
                <Sparkles className="h-3 w-3" /> {t.name}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Project Input */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border mb-6">
            <CardContent className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Project Name</label>
                <Input
                  placeholder="e.g. AI Chatbot Launch"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="h-9 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-1.5 block">Required Skills</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Search skills & tools…"
                    value={skillSearch}
                    onChange={(e) => { setSkillSearch(e.target.value); setShowSuggestions(true); }}
                    onFocus={() => setShowSuggestions(true)}
                    className="pl-9 h-9 text-sm"
                  />
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-20 top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredSuggestions.map((s) => (
                        <button
                          key={s}
                          className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-accent/50 transition-colors flex items-center gap-2"
                          onClick={() => addSkill(s)}
                        >
                          <Plus className="h-3 w-3 text-primary" /> {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {requiredSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {requiredSkills.map((s) => (
                      <Badge
                        key={s}
                        variant="outline"
                        className="text-xs gap-1 px-2 py-0.5 bg-primary/5 text-primary border-primary/20 cursor-pointer hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-colors"
                        onClick={() => removeSkill(s)}
                      >
                        {s} <X className="h-3 w-3" />
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Results */}
        {requiredSkills.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Users className="h-4 w-4" /> Best Matches
              </h2>
              <span className="text-xs text-muted-foreground">{rankedStaff.length} candidates</span>
            </div>

            <div className="space-y-3">
              {rankedStaff.map((staff, i) => {
                const isExpanded = expandedStaff === staff.name;
                const fitColor = staff.fitScore >= 60 ? "text-success" : staff.fitScore >= 35 ? "text-warning" : "text-destructive";
                const fitBg = staff.fitScore >= 60 ? "bg-success" : staff.fitScore >= 35 ? "bg-warning" : "bg-destructive";

                return (
                  <Card
                    key={staff.name}
                    className={`border-border transition-all cursor-pointer ${isExpanded ? "ring-1 ring-primary/20" : "hover:border-primary/20"}`}
                    onClick={() => setExpandedStaff(isExpanded ? null : staff.name)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        {/* Rank */}
                        <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${
                          i === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                        }`}>
                          #{i + 1}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{staff.name}</span>
                            <Badge variant="outline" className="text-[9px] bg-muted text-muted-foreground border-border">{staff.department}</Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{staff.role}</p>
                        </div>

                        {/* Fit Score */}
                        <div className="text-right shrink-0">
                          <span className={`text-lg font-bold ${fitColor}`}>{staff.fitScore}%</span>
                          <p className="text-[10px] text-muted-foreground">fit score</p>
                        </div>

                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" /> : <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />}
                      </div>

                      {/* Skill match bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground shrink-0">{staff.matchCount}/{requiredSkills.length} skills</span>
                        <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div className={`h-full rounded-full ${fitBg} transition-all duration-700`} style={{ width: `${staff.fitScore}%` }} />
                        </div>
                      </div>

                      {/* Expanded skill breakdown */}
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="mt-4 pt-3 border-t border-border space-y-2"
                        >
                          <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">Skill Breakdown</p>
                          {staff.matchedSkills.map((ms) => (
                            <div key={ms.skill} className="flex items-center gap-2">
                              {ms.hasSkill ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
                              ) : (
                                <AlertTriangle className="h-3.5 w-3.5 text-destructive/60 shrink-0" />
                              )}
                              <span className="text-xs text-foreground flex-1">{ms.skill}</span>
                              {ms.hasSkill ? (
                                <div className="flex items-center gap-1.5">
                                  <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${
                                        ms.proficiency >= 70 ? "bg-success" : ms.proficiency >= 40 ? "bg-warning" : "bg-destructive"
                                      }`}
                                      style={{ width: `${ms.proficiency}%` }}
                                    />
                                  </div>
                                  <span className="text-[10px] text-muted-foreground w-7 text-right">{ms.proficiency}%</span>
                                </div>
                              ) : (
                                <Badge variant="outline" className="text-[9px] bg-destructive/5 text-destructive border-destructive/20">Gap</Badge>
                              )}
                            </div>
                          ))}

                          {/* Extra skills this person has */}
                          {staff.skills.filter((s) => !requiredSkills.includes(s.name)).length > 0 && (
                            <div className="pt-2">
                              <p className="text-[10px] text-muted-foreground mb-1">Additional skills</p>
                              <div className="flex flex-wrap gap-1">
                                {staff.skills
                                  .filter((s) => !requiredSkills.includes(s.name))
                                  .map((s) => (
                                    <Badge key={s.name} variant="outline" className="text-[8px] px-1 py-0 bg-muted text-muted-foreground border-border">
                                      {s.name}
                                    </Badge>
                                  ))}
                              </div>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}

              {rankedStaff.length === 0 && (
                <Card className="border-border">
                  <CardContent className="p-8 text-center">
                    <p className="text-sm text-muted-foreground">Add skills above to find matching staff</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectStaffing;
