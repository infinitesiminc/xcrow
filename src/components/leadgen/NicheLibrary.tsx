import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Building2, Users, ChevronRight, Loader2, ArrowLeft, Layers, UserCircle, BookOpen } from "lucide-react";

interface SubVertical {
  name: string;
  company_count: number;
}

interface TopTitle {
  title: string;
  count: number;
}

interface VerticalData {
  name: string;
  company_count: number;
  sub_verticals: SubVertical[];
  top_titles: TopTitle[];
}

interface NicheLibraryProps {
  onSeedNiches: (niches: Array<{ label: string; description: string; parent_label: string | null; niche_type: string }>) => void;
  onBack: () => void;
}

export function NicheLibrary({ onSeedNiches, onBack }: NicheLibraryProps) {
  const [verticals, setVerticals] = useState<VerticalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVertical, setSelectedVertical] = useState<VerticalData | null>(null);
  const [selectedSubs, setSelectedSubs] = useState<Set<string>>(new Set());
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());

  useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/niche-library`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
          }
        );
        const data = await resp.json();
        setVerticals(data.verticals || []);
      } catch (e) {
        console.error("Failed to load niche library:", e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleSelectVertical = (v: VerticalData) => {
    setSelectedVertical(v);
    setSelectedSubs(new Set(v.sub_verticals.map((s) => s.name)));
    setSelectedTitles(new Set(v.top_titles.map((t) => t.title)));
  };

  const toggleSub = (name: string) => {
    setSelectedSubs((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const toggleTitle = (title: string) => {
    setSelectedTitles((prev) => {
      const next = new Set(prev);
      next.has(title) ? next.delete(title) : next.add(title);
      return next;
    });
  };

  const handleSeed = () => {
    if (!selectedVertical) return;
    const niches: Array<{ label: string; description: string; parent_label: string | null; niche_type: string }> = [];

    // Add vertical
    niches.push({
      label: selectedVertical.name,
      description: `${selectedVertical.company_count} companies in database`,
      parent_label: null,
      niche_type: "vertical",
    });

    // Add selected sub-verticals as segments
    for (const sub of selectedVertical.sub_verticals) {
      if (selectedSubs.has(sub.name)) {
        niches.push({
          label: sub.name,
          description: `${sub.company_count} companies`,
          parent_label: selectedVertical.name,
          niche_type: "segment",
        });
      }
    }

    // Add selected titles as personas under the vertical
    for (const title of selectedVertical.top_titles) {
      if (selectedTitles.has(title.title)) {
        niches.push({
          label: title.title,
          description: `Found in ${title.count} roles across this vertical`,
          parent_label: selectedVertical.name,
          niche_type: "persona",
        });
      }
    }

    onSeedNiches(niches);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
          <p className="text-sm text-muted-foreground">Loading industry taxonomy...</p>
        </div>
      </div>
    );
  }

  // Detail view for a selected vertical
  if (selectedVertical) {
    return (
      <div className="flex-1 flex flex-col p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={() => setSelectedVertical(null)}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <div className="flex-1">
            <h2 className="text-lg font-bold text-foreground">{selectedVertical.name}</h2>
            <p className="text-xs text-muted-foreground">{selectedVertical.company_count} companies · Select segments & personas to seed your ICP</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={handleSeed} disabled={selectedSubs.size === 0 && selectedTitles.size === 0}>
            Seed ICP Map
            <ChevronRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-6">
            {/* Segments */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Company Segments</h3>
                <Badge variant="outline" className="text-xs">{selectedSubs.size}/{selectedVertical.sub_verticals.length}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedVertical.sub_verticals.map((sub) => {
                  const selected = selectedSubs.has(sub.name);
                  return (
                    <button
                      key={sub.name}
                      onClick={() => toggleSub(sub.name)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                        selected
                          ? "border-primary/50 bg-primary/5 text-foreground"
                          : "border-border/40 bg-card/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-medium text-xs">{sub.name}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{sub.company_count}</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personas */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UserCircle className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">Buyer Personas</h3>
                <Badge variant="outline" className="text-xs">{selectedTitles.size}/{selectedVertical.top_titles.length}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {selectedVertical.top_titles.map((t) => {
                  const selected = selectedTitles.has(t.title);
                  return (
                    <button
                      key={t.title}
                      onClick={() => toggleTitle(t.title)}
                      className={`text-left px-3 py-2.5 rounded-lg border transition-all text-sm ${
                        selected
                          ? "border-primary/50 bg-primary/5 text-foreground"
                          : "border-border/40 bg-card/50 text-muted-foreground hover:border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="truncate font-medium text-xs">{t.title}</span>
                        <Badge variant="secondary" className="text-[10px] shrink-0 ml-2">{t.count} roles</Badge>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </ScrollArea>
      </div>
    );
  }

  // Vertical grid
  return (
    <div className="flex-1 flex flex-col p-6">
      <div className="max-w-3xl mx-auto w-full">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" onClick={onBack}>
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Button>
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Niche Library
            </h2>
            <p className="text-xs text-muted-foreground">
              Browse {verticals.length} industry verticals built from {verticals.reduce((s, v) => s + v.company_count, 0).toLocaleString()} companies
            </p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {verticals.map((v) => (
              <motion.button
                key={v.name}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSelectVertical(v)}
                className="text-left p-4 rounded-xl border border-border/40 bg-card/60 hover:border-primary/30 hover:bg-card transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <Building2 className="w-4 h-4 text-primary/70 mt-0.5" />
                  <Badge variant="secondary" className="text-[10px]">
                    {v.company_count} cos
                  </Badge>
                </div>
                <h3 className="text-sm font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">{v.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {v.sub_verticals.length} segments · {v.top_titles.length} personas
                </p>
              </motion.button>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
