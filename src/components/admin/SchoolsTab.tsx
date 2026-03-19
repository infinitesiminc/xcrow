import { useState, useEffect } from "react";
import {
  GraduationCap, Plus, Loader2, Pencil, Check, X, Trash2, Users, Calendar, Mail,
  Globe, BookOpen, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface School {
  id: string;
  name: string;
  domain: string | null;
  total_seats: number;
  used_seats: number;
  plan_status: string;
  contact_email: string | null;
  expires_at: string | null;
  created_at: string;
}

interface CurriculumScrape {
  id: string;
  school_id: string;
  source_url: string;
  status: string;
  programs_found: number;
  programs_parsed: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export default function SchoolsTab() {
  const { toast } = useToast();
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDomain, setNewDomain] = useState("");
  const [newSeats, setNewSeats] = useState("50");
  const [newEmail, setNewEmail] = useState("");
  const [newAdminId, setNewAdminId] = useState("");
  const [creating, setCreating] = useState(false);

  // Edit inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSeats, setEditSeats] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [saving, setSaving] = useState(false);

  // Curriculum scraping
  const [scrapeUrl, setScrapeUrl] = useState<Record<string, string>>({});
  const [scraping, setScraping] = useState<Record<string, boolean>>({});
  const [curricula, setCurricula] = useState<Record<string, CurriculumScrape[]>>({});
  const [scrapeDialogId, setScrapeDialogId] = useState<string | null>(null);

  async function fetchSchools() {
    setLoading(true);
    const { data } = await supabase
      .from("school_accounts")
      .select("*")
      .order("created_at", { ascending: false });
    setSchools((data as School[]) || []);

    // Fetch curricula for all schools
    if (data && data.length > 0) {
      const ids = data.map((s: any) => s.id);
      const { data: currData } = await (supabase.from("school_curricula" as any) as any)
        .select("*")
        .in("school_id", ids)
        .order("created_at", { ascending: false });
      
      const grouped: Record<string, CurriculumScrape[]> = {};
      (currData || []).forEach((c: any) => {
        if (!grouped[c.school_id]) grouped[c.school_id] = [];
        grouped[c.school_id].push(c);
      });
      setCurricula(grouped);
    }
    setLoading(false);
  }

  useEffect(() => { fetchSchools(); }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setCreating(true);
    const { data, error } = await supabase.from("school_accounts").insert({
      name: newName.trim(),
      domain: newDomain.trim() || null,
      total_seats: parseInt(newSeats) || 50,
      contact_email: newEmail.trim() || null,
    }).select().single();

    if (error) {
      toast({ title: "Error creating school", description: error.message, variant: "destructive" });
    } else {
      if (newAdminId.trim() && data) {
        await supabase.from("school_admins").insert({
          school_id: data.id,
          user_id: newAdminId.trim(),
          role: "admin",
        });
      }
      toast({ title: "School created", description: `${newName} added successfully.` });
      setCreateOpen(false);
      setNewName(""); setNewDomain(""); setNewSeats("50"); setNewEmail(""); setNewAdminId("");
      fetchSchools();
    }
    setCreating(false);
  }

  async function handleSaveEdit(school: School) {
    setSaving(true);
    const { error } = await supabase.from("school_accounts").update({
      total_seats: parseInt(editSeats) || school.total_seats,
      plan_status: editStatus || school.plan_status,
    }).eq("id", school.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Updated" });
      setEditingId(null);
      fetchSchools();
    }
    setSaving(false);
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete ${name}? This will remove all seats and admins.`)) return;
    const { error } = await supabase.from("school_accounts").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Deleted", description: `${name} removed.` });
      fetchSchools();
    }
  }

  async function handleScrape(schoolId: string) {
    const url = scrapeUrl[schoolId];
    if (!url?.trim()) {
      toast({ title: "Enter a catalog URL", variant: "destructive" });
      return;
    }
    setScraping((prev) => ({ ...prev, [schoolId]: true }));
    try {
      const { data, error } = await supabase.functions.invoke("scrape-curriculum", {
        body: { school_id: schoolId, catalog_url: url.trim() },
      });
      if (error) throw error;
      toast({
        title: "Scraping started",
        description: `Found ${data.programs_found} programs. ${data.programs_parsed} parsed so far.`,
      });
      setScrapeDialogId(null);
      fetchSchools();
    } catch (err: any) {
      toast({ title: "Scrape failed", description: err.message, variant: "destructive" });
    } finally {
      setScraping((prev) => ({ ...prev, [schoolId]: false }));
    }
  }

  const statusColor = (s: string) =>
    s === "active" ? "bg-success/10 text-success border-success/20" :
    s === "expired" ? "bg-destructive/10 text-destructive border-destructive/20" :
    "bg-muted text-muted-foreground";

  const scrapeStatusColor = (s: string) =>
    s === "completed" ? "text-success" :
    s === "failed" ? "text-destructive" :
    s === "scraping" ? "text-primary" :
    "text-muted-foreground";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-foreground">School Accounts</h3>
          <p className="text-xs text-muted-foreground">{schools.length} schools</p>
        </div>
        <Button size="sm" className="h-7 text-xs gap-1" onClick={() => setCreateOpen(true)}>
          <Plus className="h-3 w-3" /> New School
        </Button>
      </div>

      {schools.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">No schools yet.</CardContent></Card>
      ) : (
        <div className="space-y-2">
          {schools.map((school) => {
            const isEditing = editingId === school.id;
            const schoolCurricula = curricula[school.id] || [];
            const latestScrape = schoolCurricula[0];

            return (
              <Card key={school.id} className="overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <GraduationCap className="h-4 w-4 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-foreground truncate">{school.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                          {school.domain && <span className="flex items-center gap-1"><Mail className="h-3 w-3" />@{school.domain}</span>}
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{school.used_seats}/{school.total_seats} seats</span>
                          <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(school.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] ${statusColor(school.plan_status)}`}>
                        {school.plan_status}
                      </Badge>

                      {isEditing ? (
                        <div className="flex items-center gap-1">
                          <Input
                            value={editSeats}
                            onChange={(e) => setEditSeats(e.target.value)}
                            className="h-7 w-16 text-xs"
                            placeholder="Seats"
                            type="number"
                          />
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="h-7 text-xs rounded border border-input bg-background px-2"
                          >
                            <option value="active">active</option>
                            <option value="expired">expired</option>
                            <option value="cancelled">cancelled</option>
                          </select>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleSaveEdit(school)} disabled={saving}>
                            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3 text-success" />}
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingId(null)}>
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-[10px] gap-1"
                            onClick={() => setScrapeDialogId(school.id)}
                          >
                            <BookOpen className="h-3 w-3" /> Scrape Curriculum
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7"
                            onClick={() => {
                              setEditingId(school.id);
                              setEditSeats(String(school.total_seats));
                              setEditStatus(school.plan_status);
                            }}
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(school.id, school.name)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Seat usage bar */}
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.min(100, (school.used_seats / Math.max(school.total_seats, 1)) * 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Curriculum scrape status */}
                  {latestScrape && (
                    <div className="mt-3 p-2 rounded-md bg-muted/50 border border-border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs">
                          <Sparkles className={`h-3 w-3 ${scrapeStatusColor(latestScrape.status)}`} />
                          <span className="font-medium">Curriculum</span>
                          <span className="text-muted-foreground">·</span>
                          <span className={scrapeStatusColor(latestScrape.status)}>
                            {latestScrape.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-muted-foreground">
                          {latestScrape.programs_parsed}/{latestScrape.programs_found} programs
                        </span>
                      </div>
                      {latestScrape.status === "scraping" && latestScrape.programs_found > 0 && (
                        <Progress
                          value={(latestScrape.programs_parsed / latestScrape.programs_found) * 100}
                          className="h-1 mt-2"
                        />
                      )}
                      {latestScrape.error_message && (
                        <p className="text-[10px] text-destructive mt-1">{latestScrape.error_message}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Create School Account</DialogTitle>
            <DialogDescription>Set up a new institutional license.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">School Name *</label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Stanford University" className="h-8 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Email Domain (for auto-provisioning)</label>
              <Input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} placeholder="e.g. stanford.edu" className="h-8 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Total Seats</label>
                <Input value={newSeats} onChange={(e) => setNewSeats(e.target.value)} type="number" className="h-8 text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground">Contact Email</label>
                <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="admin@school.edu" className="h-8 text-sm" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Admin User ID (optional)</label>
              <Input value={newAdminId} onChange={(e) => setNewAdminId(e.target.value)} placeholder="UUID of the school admin user" className="h-8 text-sm font-mono" />
            </div>
            <Button onClick={handleCreate} disabled={creating || !newName.trim()} className="w-full h-8 text-xs">
              {creating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
              Create School
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Scrape Curriculum Dialog */}
      <Dialog open={!!scrapeDialogId} onOpenChange={(open) => !open && setScrapeDialogId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              Scrape Curriculum
            </DialogTitle>
            <DialogDescription>
              Enter the school's course catalog URL. We'll scrape program pages and extract skills using AI.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Catalog URL *</label>
              <Input
                value={scrapeUrl[scrapeDialogId || ""] || ""}
                onChange={(e) => setScrapeUrl((prev) => ({ ...prev, [scrapeDialogId || ""]: e.target.value }))}
                placeholder="e.g. https://catalogue.usc.edu/"
                className="h-8 text-sm"
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                <Globe className="h-3 w-3 inline mr-0.5" />
                The scraper will map the site, find program pages, scrape content, and extract skills.
              </p>
            </div>
            <Button
              onClick={() => scrapeDialogId && handleScrape(scrapeDialogId)}
              disabled={scraping[scrapeDialogId || ""] || !scrapeUrl[scrapeDialogId || ""]?.trim()}
              className="w-full h-8 text-xs"
            >
              {scraping[scrapeDialogId || ""] ? (
                <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Scraping…</>
              ) : (
                <><Sparkles className="h-3 w-3 mr-1" /> Start Scraping</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
