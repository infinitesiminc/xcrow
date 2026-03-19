import { useState } from "react";
import { Pencil, Check, X, Trash2, Users, Calendar, Globe, Eye, Sparkles, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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

export default function SchoolOverview({ school, onUpdate }: { school: SchoolData; onUpdate: () => void }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    total_seats: school.total_seats,
    plan_status: school.plan_status,
    pipeline_stage: school.pipeline_stage || "prospect",
    contact_email: school.contact_email || "",
    domain: school.domain || "",
  });

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase.from("school_accounts").update({
      total_seats: form.total_seats,
      plan_status: form.plan_status,
      pipeline_stage: form.pipeline_stage,
      contact_email: form.contact_email || null,
      domain: form.domain || null,
    }).eq("id", school.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated" });
      setEditing(false);
      onUpdate();
    }
    setSaving(false);
  }

  async function handleDelete() {
    if (!confirm(`Delete ${school.name}? This will remove all seats and admins.`)) return;
    const { error } = await supabase.from("school_accounts").delete().eq("id", school.id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted" });
      window.history.back();
    }
  }

  const statusColor = (s: string) =>
    s === "active" ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" :
    s === "expired" ? "bg-destructive/10 text-destructive" :
    "bg-muted text-muted-foreground";

  return (
    <div className="space-y-4 mt-4">
      <div className="grid md:grid-cols-2 gap-4">
        {/* Profile Card */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">School Profile</h3>
              {!editing ? (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(false)}><X className="h-3.5 w-3.5" /></Button>
                  <Button size="sm" onClick={handleSave} disabled={saving}><Check className="h-3.5 w-3.5 mr-1" /> Save</Button>
                </div>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <Row label="IPEDS ID" value={school.ipeds_id || "—"} />
              <Row label="Institution Type" value={school.institution_type || "—"} />
              <Row label="Carnegie Class" value={school.carnegie_class || "—"} />

              {editing ? (
                <>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Pipeline</span>
                    <Select value={form.pipeline_stage} onValueChange={v => setForm(f => ({ ...f, pipeline_stage: v }))}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["prospect", "contacted", "scraped", "demo", "customer"].map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Plan Status</span>
                    <Select value={form.plan_status} onValueChange={v => setForm(f => ({ ...f, plan_status: v }))}>
                      <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["active", "trial", "expired", "prospect"].map(s => (
                          <SelectItem key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Total Seats</span>
                    <Input type="number" value={form.total_seats} onChange={e => setForm(f => ({ ...f, total_seats: parseInt(e.target.value) || 0 }))} className="h-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Contact Email</span>
                    <Input value={form.contact_email} onChange={e => setForm(f => ({ ...f, contact_email: e.target.value }))} className="h-8" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground w-28 shrink-0">Domain</span>
                    <Input value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))} className="h-8" placeholder="e.g. usc.edu" />
                  </div>
                </>
              ) : (
                <>
                  <Row label="Pipeline" value={<Badge variant="outline" className="text-xs">{(school.pipeline_stage || "prospect").charAt(0).toUpperCase() + (school.pipeline_stage || "prospect").slice(1)}</Badge>} />
                  <Row label="Plan Status" value={<Badge className={`text-xs ${statusColor(school.plan_status)}`}>{school.plan_status}</Badge>} />
                  <Row label="Contact" value={school.contact_email || "—"} />
                  <Row label="Domain" value={school.domain || "—"} />
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Card */}
        <Card className="border-border/50 bg-card/80">
          <CardContent className="p-5 space-y-3">
            <h3 className="text-sm font-medium">Seats & Status</h3>
            <div className="grid grid-cols-2 gap-4">
              <Stat icon={Users} label="Total Seats" value={school.total_seats} />
              <Stat icon={Users} label="Used Seats" value={school.used_seats} />
              <Stat icon={Calendar} label="Expires" value={school.expires_at ? new Date(school.expires_at).toLocaleDateString() : "Never"} />
              <Stat icon={Globe} label="Enrollment" value={school.enrollment?.toLocaleString() || "—"} />
            </div>

            <div className="pt-4 border-t border-border/50">
              <Button variant="destructive" size="sm" onClick={handleDelete}>
                <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete School
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Experience Preview — shown for non-customer schools */}
      {school.total_seats === 0 && (
        <Card className="border-[hsl(var(--neon-purple))]/20 bg-gradient-to-br from-[hsl(var(--neon-purple))]/5 via-card to-card overflow-hidden">
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-[hsl(var(--neon-purple))]/10 p-2">
                <Eye className="h-4 w-4 text-[hsl(var(--neon-purple))]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  Student Experience Preview
                  <Badge className="bg-[hsl(var(--neon-cyan))]/15 text-[hsl(var(--neon-cyan))] text-[10px]">
                    <Sparkles className="h-2.5 w-2.5 mr-0.5" /> Demo
                  </Badge>
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Preview the personalized skill gap analysis students at {school.name} would receive
                </p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 text-center">
              <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Program-specific</p>
                <p className="text-sm font-semibold">Gap Analysis</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                <Sparkles className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">AI-powered</p>
                <p className="text-sm font-semibold">Simulations</p>
              </div>
              <div className="rounded-lg border border-border/40 bg-background/50 p-3">
                <Users className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                <p className="text-xs text-muted-foreground">Career readiness</p>
                <p className="text-sm font-semibold">Skill Map</p>
              </div>
            </div>

            <StudentGapPreview schoolId={school.id} schoolName={school.name} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-bold font-[Space_Grotesk]">{value}</p>
      </div>
    </div>
  );
}
