import { useState, useMemo, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  TableProperties, Download, ExternalLink, Mail, Trash2,
  Search, ArrowUpDown, ArrowUp, ArrowDown, Linkedin, Phone,
  ChevronDown, CheckCheck, Sparkles, RefreshCw, MapPin,
} from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LeadDetailDrawer } from "./LeadDetailDrawer";
import type { SavedLead, LeadStatus, OutreachEntry } from "./useLeadsCRUD";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  replied: "bg-green-500/10 text-green-600 border-green-500/20",
  won: "bg-primary/10 text-primary border-primary/20",
  lost: "bg-muted text-muted-foreground border-border",
};

const ALL_STATUSES: LeadStatus[] = ["new", "contacted", "replied", "won", "lost"];

type SortKey = "name" | "company" | "status" | "created_at";
type SortDir = "asc" | "desc";

/** Strip "ICP Segment N:" prefix from persona tags */
function cleanPersonaTag(tag: string): string {
  return tag.replace(/^ICP\s+Segment\s+\d+:\s*/i, "").trim();
}

interface LeadsTableSectionProps {
  leads: SavedLead[];
  outreach?: OutreachEntry[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDeleteLead: (id: string) => void;
  onExportCSV: () => void;
  onDraftEmail?: (lead: SavedLead) => void;
  onEnrichLeads?: (leadIds: string[]) => Promise<void>;
  userId?: string;
}

export default function LeadsTableSection({
  leads, outreach = [], onUpdateStatus, onDeleteLead, onExportCSV, onDraftEmail, onEnrichLeads, userId,
}: LeadsTableSectionProps) {
  // Filters
  const [search, setSearch] = useState("");
  const [personaFilter, setPersonaFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Sort
  const [sortKey, setSortKey] = useState<SortKey>("created_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Detail drawer
  const [drawerLead, setDrawerLead] = useState<SavedLead | null>(null);
  const [enriching, setEnriching] = useState(false);

  // Count leads missing contact info
  const missingContactCount = useMemo(() => {
    return leads.filter(l => !l.email && !l.linkedin && !l.phone).length;
  }, [leads]);

  const handleEnrich = useCallback(async () => {
    if (!onEnrichLeads || enriching) return;
    // Enrich selected leads, or all leads missing contacts
    const targetIds = selectedIds.size > 0
      ? Array.from(selectedIds)
      : leads.filter(l => !l.email || !l.linkedin || !l.phone).map(l => l.id);
    if (targetIds.length === 0) return;
    setEnriching(true);
    try {
      await onEnrichLeads(targetIds.slice(0, 50));
    } finally {
      setEnriching(false);
      setSelectedIds(new Set());
    }
  }, [onEnrichLeads, enriching, selectedIds, leads]);

  const personaTags = useMemo(() => {
    const tags = new Set<string>();
    for (const l of leads) {
      if (l.persona_tag) tags.add(l.persona_tag);
    }
    return Array.from(tags);
  }, [leads]);

  const filtered = useMemo(() => {
    let result = leads;
    if (personaFilter !== "all") result = result.filter(l => l.persona_tag === personaFilter);
    if (statusFilter !== "all") result = result.filter(l => l.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(l =>
        l.name.toLowerCase().includes(q) ||
        (l.company?.toLowerCase().includes(q)) ||
        (l.email?.toLowerCase().includes(q)) ||
        (l.title?.toLowerCase().includes(q))
      );
    }
    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortKey) {
        case "name": cmp = a.name.localeCompare(b.name); break;
        case "company": cmp = (a.company || "").localeCompare(b.company || ""); break;
        case "status": cmp = a.status.localeCompare(b.status); break;
        case "created_at": cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime(); break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return result;
  }, [leads, personaFilter, statusFilter, search, sortKey, sortDir]);

  const toggleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (selectedIds.size === filtered.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(filtered.map(l => l.id)));
  }, [filtered, selectedIds.size]);

  const handleBulkStatus = useCallback((status: LeadStatus) => {
    selectedIds.forEach(id => onUpdateStatus(id, status));
    setSelectedIds(new Set());
  }, [selectedIds, onUpdateStatus]);

  const handleBulkDelete = useCallback(() => {
    selectedIds.forEach(id => onDeleteLead(id));
    setSelectedIds(new Set());
  }, [selectedIds, onDeleteLead]);

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 ml-1" /> : <ArrowDown className="w-3 h-3 ml-1" />;
  };

  if (leads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 pt-16">
        <TableProperties className="w-10 h-10 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground font-mono">No leads yet. Use Personas to find leads.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search leads..."
              className="h-8 pl-8 text-xs"
            />
          </div>
          {personaTags.length > 0 && (
            <Select value={personaFilter} onValueChange={setPersonaFilter}>
              <SelectTrigger className="h-8 text-xs w-[150px]">
                <SelectValue placeholder="Persona" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Personas</SelectItem>
                {personaTags.map(t => (
                  <SelectItem key={t} value={t}>{cleanPersonaTag(t)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs w-[110px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              {ALL_STATUSES.map(s => (
                <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[10px] shrink-0">
            {filtered.length}{filtered.length !== leads.length ? ` / ${leads.length}` : ""}
          </Badge>
          {onEnrichLeads && missingContactCount > 0 && (
            <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={handleEnrich} disabled={enriching}>
              <RefreshCw className={`w-3 h-3 ${enriching ? "animate-spin" : ""}`} />
              {enriching ? "Enriching…" : `Backfill (${selectedIds.size > 0 ? selectedIds.size : missingContactCount})`}
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-8 gap-1.5 text-xs" onClick={onExportCSV}>
            <Download className="w-3 h-3" /> CSV
          </Button>
        </div>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 bg-primary/5 border border-primary/20 rounded-lg animate-in fade-in-0 duration-200">
          <CheckCheck className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-primary">{selectedIds.size} selected</span>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                Set Status <ChevronDown className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              {ALL_STATUSES.map(s => (
                <DropdownMenuItem key={s} onClick={() => handleBulkStatus(s)} className="capitalize text-xs">{s}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive gap-1" onClick={handleBulkDelete}>
            <Trash2 className="w-3 h-3" /> Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-lg border border-border/40 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/30">
              <TableHead className="w-[40px] px-3">
                <Checkbox
                  checked={selectedIds.size === filtered.length && filtered.length > 0}
                  onCheckedChange={toggleAll}
                  className="translate-y-[1px]"
                />
              </TableHead>
              <TableHead className="text-xs w-[180px]">
                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("name")}>
                  Name <SortIcon col="name" />
                </button>
              </TableHead>
              <TableHead className="text-xs w-[140px]">Title</TableHead>
              <TableHead className="text-xs w-[130px]">
                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("company")}>
                  Company <SortIcon col="company" />
                </button>
              </TableHead>
              <TableHead className="text-xs w-[100px]">Contact</TableHead>
              <TableHead className="text-xs w-[120px]">Location</TableHead>
              <TableHead className="text-xs w-[120px]">Persona</TableHead>
              <TableHead className="text-xs w-[80px]">
                <button className="flex items-center hover:text-foreground transition-colors" onClick={() => toggleSort("status")}>
                  Status <SortIcon col="status" />
                </button>
              </TableHead>
              <TableHead className="text-xs w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(lead => (
              <TableRow
                key={lead.id}
                className="group cursor-pointer hover:bg-muted/20 transition-colors"
                onClick={() => setDrawerLead(lead)}
              >
                <TableCell className="px-3" onClick={e => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedIds.has(lead.id)}
                    onCheckedChange={() => toggleSelect(lead.id)}
                    className="translate-y-[1px]"
                  />
                </TableCell>
                <TableCell className="py-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-[10px] font-semibold text-primary">
                      {lead.name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-sm font-medium truncate">{lead.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate">{lead.title || "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground truncate">{lead.company || "—"}</TableCell>
                <TableCell onClick={e => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    {lead.email && (
                      <a href={`mailto:${lead.email}`} title={lead.email} className="text-muted-foreground hover:text-primary transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {lead.linkedin && (
                      <a href={lead.linkedin} target="_blank" rel="noopener" title="LinkedIn" className="text-muted-foreground hover:text-primary transition-colors">
                        <Linkedin className="w-3.5 h-3.5" />
                      </a>
                    )}
                    {lead.phone && (
                      <a href={`tel:${lead.phone}`} title={lead.phone} className="text-muted-foreground hover:text-primary transition-colors">
                        <Phone className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground truncate">
                  {lead.address ? (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{lead.address}</span>
                    </span>
                  ) : "—"}
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`text-[10px] ${STATUS_COLORS[lead.status]}`}>
                    {lead.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {lead.email && onDraftEmail && (
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => onDraftEmail(lead)} title="Draft email">
                        <Sparkles className="w-3 h-3" />
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => onDeleteLead(lead.id)} title="Delete">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Lead Detail Drawer */}
      <LeadDetailDrawer
        lead={drawerLead}
        open={!!drawerLead}
        onOpenChange={open => { if (!open) setDrawerLead(null); }}
        outreach={outreach}
        onUpdateStatus={(id, status) => {
          onUpdateStatus(id, status);
          if (drawerLead?.id === id) setDrawerLead({ ...drawerLead, status });
        }}
        onDraftEmail={lead => onDraftEmail?.(lead)}
        onDelete={id => {
          onDeleteLead(id);
          setDrawerLead(null);
        }}
        userId={userId}
      />
    </div>
  );
}
