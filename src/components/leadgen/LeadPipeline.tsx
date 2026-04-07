import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Users, Mail, MessageSquare, TrendingUp, Download, Search, ExternalLink, MapPin, Globe } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import type { SavedLead, LeadStatus } from "./useLeadsCRUD";
import type { Lead } from "./LeadCard";

const STATUS_COLORS: Record<LeadStatus, string> = {
  new: "bg-blue-500/10 text-blue-600 border-blue-500/30",
  contacted: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  replied: "bg-green-500/10 text-green-600 border-green-500/30",
  won: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  lost: "bg-muted text-muted-foreground border-border",
};

interface LeadPipelineProps {
  leads: SavedLead[];
  onUpdateStatus: (id: string, status: LeadStatus) => void;
  onDraftEmail: (lead: Lead) => void;
  onExportCSV: () => void;
  outreachCount: number;
  onSelectLead?: (lead: SavedLead) => void;
  onFindLookalikes?: (lead: SavedLead) => void;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
  onSelectAll?: () => void;
}

function LeadAvatar({ lead }: { lead: SavedLead }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = lead.photo_url || (lead.email ? `https://www.gravatar.com/avatar/${lead.email.trim().toLowerCase()}?d=404&s=40` : null);

  if (photoUrl && !imgError) {
    return <img src={photoUrl} alt="" className="w-7 h-7 rounded-full object-cover shrink-0 bg-muted" onError={() => setImgError(true)} />;
  }
  const initials = lead.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-[10px] font-bold text-primary">
      {initials}
    </div>
  );
}

export function LeadPipeline({
  leads, onUpdateStatus, onDraftEmail, onExportCSV, outreachCount,
  onSelectLead, onFindLookalikes, selectedIds, onToggleSelect, onSelectAll,
}: LeadPipelineProps) {
  const isMobile = useIsMobile();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [nicheFilter, setNicheFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");

  const nicheOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) set.add(l.niche_tag || "Uncategorized");
    return Array.from(set).sort();
  }, [leads]);

  const locationOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (l.address) set.add(l.address);
    }
    return Array.from(set).sort();
  }, [leads]);

  const sourceOptions = useMemo(() => {
    const set = new Set<string>();
    for (const l of leads) {
      if (l.source) set.add(l.source);
    }
    return Array.from(set).sort();
  }, [leads]);

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (nicheFilter !== "all") result = result.filter((l) => (l.niche_tag || "Uncategorized") === nicheFilter);
    if (locationFilter !== "all") result = result.filter((l) => (l.address || "") === locationFilter);
    if (sourceFilter !== "all") result = result.filter((l) => (l.source || "") === sourceFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q) || l.address?.toLowerCase().includes(q));
    }
    return result;
  }, [leads, search, statusFilter, nicheFilter, locationFilter, sourceFilter]);

  const contacted = leads.filter((l) => l.status !== "new").length;
  const replied = leads.filter((l) => l.status === "replied" || l.status === "won").length;
  const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;

  const allSelected = filtered.length > 0 && selectedIds && filtered.every(l => selectedIds.has(l.id));

  return (
    <div className="flex flex-col h-full">
      {/* Search first on mobile */}
      <div className={`px-3 md:px-4 ${isMobile ? "pt-2 pb-1" : "pb-3"}`}>
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-8 h-9 md:h-8 text-sm" />
        </div>
      </div>

      {/* KPI Cards — compact horizontal strip on mobile, grid on desktop */}
      {isMobile ? (
        <div className="flex gap-2 px-3 pb-2 overflow-x-auto">
          <MiniKPI label="Leads" value={leads.length} />
          <MiniKPI label="Sent" value={outreachCount} />
          <MiniKPI label="Contacted" value={contacted} />
          <MiniKPI label="Reply" value={`${replyRate}%`} />
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-3 px-4 pb-3">
          <KPI icon={<Users className="w-4 h-4" />} label="Total Leads" value={leads.length} />
          <KPI icon={<Mail className="w-4 h-4" />} label="Emails Sent" value={outreachCount} />
          <KPI icon={<MessageSquare className="w-4 h-4" />} label="Contacted" value={contacted} />
          <KPI icon={<TrendingUp className="w-4 h-4" />} label="Reply Rate" value={`${replyRate}%`} />
        </div>
      )}

      {/* Filters */}
      <div className={`px-3 md:px-4 pb-2 flex items-center gap-2 flex-wrap`}>
        {nicheOptions.length > 1 && (
          <Select value={nicheFilter} onValueChange={setNicheFilter}>
            <SelectTrigger className="w-[130px] md:w-[160px] h-8 text-xs">
              <SelectValue placeholder="All Niches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Niches</SelectItem>
              {nicheOptions.map((n) => (
                <SelectItem key={n} value={n}>{n}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!isMobile && locationOptions.length > 0 && (
          <Select value={locationFilter} onValueChange={setLocationFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <MapPin className="w-3 h-3 mr-1 shrink-0" />
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              {locationOptions.map((loc) => (
                <SelectItem key={loc} value={loc}>{loc}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {!isMobile && sourceOptions.length > 1 && (
          <Select value={sourceFilter} onValueChange={setSourceFilter}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <Globe className="w-3 h-3 mr-1 shrink-0" />
              <SelectValue placeholder="All Sources" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              {sourceOptions.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[100px] md:w-[120px] h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="replied">Replied</SelectItem>
            <SelectItem value="won">Won</SelectItem>
            <SelectItem value="lost">Lost</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs ml-auto" onClick={onExportCSV}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      {/* Lead Table */}
      <ScrollArea className="flex-1 px-3 md:px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {leads.length === 0 ? "No leads yet — select targeting criteria and generate!" : "No leads match your filters."}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {onToggleSelect && (
                  <TableHead className="w-[36px] px-2">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={() => onSelectAll?.()}
                    />
                  </TableHead>
                )}
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Title</TableHead>
                <TableHead className="hidden sm:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Location</TableHead>
                <TableHead className="w-[90px]">Persona</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((lead) => (
                <TableRow
                  key={lead.id}
                  className="cursor-pointer hover:bg-muted/50 h-12"
                  onClick={() => onSelectLead?.(lead)}
                >
                  {onToggleSelect && (
                    <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds?.has(lead.id) || false}
                        onCheckedChange={() => onToggleSelect(lead.id)}
                      />
                    </TableCell>
                  )}
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <LeadAvatar lead={lead} />
                      <span className="text-sm font-medium text-foreground truncate">{lead.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground truncate block max-w-[200px]">{lead.title || "—"}</span>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <span className="text-xs text-muted-foreground truncate block max-w-[160px]">{lead.company || "—"}</span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {lead.address ? (
                      <span className="text-xs text-muted-foreground truncate block max-w-[140px]">{lead.address}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {lead.niche_tag ? (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 font-normal text-primary/70 border-primary/20 bg-primary/5 whitespace-nowrap truncate max-w-[85px]">
                        {lead.niche_tag.split(" ")[0]}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground/40">—</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </ScrollArea>
    </div>
  );
}

function KPI({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card className="bg-card/40 border-border/30">
      <CardContent className="p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">{icon}</div>
        <div>
          <p className="text-lg font-bold text-foreground leading-none">{value}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function MiniKPI({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-card/40 border border-border/30 shrink-0">
      <span className="text-sm font-bold text-foreground">{value}</span>
      <span className="text-[10px] text-muted-foreground">{label}</span>
    </div>
  );
}
