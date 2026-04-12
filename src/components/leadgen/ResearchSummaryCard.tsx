import { useState } from "react";
import { Building2, ChevronDown, ChevronUp, Zap, Users, Swords, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { ParsedReport } from "./ResearchSection";

interface ResearchSummaryCardProps {
  report: ParsedReport;
  elapsed: number;
}

function formatTime(s: number) {
  const mins = Math.floor(s / 60);
  const secs = s % 60;
  return `${String(mins).padStart(2, "0")}:${String(Math.floor(secs)).padStart(2, "0")}s`;
}

export function ResearchSummaryCard({ report, elapsed }: ResearchSummaryCardProps) {
  const [open, setOpen] = useState(false);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button className="w-full rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3 hover:bg-primary/10 transition-colors text-left">
          <div className="size-2 rounded-full bg-primary shrink-0" />
          <Building2 className="w-4 h-4 text-primary shrink-0" />
          <span className="text-sm font-medium text-primary truncate flex-1">Research complete</span>
          <div className="flex items-center gap-2 shrink-0">
            <Badge variant="secondary" className="text-[10px]">{report.personas.length} personas</Badge>
            <Badge variant="secondary" className="text-[10px]">{report.competitors.length} competitors</Badge>
            <span className="text-[10px] text-muted-foreground font-mono">{formatTime(elapsed)}</span>
            {open ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-3 space-y-3">
          {report.companySummary && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Company Overview
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">{report.companySummary}</p>
            </div>
          )}

          {report.competitors.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Swords className="w-4 h-4 text-primary" />
                Competitive Landscape ({report.competitors.length})
              </div>
              <div className="grid gap-2">
                {report.competitors.map((c, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-md bg-muted/30 px-3 py-2">
                    <span className="text-xs font-mono text-primary mt-0.5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {c.name}
                        {c.domain && <span className="text-xs text-muted-foreground ml-1.5 font-mono">({c.domain})</span>}
                      </p>
                      {c.differentiator && (
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{c.differentiator}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.prospectDomains.length > 0 && (
            <div className="rounded-lg border border-border/40 bg-card p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Target className="w-4 h-4 text-primary" />
                Prospecting Targets ({report.prospectDomains.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {report.prospectDomains.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full bg-muted/50 text-xs font-mono text-muted-foreground border border-border/30">
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
