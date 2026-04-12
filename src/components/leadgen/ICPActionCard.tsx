import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, BarChart3, Mail, Download, Loader2, Target } from "lucide-react";

export interface ICPCriteria {
  industry?: string;
  company_size?: string;
  job_titles?: string[];
  region?: string;
  buyer_persona?: string;
  keywords?: string[];
}

interface ICPActionCardProps {
  nicheLabel: string;
  nicheDescription: string | null;
  leadCount: number;
  icpCriteria?: ICPCriteria;
  onFindLeads: () => void;
  onScore: () => void;
  onDraftAll: () => void;
  onExport: () => void;
  isFinding?: boolean;
}

export function ICPActionCard({
  nicheLabel,
  nicheDescription,
  leadCount,
  icpCriteria,
  onFindLeads,
  onScore,
  onDraftAll,
  onExport,
  isFinding,
}: ICPActionCardProps) {
  const hasCriteria = icpCriteria && Object.values(icpCriteria).some((v) => v && (Array.isArray(v) ? v.length > 0 : true));

  return (
    <Card className="bg-card/60 border-primary/20 shadow-sm">
      <CardContent className="p-3 space-y-2.5">
        {/* ICP Header */}
        <div className="flex items-start gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
            <Target className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{nicheLabel}</p>
            {nicheDescription && (
              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{nicheDescription}</p>
            )}
          </div>
          <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
            {leadCount} leads
          </Badge>
        </div>

        {/* ICP Criteria Tags */}
        {hasCriteria && (
          <div className="flex flex-wrap gap-1">
            {icpCriteria?.industry && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-muted-foreground/30">
                {icpCriteria.industry}
              </Badge>
            )}
            {icpCriteria?.company_size && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-muted-foreground/30">
                {icpCriteria.company_size}
              </Badge>
            )}
            {icpCriteria?.buyer_persona && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-muted-foreground/30">
                {icpCriteria.buyer_persona}
              </Badge>
            )}
            {icpCriteria?.region && (
              <Badge variant="outline" className="text-xs px-1.5 py-0 border-muted-foreground/30">
                {icpCriteria.region}
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-1 gap-1.5">
          <Button
            variant="default"
            size="sm"
            className="h-7 text-xs gap-1.5 w-full justify-start"
            onClick={onFindLeads}
            disabled={isFinding}
          >
            {isFinding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
            Find More Leads
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 w-full justify-start"
            onClick={onScore}
            disabled={leadCount === 0}
          >
            <BarChart3 className="w-3 h-3" />
            Score & Rank
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1.5 w-full justify-start"
            onClick={onDraftAll}
            disabled={leadCount === 0}
          >
            <Mail className="w-3 h-3" />
            Draft Outreach
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs gap-1.5 w-full justify-start text-muted-foreground"
            onClick={onExport}
            disabled={leadCount === 0}
          >
            <Download className="w-3 h-3" />
            Export CSV
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
