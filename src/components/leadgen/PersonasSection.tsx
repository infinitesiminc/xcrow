import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, MessageCircle, Loader2, CheckCircle2 } from "lucide-react";
import type { ParsedPersona, ParsedReport } from "./ResearchSection";

interface PersonasSectionProps {
  report: ParsedReport | null;
  leadCountByPersona: Record<string, number>;
  onFindLeads: (persona: ParsedPersona) => void;
  loadingPersona: string | null;
}

export default function PersonasSection({ report, leadCountByPersona, onFindLeads, loadingPersona }: PersonasSectionProps) {
  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-16">
        <Users className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-mono">Run research first to discover ICP personas</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {report.companySummary && (
        <div className="rounded-lg border border-border/40 bg-card/50 p-4">
          <h3 className="text-sm font-semibold text-foreground mb-2">Company Overview</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{report.companySummary}</p>
        </div>
      )}

      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold">ICP Buyer Personas</h3>
          <Badge variant="secondary" className="text-[10px]">{report.personas.length}</Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {report.personas.map((persona) => {
            const count = leadCountByPersona[persona.title] || 0;
            const isLoading = loadingPersona === persona.title;
            return (
              <Card key={persona.title} className="border-border/40">
                <CardHeader className="pb-2 pt-4 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">{persona.title}</CardTitle>
                    {count > 0 && (
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {count} found
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {persona.painPoints.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Pain Points</p>
                      <ul className="space-y-0.5">
                        {persona.painPoints.map((p, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-primary shrink-0">•</span>
                            <span className="line-clamp-2">{p}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {persona.buyingTriggers.length > 0 && (
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Buying Triggers</p>
                      <ul className="space-y-0.5">
                        {persona.buyingTriggers.map((t, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex gap-1.5">
                            <span className="text-primary shrink-0">→</span>
                            <span className="line-clamp-2">{t}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <Button
                    size="sm"
                    variant={count > 0 ? "outline" : "default"}
                    className="w-full gap-2 h-8 text-xs"
                    onClick={() => onFindLeads(persona)}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Searching...</>
                    ) : count > 0 ? (
                      <><MessageCircle className="w-3 h-3" /> Find More</>
                    ) : (
                      <><MessageCircle className="w-3 h-3" /> Find Leads</>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {report.prospectDomains.length > 0 && (
          <div className="mt-4 rounded-lg border border-border/40 bg-muted/20 p-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Target Domains ({report.prospectDomains.length})</p>
            <div className="flex flex-wrap gap-1.5">
              {report.prospectDomains.slice(0, 12).map(d => (
                <Badge key={d} variant="outline" className="text-[10px] font-mono">{d}</Badge>
              ))}
              {report.prospectDomains.length > 12 && (
                <Badge variant="outline" className="text-[10px]">+{report.prospectDomains.length - 12} more</Badge>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
