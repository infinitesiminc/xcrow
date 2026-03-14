import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, FolderKanban, Users, Sparkles, Plus, X, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, ArrowRight, Zap, Clock, Play, BookOpen,
  Target, Brain, Lightbulb, Send
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
  const skillCount = 5 + (h % 5); // 5-9 skills per person
  const skills: { name: string; proficiency: number }[] = [];
  for (let i = 0; i < skillCount; i++) {
    const idx = (h + i * 7) % ALL_SKILLS.length;
    skills.push({ name: ALL_SKILLS[idx], proficiency: 45 + ((h >> (i + 1)) % 55) });
  }
  return { ...s, skills };
});

// Predefined project templates
const PROJECT_TEMPLATES = [
  { name: "Project Quantum AI", skills: ["Python", "ChatGPT", "AWS", "Data Analysis", "Strategic Thinking", "Copilot"] },
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
  const [simGenerated, setSimGenerated] = useState(false);
  const [simGenerating, setSimGenerating] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);

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
      const matchedOnly = matchedSkills.filter((m) => m.hasSkill);
      const avgProficiency = matchedOnly.length > 0
        ? Math.round(matchedOnly.reduce((s, m) => s + m.proficiency, 0) / matchedOnly.length)
        : 0;
      const coverageScore = (matchCount / requiredSkills.length) * 100;
      const fitScore = Math.min(99, Math.round(coverageScore * 0.6 + avgProficiency * 0.4));
      return { ...staff, matchedSkills, matchCount, avgProficiency, fitScore };
    })
      .sort((a, b) => b.fitScore - a.fitScore)
      .slice(0, 10);
  }, [requiredSkills]);

  const toggleCandidate = (name: string) => {
    setSelectedCandidates((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  };

  const mockSimScenarios = useMemo(() => {
    if (!simGenerated || requiredSkills.length === 0) return [];
    return requiredSkills.slice(0, 5).map((skill) => {
      const h = hashStr(skill + projectName);
      return {
        skill,
        title: `${skill} — Real-world application`,
        type: h % 2 === 0 ? "Scenario MCQ" : "Problem Solving",
        questions: 3 + (h % 3),
        duration: `${5 + (h % 8)} min`,
        difficulty: h % 3 === 0 ? "Advanced" : h % 3 === 1 ? "Intermediate" : "Foundational",
      };
    });
  }, [simGenerated, requiredSkills, projectName]);

  const handleGenerateSim = () => {
    setSimGenerating(true);
    setTimeout(() => {
      setSimGenerating(false);
      setSimGenerated(true);
    }, 1500);
  };

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
                        {/* Select checkbox */}
                        <button
                          className={`flex items-center justify-center w-5 h-5 rounded border shrink-0 transition-colors ${
                            selectedCandidates.has(staff.name)
                              ? "bg-primary border-primary text-primary-foreground"
                              : "border-border hover:border-primary/50"
                          }`}
                          onClick={(e) => { e.stopPropagation(); toggleCandidate(staff.name); }}
                        >
                          {selectedCandidates.has(staff.name) && <CheckCircle2 className="h-3 w-3" />}
                        </button>

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

            {/* Simulation Builder */}
            {rankedStaff.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="mt-8">
                <Card className="border-border border-dashed border-primary/30 bg-primary/[0.02]">
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
                        <Zap className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Auto-Build Skill Simulation</h3>
                        <p className="text-xs text-muted-foreground">
                          Generate a tailored assessment to test {selectedCandidates.size > 0 ? `${selectedCandidates.size} selected candidate${selectedCandidates.size > 1 ? "s" : ""}` : "candidates"} on project-specific skills
                        </p>
                      </div>
                    </div>

                    {selectedCandidates.size > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-4">
                        {Array.from(selectedCandidates).map((name) => (
                          <Badge key={name} variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {!simGenerated ? (
                      <Button
                        onClick={handleGenerateSim}
                        disabled={simGenerating || requiredSkills.length === 0}
                        className="gap-2 text-sm"
                        size="sm"
                      >
                        {simGenerating ? (
                          <><div className="h-3 w-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" /> Generating…</>
                        ) : (
                          <><Brain className="h-3.5 w-3.5" /> Generate Simulation</>
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px] bg-success/10 text-success border-success/20 gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Simulation Ready
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {mockSimScenarios.length} modules · {mockSimScenarios.reduce((s, sc) => s + sc.questions, 0)} questions
                          </span>
                        </div>

                        <div className="space-y-2">
                          {mockSimScenarios.map((sc, i) => (
                            <div key={sc.skill} className="flex items-center gap-3 p-3 rounded-lg bg-background border border-border">
                              <div className="flex items-center justify-center w-7 h-7 rounded-md bg-primary/10 text-primary text-xs font-bold shrink-0">
                                {i + 1}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">{sc.title}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <Badge variant="outline" className="text-[8px] px-1 py-0 bg-muted text-muted-foreground border-border">{sc.type}</Badge>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><BookOpen className="h-2.5 w-2.5" /> {sc.questions} Q</span>
                                  <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {sc.duration}</span>
                                </div>
                              </div>
                              <Badge variant="outline" className={`text-[9px] ${
                                sc.difficulty === "Advanced" ? "bg-destructive/10 text-destructive border-destructive/20"
                                : sc.difficulty === "Intermediate" ? "bg-warning/10 text-warning border-warning/20"
                                : "bg-success/10 text-success border-success/20"
                              }`}>{sc.difficulty}</Badge>
                            </div>
                          ))}
                        </div>

                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" className="gap-1.5 text-xs" disabled={selectedCandidates.size === 0} onClick={() => setShowResults(true)}>
                            <Send className="h-3 w-3" /> {showResults ? "Results Sent" : `Send to ${selectedCandidates.size > 0 ? `${selectedCandidates.size} Candidate${selectedCandidates.size > 1 ? "s" : ""}` : "Candidates"}`}
                          </Button>
                          <Button size="sm" variant="outline" className="gap-1.5 text-xs">
                            <Play className="h-3 w-3" /> Preview Simulation
                          </Button>
                          <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setSimGenerated(false); setShowResults(false); }}>
                            Regenerate
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Simulation Results */}
            {showResults && simGenerated && rankedStaff.length >= 3 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="mt-8">
                <h2 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
                  <Target className="h-4 w-4" /> Simulation Results — {projectName || "Project"}
                </h2>

                <div className="space-y-4">
                  {rankedStaff.slice(0, 3).map((staff, idx) => {
                    const h = hashStr(staff.name + "simresult");
                    const overallScore = 55 + (h % 35); // 55-89
                    const completionTime = `${12 + (h % 20)} min`;
                    const skillScores = mockSimScenarios.map((sc) => {
                      const sh = hashStr(staff.name + sc.skill);
                      return {
                        skill: sc.skill,
                        score: 40 + (sh % 55), // 40-94
                        correct: 1 + (sh % sc.questions),
                        total: sc.questions,
                      };
                    });
                    const strengths = skillScores.filter((s) => s.score >= 70).map((s) => s.skill);
                    const gaps = skillScores.filter((s) => s.score < 55).map((s) => s.skill);
                    const verdict = overallScore >= 75 ? "Strong Fit" : overallScore >= 60 ? "Potential Fit" : "Needs Development";
                    const verdictColor = overallScore >= 75 ? "text-success" : overallScore >= 60 ? "text-warning" : "text-destructive";
                    const verdictBg = overallScore >= 75 ? "bg-success/10 border-success/20" : overallScore >= 60 ? "bg-warning/10 border-warning/20" : "bg-destructive/10 border-destructive/20";

                    return (
                      <Card key={staff.name} className="border-border overflow-hidden">
                        <CardContent className="p-0">
                          {/* Header */}
                          <div className="flex items-center gap-3 p-4 border-b border-border">
                            <div className={`flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold shrink-0 ${
                              idx === 0 ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              #{idx + 1}
                            </div>
                            <div className="flex-1 min-w-0">
                              <span className="font-medium text-sm text-foreground">{staff.name}</span>
                              <p className="text-xs text-muted-foreground">{staff.role} · {staff.department}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <span className={`text-2xl font-bold ${verdictColor}`}>{overallScore}%</span>
                              <Badge variant="outline" className={`block mt-1 text-[9px] ${verdictBg} ${verdictColor}`}>{verdict}</Badge>
                            </div>
                          </div>

                          {/* Skill scores */}
                          <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                              <span>Completed in {completionTime}</span>
                              <span>{skillScores.reduce((s, sc) => s + sc.correct, 0)}/{skillScores.reduce((s, sc) => s + sc.total, 0)} correct</span>
                            </div>

                            {skillScores.map((sc) => (
                              <div key={sc.skill}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-xs text-foreground">{sc.skill}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground">{sc.correct}/{sc.total}</span>
                                    <span className={`text-xs font-medium ${sc.score >= 70 ? "text-success" : sc.score >= 55 ? "text-warning" : "text-destructive"}`}>{sc.score}%</span>
                                  </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-secondary overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-700 ${
                                    sc.score >= 70 ? "bg-success" : sc.score >= 55 ? "bg-warning" : "bg-destructive"
                                  }`} style={{ width: `${sc.score}%` }} />
                                </div>
                              </div>
                            ))}

                            {/* Strengths & Gaps */}
                            <div className="flex gap-4 pt-2 border-t border-border">
                              {strengths.length > 0 && (
                                <div className="flex-1">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><Lightbulb className="h-2.5 w-2.5" /> Strengths</p>
                                  <div className="flex flex-wrap gap-1">
                                    {strengths.map((s) => (
                                      <Badge key={s} variant="outline" className="text-[8px] px-1 py-0 bg-success/10 text-success border-success/20">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {gaps.length > 0 && (
                                <div className="flex-1">
                                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1"><AlertTriangle className="h-2.5 w-2.5" /> Skill Gaps</p>
                                  <div className="flex flex-wrap gap-1">
                                    {gaps.map((s) => (
                                      <Badge key={s} variant="outline" className="text-[8px] px-1 py-0 bg-destructive/10 text-destructive border-destructive/20">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ProjectStaffing;
