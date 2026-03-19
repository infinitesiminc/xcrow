import { useState, useEffect } from "react";
import {
  Loader2, Play, Globe, BookOpen, ChevronDown, ChevronUp, Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CurriculumScrape {
  id: string;
  source_url: string;
  status: string;
  programs_found: number;
  programs_parsed: number;
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

interface SchoolCourse {
  id: string;
  program_name: string;
  degree_type: string | null;
  department: string | null;
  skills_extracted: string[] | null;
  ai_content_flag: boolean | null;
}

export default function SchoolDataExtraction({ schoolId, schoolName }: { schoolId: string; schoolName: string }) {
  const { toast } = useToast();
  const [scrapes, setScrapes] = useState<CurriculumScrape[]>([]);
  const [courses, setCourses] = useState<SchoolCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false);
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [programSearch, setProgramSearch] = useState("");
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const [scrapeRes, courseRes] = await Promise.all([
        supabase.from("school_curricula").select("*").eq("school_id", schoolId).order("created_at", { ascending: false }),
        supabase.from("school_courses").select("id,program_name,degree_type,department,skills_extracted,ai_content_flag").eq("school_id", schoolId).order("department"),
      ]);
      setScrapes((scrapeRes.data as CurriculumScrape[]) || []);
      setCourses((courseRes.data as SchoolCourse[]) || []);
      setLoading(false);
    }
    load();
  }, [schoolId]);

  // Realtime for scrape progress
  useEffect(() => {
    const channel = supabase
      .channel(`scrape-${schoolId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "school_curricula", filter: `school_id=eq.${schoolId}` }, (payload: any) => {
        const row = payload.new as CurriculumScrape;
        setScrapes(prev => {
          const idx = prev.findIndex(s => s.id === row.id);
          if (idx >= 0) { const copy = [...prev]; copy[idx] = row; return copy; }
          return [row, ...prev];
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [schoolId]);

  async function handleScrape() {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-curriculum", {
        body: { school_id: schoolId, catalog_url: scrapeUrl.trim() },
      });
      if (error) throw error;
      toast({ title: "Scraping started", description: `Found ${data.programs_found} programs.` });
      setScrapeDialogOpen(false);
      setScrapeUrl("");
    } catch (err: any) {
      toast({ title: "Scrape failed", description: err.message, variant: "destructive" });
    } finally {
      setScraping(false);
    }
  }

  const filteredCourses = programSearch
    ? courses.filter(c => c.program_name.toLowerCase().includes(programSearch.toLowerCase()))
    : courses;

  const scrapeStatusColor = (s: string) =>
    s === "completed" ? "text-[hsl(var(--success))]" :
    s === "failed" ? "text-destructive" :
    s === "scraping" ? "text-primary" :
    "text-muted-foreground";

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4 mt-4">
      {/* Scrape Controls */}
      <Card className="border-border/50 bg-card/80">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-medium">Curriculum Scrapes</CardTitle>
          <Button size="sm" onClick={() => setScrapeDialogOpen(true)}>
            <Play className="h-3.5 w-3.5 mr-1" /> New Scrape
          </Button>
        </CardHeader>
        <CardContent>
          {scrapes.length === 0 ? (
            <p className="text-sm text-muted-foreground">No scrapes yet. Start one to extract curriculum data.</p>
          ) : (
            <div className="space-y-2">
              {scrapes.map(s => (
                <div key={s.id} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/30">
                  <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="truncate flex-1 text-xs text-muted-foreground">{s.source_url}</span>
                  <span className={`text-xs font-medium ${scrapeStatusColor(s.status)}`}>{s.status}</span>
                  {s.status === "scraping" && (
                    <div className="w-24">
                      <Progress value={s.programs_found > 0 ? (s.programs_parsed / s.programs_found) * 100 : 0} className="h-1.5" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{s.programs_parsed}/{s.programs_found} programs</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Programs Explorer */}
      {courses.length > 0 && (
        <Card className="border-border/50 bg-card/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                Programs ({courses.length})
              </CardTitle>
              <div className="relative w-48">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search programs..." value={programSearch} onChange={e => setProgramSearch(e.target.value)} className="pl-7 h-8 text-xs" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Program</TableHead>
                  <TableHead>Degree</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Skills</TableHead>
                  <TableHead>AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.slice(0, 50).map(c => (
                  <TableRow key={c.id} className="hover:bg-muted/20 cursor-pointer" onClick={() => setExpandedCourse(expandedCourse === c.id ? null : c.id)}>
                    <TableCell className="font-medium text-xs max-w-[200px] truncate">{c.program_name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{c.degree_type || "—"}</Badge></TableCell>
                    <TableCell className="text-xs text-muted-foreground">{c.department || "—"}</TableCell>
                    <TableCell className="text-xs">{c.skills_extracted?.length || 0}</TableCell>
                    <TableCell>{c.ai_content_flag ? <Badge className="bg-primary/15 text-primary text-xs">AI</Badge> : null}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {filteredCourses.length > 50 && (
              <p className="text-xs text-muted-foreground mt-2">Showing 50 of {filteredCourses.length} programs</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Scrape Dialog */}
      <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Scrape Curriculum — {schoolName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Catalog URL (e.g. https://catalog.usc.edu)" value={scrapeUrl} onChange={e => setScrapeUrl(e.target.value)} />
            <Button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} className="w-full">
              {scraping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Play className="h-4 w-4 mr-2" />}
              Start Scrape
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
