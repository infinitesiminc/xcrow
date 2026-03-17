import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Building2, MapPin, Zap, ChevronDown, ChevronRight, Play } from "lucide-react";
import SimulatorModal from "@/components/SimulatorModal";

interface DbJob {
  id: string;
  title: string;
  department: string | null;
  location: string | null;
  augmented_percent: number | null;
  automation_risk_percent: number | null;
}

interface TaskCluster {
  id: string;
  cluster_name: string;
  description: string | null;
  ai_exposure_score: number | null;
  priority: string | null;
  ai_state: string | null;
  ai_trend: string | null;
  impact_level: string | null;
  job_id: string;
}

interface CompanyInfo {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
  industry: string | null;
  logo_url: string | null;
  headquarters: string | null;
  employee_range: string | null;
}

export default function CompanyPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, openAuthModal } = useAuth();
  const [company, setCompany] = useState<CompanyInfo | null>(null);
  const [jobs, setJobs] = useState<DbJob[]>([]);
  const [tasks, setTasks] = useState<TaskCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [simTask, setSimTask] = useState<{ taskName: string; jobTitle: string; company: string; taskMeta?: any } | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      // Find company by slug
      const { data: companyData } = await supabase
        .from("companies")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!companyData) {
        // Try by name
        const { data: byName } = await supabase
          .from("companies")
          .select("*")
          .ilike("name", slug?.replace(/-/g, " ") || "")
          .maybeSingle();
        if (byName) setCompany(byName as CompanyInfo);
        else { setLoading(false); return; }
        setCompany(byName as CompanyInfo);

        const { data: jobData } = await supabase
          .from("jobs")
          .select("id, title, department, location, augmented_percent, automation_risk_percent")
          .eq("company_id", byName.id)
          .order("title");
        setJobs((jobData || []) as DbJob[]);

        const jobIds = (jobData || []).map((j: any) => j.id);
        if (jobIds.length > 0) {
          const { data: taskData } = await supabase
            .from("job_task_clusters")
            .select("*")
            .in("job_id", jobIds);
          setTasks((taskData || []) as TaskCluster[]);
        }
      } else {
        setCompany(companyData as CompanyInfo);

        const { data: jobData } = await supabase
          .from("jobs")
          .select("id, title, department, location, augmented_percent, automation_risk_percent")
          .eq("company_id", companyData.id)
          .order("title");
        setJobs((jobData || []) as DbJob[]);

        const jobIds = (jobData || []).map((j: any) => j.id);
        if (jobIds.length > 0) {
          const { data: taskData } = await supabase
            .from("job_task_clusters")
            .select("*")
            .in("job_id", jobIds);
          setTasks((taskData || []) as TaskCluster[]);
        }
      }
      setLoading(false);
    }
    if (slug) load();
  }, [slug]);

  const departments = useMemo(() => {
    const deptMap = new Map<string, DbJob[]>();
    jobs.forEach(j => {
      const dept = j.department || "General";
      if (!deptMap.has(dept)) deptMap.set(dept, []);
      deptMap.get(dept)!.push(j);
    });
    return Array.from(deptMap.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [jobs]);

  const getJobTasks = (jobId: string) => tasks.filter(t => t.job_id === jobId);
  const analyzedJobIds = new Set(tasks.map(t => t.job_id));

  const handleStartSim = (task: TaskCluster, jobTitle: string) => {
    if (!user) {
      openAuthModal();
      return;
    }
    setSimTask({
      taskName: task.cluster_name,
      jobTitle,
      company: company?.name || "",
      taskMeta: {
        currentState: task.ai_state,
        trend: task.ai_trend,
        impactLevel: task.impact_level,
      },
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-display font-bold mb-4">Company not found</h1>
        <p className="text-muted-foreground mb-6">We don't have data for this company yet.</p>
        <Button onClick={() => navigate("/")}>Browse roles</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Company header */}
      <div className="flex items-start gap-4 mb-8">
        {company.logo_url ? (
          <img src={company.logo_url} alt={company.name} className="h-14 w-14 rounded-xl object-contain bg-card border border-border p-2" />
        ) : (
          <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="h-7 w-7 text-primary" />
          </div>
        )}
        <div>
          <h1 className="text-3xl font-display font-bold">{company.name}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {company.industry && <Badge variant="outline">{company.industry}</Badge>}
            {company.headquarters && (
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{company.headquarters}</span>
            )}
            {company.employee_range && <span>{company.employee_range} employees</span>}
          </div>
          {company.description && (
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">{company.description}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card className="neon-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
            <p className="text-xs text-muted-foreground">Roles</p>
          </CardContent>
        </Card>
        <Card className="neon-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{analyzedJobIds.size}</p>
            <p className="text-xs text-muted-foreground">Analyzed</p>
          </CardContent>
        </Card>
        <Card className="neon-border">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            <p className="text-xs text-muted-foreground">Practice tasks</p>
          </CardContent>
        </Card>
      </div>

      {/* Roles by department */}
      <h2 className="text-xl font-heading font-semibold mb-4">Roles & Practice Tasks</h2>

      {departments.map(([dept, deptJobs]) => (
        <div key={dept} className="mb-6">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">
            {dept} · {deptJobs.length} roles
          </h3>
          <div className="space-y-2">
            {deptJobs.map(job => {
              const jobTasks = getJobTasks(job.id);
              const isExpanded = expandedJob === job.id;
              const hasAnalysis = jobTasks.length > 0;

              return (
                <Card key={job.id} className="overflow-hidden">
                  <button
                    onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                    className="w-full flex items-center justify-between p-4 hover:bg-accent/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-medium text-foreground">{job.title}</span>
                      {job.location && (
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{job.location}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasAnalysis ? (
                        <Badge className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">
                          {jobTasks.length} tasks
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">Pending</Badge>
                      )}
                      {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    </div>
                  </button>

                  {isExpanded && hasAnalysis && (
                    <div className="border-t border-border px-4 py-3 space-y-2 bg-card/50">
                      {jobTasks.map(task => (
                        <div key={task.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-accent/20 transition-colors">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{task.cluster_name}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 ml-3">
                            {task.ai_exposure_score != null && (
                              <Badge variant="outline" className="text-xs tabular-nums">
                                {task.ai_exposure_score}% AI
                              </Badge>
                            )}
                            <Button
                              size="sm"
                              onClick={() => handleStartSim(task, job.title)}
                              className="h-7 text-xs gap-1 bg-primary hover:bg-primary/90"
                            >
                              <Play className="h-3 w-3" />
                              Practice
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {isExpanded && !hasAnalysis && (
                    <div className="border-t border-border px-4 py-6 text-center text-sm text-muted-foreground bg-card/50">
                      This role hasn't been analyzed yet. Check back soon!
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {jobs.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg mb-2">No roles imported yet</p>
          <p className="text-sm">Check back soon — we're adding companies regularly!</p>
        </div>
      )}

      {/* Simulator modal */}
      {simTask && (
        <SimulatorModal
          open
          onClose={() => setSimTask(null)}
          taskName={simTask.taskName}
          jobTitle={simTask.jobTitle}
          company={simTask.company}
          taskState={simTask.taskMeta?.currentState}
          taskTrend={simTask.taskMeta?.trend}
          taskImpactLevel={simTask.taskMeta?.impactLevel}
        />
      )}
    </div>
  );
}
