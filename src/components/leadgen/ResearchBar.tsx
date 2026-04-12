import { useState } from "react";
import { FlaskConical, Users, Swords, Target, ChevronDown, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ResearchSummaryCard } from "./ResearchSummaryCard";
import PersonasSection from "./PersonasSection";
import type { ParsedReport, ParsedPersona } from "./ResearchSection";

interface ResearchBarProps {
  report: ParsedReport;
  elapsed: number;
  workspaceKey: string;
  leadCountByPersona: Record<string, number>;
  onFindLeads: (persona: ParsedPersona) => void;
  loadingPersona: string | null;
}

function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(Math.floor(secs)).padStart(2, "0")}s`;
}

export function ResearchBar({ report, elapsed, workspaceKey, leadCountByPersona, onFindLeads, loadingPersona }: ResearchBarProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="rounded-lg border border-border bg-card px-4 py-2 flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{workspaceKey}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Users className="w-3 h-3" />{report.personas.length} personas
          </Badge>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Swords className="w-3 h-3" />{report.competitors.length} competitors
          </Badge>
          <Badge variant="secondary" className="text-[10px] gap-1">
            <Target className="w-3 h-3" />{report.prospectDomains.length} targets
          </Badge>
        </div>

        {/* Persona chips */}
        <div className="flex items-center gap-1.5 ml-auto">
          {report.personas.map((p) => (
            <button
              key={p.title}
              onClick={() => onFindLeads(p)}
              className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Search className="w-3 h-3" />
              {p.title}
              {(leadCountByPersona[p.title] ?? 0) > 0 && (
                <span className="text-[10px] text-muted-foreground">({leadCountByPersona[p.title]})</span>
              )}
            </button>
          ))}
        </div>

        <span className="text-[10px] text-muted-foreground font-mono">{formatTime(elapsed)}</span>

        <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => setOpen(true)}>
          Details <ChevronDown className="w-3 h-3" />
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Research Details — {workspaceKey}</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-6">
            <ResearchSummaryCard report={report} elapsed={elapsed} />
            <PersonasSection
              report={report}
              leadCountByPersona={leadCountByPersona}
              onFindLeads={onFindLeads}
              loadingPersona={loadingPersona}
            />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
