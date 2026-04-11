import { useState, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TableProperties, Download, ExternalLink, Mail, Trash2 } from "lucide-react";
import type { SavedLead, LeadStatus } from "./useLeadsCRUD";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  replied: "bg-green-500/10 text-green-600 border-green-500/20",
  won: "bg-primary/10 text-primary border-primary/20",
  lost: "bg-muted text-muted-foreground border-border",
};

interface LeadsTableSectionProps {
  leads: SavedLead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDeleteLead: (id: string) => void;
  onExportCSV: () => void;
  onDraftEmail?: (lead: SavedLead) => void;
}

export default function LeadsTableSection({ leads, onUpdateStatus, onDeleteLead, onExportCSV, onDraftEmail }: LeadsTableSectionProps) {
  const [personaFilter, setPersonaFilter] = useState<string>("all");

  const personaTags = useMemo(() => {
    const tags = new Set<string>();
    for (const l of leads) {
      if (l.persona_tag) tags.add(l.persona_tag);
    }
    return Array.from(tags);
  }, [leads]);

  const filtered = useMemo(() => {
    if (personaFilter === "all") return leads;
    return leads.filter(l => l.persona_tag === personaFilter);
  }, [leads, personaFilter]);

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-16">
        <TableProperties className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-mono">No leads yet. Use Personas to find leads.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold">Leads</h3>
          <Badge variant="secondary" className="text-[10px]">{filtered.length}{personaFilter !== "all" ? ` / ${leads.length}` : ""}</Badge>
        </div>
        <div className="flex items-center gap-2">
          {personaTags.length > 0 && (
            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="h-8 text-xs w-[160px]">
                <SelectValue placeholder="Filter by persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personas</SelectItem>
                {personaTags.map(t => (
                  <SelectItem key={t} value={t}>{t}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onExportCSV}>
            <Download className="w-3 h-3" /> CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="text-xs w-[180px]">Name</TableHead>
              <TableHead className="text-xs w-[140px]">Title</TableHead>
              <TableHead className="text-xs w-[130px]">Company</TableHead>
              <TableHead className="text-xs w-[100px]">Persona</TableHead>
              <TableHead className="text-xs w-[80px]">Status</TableHead>
              <TableHead className="text-xs w-[100px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(lead => (
              <TableRow key={lead.id} className="group">
                <TableCell className="py-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium truncate">{lead.name}</span>
                    {lead.email && <span className="text-[10px] text-muted-foreground truncate">{lead.email}</span>}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate">{lead.title || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate">{lead.company || "—"}</TableCell>
                <TableCell>
                  {lead.persona_tag && (
                    <Badge variant="outline" className="text-[10px] font-normal">{lead.persona_tag}</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[lead.status]}`}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {lead.linkedin && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                        <a href={lead.linkedin} target="_blank" rel="noopener"><ExternalLink className="w-3 h-3" /></a>
                      </Button>
                    )}
                    {lead.email && onDraftEmail && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDraftEmail(lead)}>
                        <Mail className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteLead(lead.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
