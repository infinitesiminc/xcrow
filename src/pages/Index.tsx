import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RoleSearchAutocomplete } from "@/components/RoleSearchAutocomplete";
import RoleFeed from "@/components/RoleFeed";
import { supabase } from "@/integrations/supabase/client";
import { getDepartmentImage } from "@/lib/department-images";

interface RoleCard {
  title: string;
  image: string;
  augmented: number;
  risk: number;
  aiOpportunity: number;
  tag: string;
  company?: string;
  location?: string;
  logo?: string;
  country?: string;
  workMode?: string;
  description?: string;
  seniority?: string;
  taskCount?: number;
  aiTaskCount?: number;
  jobId?: string;
}

function calcToolsToLearn(risk: number, augmented: number, newSkills: number): number {
  return Math.round(augmented * 0.45 + newSkills * 0.35 + risk * 0.20);
}

function departmentToTag(dept: string | null): string {
  if (!dept) return "Other";
  const d = dept.toLowerCase();
  if (["engineering", "product", "design", "data", "ai", "research", "security", "cybersecurity", "it"].some(k => d.includes(k))) return "Tech";
  if (["finance", "accounting", "tax", "audit"].some(k => d.includes(k))) return "Finance";
  if (["marketing", "brand", "content", "seo", "social", "communications", "pr"].some(k => d.includes(k))) return "Marketing";
  if (["legal", "compliance", "regulatory"].some(k => d.includes(k))) return "Legal";
  if (["operations", "supply", "logistics", "hr", "people", "human"].some(k => d.includes(k))) return "Operations";
  if (["sales", "business development", "customer"].some(k => d.includes(k))) return "Sales";
  return "Other";
}

const Index = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [roles, setRoles] = useState<RoleCard[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);
  const [savedRoleTitles, setSavedRoleTitles] = useState<Set<string>>(new Set());

  const [jobTitle, setJobTitle] = useState("");
  const [website, setWebsite] = useState("");

  // Fetch jobs from DB
  useEffect(() => {
    (async () => {
      const INITIAL_LIMIT = 200;
      const { data, error } = await supabase
        .from("jobs")
        .select("id, title, department, location, city, country, work_mode, description, seniority, augmented_percent, automation_risk_percent, new_skills_percent, companies(name, logo_url, website)")
        .order("augmented_percent", { ascending: false })
        .limit(INITIAL_LIMIT);

      if (error || !data) { setLoadingRoles(false); return; }

      const jobIds = data.map((j: any) => j.id);
      let taskCountMap: Record<string, { total: number; aiLed: number }> = {};
      if (jobIds.length > 0) {
        const { data: clusters } = await supabase
          .from("job_task_clusters")
          .select("job_id, ai_exposure_score")
          .in("job_id", jobIds);
        if (clusters) {
          for (const c of clusters) {
            if (!taskCountMap[c.job_id]) taskCountMap[c.job_id] = { total: 0, aiLed: 0 };
            taskCountMap[c.job_id].total++;
            if ((c.ai_exposure_score ?? 0) >= 60) taskCountMap[c.job_id].aiLed++;
          }
        }
      }

      if (data.length === 0) { setLoadingRoles(false); return; }

      const seen = new Set<string>();
      const unique = data.filter(j => {
        const key = (j.title + '|' + (j.companies as any)?.name + '|' + (j.city || j.location || '')).toLowerCase().trim();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      const mapped: RoleCard[] = unique.map(j => {
        const companyData = j.companies as unknown as { name: string; logo_url?: string; website?: string } | null;
        const companyName = companyData?.name || undefined;
        const logoUrl = companyData?.logo_url || (companyData?.website ? `https://logo.clearbit.com/${companyData.website.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : undefined);
        const tc = taskCountMap[j.id];
        return {
          title: j.title,
          image: getDepartmentImage(j.department),
          augmented: j.augmented_percent ?? 0,
          risk: j.automation_risk_percent ?? 0,
          aiOpportunity: calcToolsToLearn(j.automation_risk_percent ?? 0, j.augmented_percent ?? 0, j.new_skills_percent ?? 0),
          tag: departmentToTag(j.department),
          company: companyName,
          location: j.location || undefined,
          logo: logoUrl,
          country: j.country || undefined,
          workMode: j.work_mode || undefined,
          description: j.description || undefined,
          seniority: j.seniority || undefined,
          taskCount: tc?.total || 0,
          aiTaskCount: tc?.aiLed || 0,
          jobId: j.id,
        };
      });

      const analyzed = mapped.filter(r => r.augmented > 0).sort(() => Math.random() - 0.5);
      const unanalyzed = mapped.filter(r => r.augmented === 0).sort(() => Math.random() - 0.5);
      setRoles([...analyzed, ...unanalyzed]);
      setLoadingRoles(false);
    })();
  }, []);

  // Fetch saved/bookmarked role titles
  useEffect(() => {
    if (!user) { setSavedRoleTitles(new Set()); return; }
    supabase.from("bookmarked_roles")
      .select("job_title")
      .eq("user_id", user.id)
      .then(({ data }) => {
        if (data) setSavedRoleTitles(new Set(data.map(d => d.job_title.toLowerCase())));
      });
  }, [user]);

  useEffect(() => {
    if (profile?.jobTitle && !jobTitle) setJobTitle(profile.jobTitle);
    if (profile?.company && !website) setWebsite(profile.company);
  }, [profile]);

  const effectiveCompany = website.trim();

  if (loadingRoles && roles.length === 0) {
    return (
      <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex flex-col">
      {/* ── Hero Section ──────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center px-5 pt-16 pb-10 sm:pt-24 sm:pb-14">
        {/* Subtle gradient background */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 w-full max-w-xl text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-display font-bold text-foreground leading-tight">
            What career are you exploring?
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md mx-auto">
            Search any role. See which tasks AI will change — and practice the skills that matter.
          </p>

          {/* Inline search */}
          <div className="mt-6">
            <RoleSearchAutocomplete
              value={jobTitle}
              onChange={setJobTitle}
              onAnalyze={(title) => {
                setJobTitle(title);
                const params = new URLSearchParams({ company: effectiveCompany, title: title.trim() });
                navigate(`/analysis?${params.toString()}`);
              }}
              jdInputType="none"
              onToggleJd={() => {}}
              hasJdContent={false}
            />
          </div>
        </div>
      </section>

      {/* ── Role Feed (Discover) ──────────────────────── */}
      <section className="flex-1">
        <RoleFeed roles={roles} savedRoleTitles={savedRoleTitles} />
      </section>
    </div>
  );
};

export default Index;
