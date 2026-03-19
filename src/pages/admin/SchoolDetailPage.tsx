import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ExternalLink, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import SchoolOverview from "@/components/admin/school/SchoolOverview";
import SchoolDataExtraction from "@/components/admin/school/SchoolDataExtraction";
import SchoolSkillsGap from "@/components/admin/school/SchoolSkillsGap";
import SchoolStudentsAdmin from "@/components/admin/school/SchoolStudentsAdmin";

interface SchoolData {
  id: string;
  name: string;
  state: string | null;
  city: string | null;
  carnegie_class: string | null;
  institution_type: string | null;
  enrollment: number | null;
  pipeline_stage: string | null;
  is_hbcu: boolean | null;
  plan_status: string;
  total_seats: number;
  used_seats: number;
  domain: string | null;
  contact_email: string | null;
  website: string | null;
  ipeds_id: string | null;
  expires_at: string | null;
  catalog_url: string | null;
}

const PIPELINE_BADGE: Record<string, string> = {
  prospect: "bg-muted text-muted-foreground",
  contacted: "bg-[hsl(var(--neon-blue))]/15 text-[hsl(var(--neon-blue))]",
  scraped: "bg-[hsl(var(--neon-cyan))]/15 text-[hsl(var(--neon-cyan))]",
  demo: "bg-[hsl(var(--neon-purple))]/15 text-[hsl(var(--neon-purple))]",
  customer: "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]",
};

export default function SchoolDetailPage() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const [school, setSchool] = useState<SchoolData | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchSchool() {
    if (!schoolId) return;
    const { data } = await supabase
      .from("school_accounts")
      .select("*")
      .eq("id", schoolId)
      .single();
    setSchool(data as SchoolData | null);
    setLoading(false);
  }

  useEffect(() => { fetchSchool(); }, [schoolId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!school) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">School not found.</p>
        <Button variant="ghost" onClick={() => navigate("/admin/schools")} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Schools
        </Button>
      </div>
    );
  }

  const stage = school.pipeline_stage || "prospect";

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/admin/schools")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <GraduationCap className="h-5 w-5 text-[hsl(var(--neon-purple))]" />
            <h1 className="text-xl font-bold font-[Space_Grotesk] tracking-tight truncate">{school.name}</h1>
            {school.is_hbcu && <Badge className="bg-[hsl(var(--neon-pink))]/15 text-[hsl(var(--neon-pink))] text-xs">HBCU</Badge>}
            <Badge variant="outline" className={`text-xs ${PIPELINE_BADGE[stage]}`}>
              {stage.charAt(0).toUpperCase() + stage.slice(1)}
            </Badge>
          </div>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            {school.city && school.state && <span>{school.city}, {school.state}</span>}
            {!school.city && school.state && <span>{school.state}</span>}
            {school.carnegie_class && <span>• {school.carnegie_class}</span>}
            {school.enrollment && <span>• {school.enrollment.toLocaleString()} students</span>}
            {school.website && (
              <a href={school.website.startsWith("http") ? school.website : `https://${school.website}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
                <ExternalLink className="h-3 w-3" /> Website
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
          {school.total_seats > 0 && <TabsTrigger value="students">Students</TabsTrigger>}
        </TabsList>
        <TabsContent value="overview">
          <SchoolOverview school={school} onUpdate={fetchSchool} />
        </TabsContent>
        <TabsContent value="extraction">
          <SchoolDataExtraction schoolId={school.id} schoolName={school.name} />
        </TabsContent>
        <TabsContent value="skills">
          <SchoolSkillsGap schoolId={school.id} schoolName={school.name} />
        </TabsContent>
        {school.total_seats > 0 && (
          <TabsContent value="students">
            <SchoolStudentsAdmin schoolId={school.id} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
