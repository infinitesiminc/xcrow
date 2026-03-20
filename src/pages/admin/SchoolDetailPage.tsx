import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, ExternalLink, GraduationCap, Users, BookOpen, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import SchoolOverview from "@/components/admin/school/SchoolOverview";
import SchoolDataExtraction from "@/components/admin/school/SchoolDataExtraction";
import SchoolSkillsGap from "@/components/admin/school/SchoolSkillsGap";
import SchoolStudentsAdmin from "@/components/admin/school/SchoolStudentsAdmin";
import StudentGapPreview from "@/components/admin/school/StudentGapPreview";

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

const PIPELINE_COLORS: Record<string, { border: string; text: string; glow: string }> = {
  prospect: { border: "hsl(220 10% 40%)", text: "hsl(220 10% 60%)", glow: "transparent" },
  contacted: { border: "hsl(200 90% 55%)", text: "hsl(200 90% 65%)", glow: "hsl(200 90% 55%)" },
  scraped: { border: "hsl(180 90% 50%)", text: "hsl(180 90% 60%)", glow: "hsl(180 90% 50%)" },
  demo: { border: "hsl(270 80% 60%)", text: "hsl(270 80% 70%)", glow: "hsl(270 80% 60%)" },
  customer: { border: "hsl(142 70% 45%)", text: "hsl(142 70% 55%)", glow: "hsl(142 70% 45%)" },
};

function StatChip({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 border border-white/[0.06]"
      style={{ background: "hsla(240, 12%, 10%, 0.7)" }}
    >
      <Icon className="h-3.5 w-3.5" style={{ color }} />
      <div className="flex flex-col">
        <span className="text-[9px] uppercase tracking-widest" style={{ color: "hsla(220, 10%, 50%, 0.7)" }}>{label}</span>
        <span className="text-sm font-bold font-[Space_Grotesk]" style={{ color }}>{value}</span>
      </div>
    </div>
  );
}

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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "hsl(270 80% 65%)" }} />
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
  const pipelineStyle = PIPELINE_COLORS[stage] || PIPELINE_COLORS.prospect;

  return (
    <div className="p-6 space-y-6">
      {/* Hero card — gaming style */}
      <div
        className="relative rounded-2xl border border-white/[0.08] p-5 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, hsl(240 10% 6%) 0%, hsl(260 12% 10%) 50%, hsl(240 10% 6%) 100%)",
        }}
      >
        {/* Neon top border */}
        <div
          className="absolute top-0 left-0 right-0 h-[3px]"
          style={{
            background: "linear-gradient(90deg, hsl(180 90% 60%), hsl(270 80% 65%), hsl(330 90% 60%))",
          }}
        />

        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full opacity-15 blur-3xl"
          style={{ background: pipelineStyle.glow }}
        />

        <div className="relative z-10 flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/admin/schools")}
            className="text-white/40 hover:text-white hover:bg-white/[0.06] shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <GraduationCap className="h-5 w-5" style={{ color: "hsl(270 80% 65%)" }} />
              <h1
                className="text-xl font-bold font-[Space_Grotesk] tracking-tight truncate"
                style={{ color: "hsl(220 10% 90%)" }}
              >
                {school.name}
              </h1>
              {school.is_hbcu && (
                <span
                  className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                  style={{
                    color: "hsl(330 90% 65%)",
                    borderColor: "hsl(330 90% 65% / 0.3)",
                    background: "hsl(330 90% 60% / 0.1)",
                    boxShadow: "0 0 8px hsl(330 90% 60% / 0.15)",
                  }}
                >
                  HBCU
                </span>
              )}
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border"
                style={{
                  color: pipelineStyle.text,
                  borderColor: `${pipelineStyle.border}33`,
                  background: `${pipelineStyle.border}15`,
                  boxShadow: pipelineStyle.glow !== "transparent" ? `0 0 8px ${pipelineStyle.glow}22` : "none",
                }}
              >
                {stage}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1.5 text-sm" style={{ color: "hsla(220, 10%, 55%, 0.8)" }}>
              {school.city && school.state && <span>{school.city}, {school.state}</span>}
              {!school.city && school.state && <span>{school.state}</span>}
              {school.carnegie_class && <span>• {school.carnegie_class}</span>}
              {school.website && (
                <a
                  href={school.website.startsWith("http") ? school.website : `https://${school.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 transition-colors"
                  style={{ color: "hsl(180 90% 55%)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(180 90% 70%)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(180 90% 55%)")}
                >
                  <ExternalLink className="h-3 w-3" /> Website
                </a>
              )}
            </div>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-2 mt-4">
              {school.enrollment && (
                <StatChip icon={Users} label="Enrollment" value={school.enrollment.toLocaleString()} color="hsl(180 90% 55%)" />
              )}
              <StatChip icon={BookOpen} label="Seats" value={`${school.used_seats} / ${school.total_seats}`} color="hsl(270 80% 65%)" />
              <StatChip icon={Zap} label="Plan" value={school.plan_status} color="hsl(330 90% 60%)" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs — styled for dark gaming */}
      <Tabs defaultValue="overview">
        <TabsList className="bg-white/[0.04] border border-white/[0.06]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="extraction">Data Extraction</TabsTrigger>
          <TabsTrigger value="skills">Skills Gap</TabsTrigger>
          {school.total_seats > 0 && <TabsTrigger value="students">Students</TabsTrigger>}
          <TabsTrigger value="student-preview">Student Preview</TabsTrigger>
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
        <TabsContent value="student-preview">
          <StudentGapPreview schoolId={school.id} schoolName={school.name} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
