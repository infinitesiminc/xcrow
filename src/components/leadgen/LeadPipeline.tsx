import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Mail, MessageSquare, TrendingUp, Download, Search, ExternalLink, Sparkles, Globe, Phone } from "lucide-react";
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
}

function LeadAvatar({ lead }: { lead: SavedLead }) {
  const [imgError, setImgError] = useState(false);
  const photoUrl = lead.photo_url || (lead.email ? `https://www.gravatar.com/avatar/${lead.email.trim().toLowerCase()}?d=404&s=80` : null);

  if (photoUrl && !imgError) {
    return <img src={photoUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 bg-muted" onError={() => setImgError(true)} />;
  }
  const initials = lead.name.split(" ").map(w => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  return (
    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
      {initials}
    </div>
  );
}

export function LeadPipeline({ leads, onUpdateStatus, onDraftEmail, onExportCSV, outreachCount, onSelectLead }: LeadPipelineProps) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    let result = leads;
    if (statusFilter !== "all") result = result.filter((l) => l.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((l) => l.name.toLowerCase().includes(q) || l.company?.toLowerCase().includes(q) || l.email?.toLowerCase().includes(q));
    }
    return result;
  }, [leads, search, statusFilter]);

  const contacted = leads.filter((l) => l.status !== "new").length;
  const replied = leads.filter((l) => l.status === "replied" || l.status === "won").length;
  const replyRate = contacted > 0 ? Math.round((replied / contacted) * 100) : 0;

  return (
    <div className="flex flex-col h-full">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4">
        <KPI icon={<Users className="w-4 h-4" />} label="Total Leads" value={leads.length} />
        <KPI icon={<Mail className="w-4 h-4" />} label="Emails Sent" value={outreachCount} />
        <KPI icon={<MessageSquare className="w-4 h-4" />} label="Contacted" value={contacted} />
        <KPI icon={<TrendingUp className="w-4 h-4" />} label="Reply Rate" value={`${replyRate}%`} />
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search leads..." className="pl-8 h-8 text-sm" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] h-8 text-xs">
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
        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={onExportCSV}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      {/* Lead Cards */}
      <ScrollArea className="flex-1 px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {leads.length === 0 ? "No leads yet — start a chat to discover prospects!" : "No leads match your filters."}
          </div>
        ) : (
          <div className="space-y-2.5">
            {filtered.map((lead) => (
              <Card key={lead.id} className="bg-card/60 border-border/40 hover:border-primary/20 transition-colors">
                <CardContent className="p-3">
                  {/* Row 1: Avatar + Name + Status */}
                  <div className="flex items-start gap-3">
                    <LeadAvatar lead={lead} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">{lead.name}</p>
                          {(lead.title || lead.company) && (
                            <p className="text-xs text-muted-foreground truncate">
                              {lead.title}{lead.title && lead.company ? " @ " : ""}{lead.company}
                            </p>
                          )}
                        </div>
                        <Select value={lead.status} onValueChange={(v) => onUpdateStatus(lead.id, v as LeadStatus)}>
                          <SelectTrigger className="h-6 text-xs w-[90px] px-2 shrink-0">
                            <Badge variant="outline" className={`text-xs px-1.5 py-0 ${STATUS_COLORS[lead.status]}`}>
                              {lead.status}
                            </Badge>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="replied">Replied</SelectItem>
                            <SelectItem value="won">Won</SelectItem>
                            <SelectItem value="lost">Lost</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Row 2: ICP Reason */}
                      {lead.reason && (
                        <p className="text-xs text-primary/80 mt-1 font-medium truncate">💡 {lead.reason}</p>
                      )}

                      {/* Row 3: Contact Details */}
                      <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs text-muted-foreground">
                        {lead.email && (
                          <span className="flex items-center gap-1 truncate max-w-[200px]">
                            <Mail className="w-3 h-3 shrink-0" /> {lead.email}
                          </span>
                        )}
                        {lead.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 shrink-0" /> {lead.phone}
                          </span>
                        )}
                        {lead.linkedin && (
                          <a href={lead.linkedin} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                            <ExternalLink className="w-3 h-3 shrink-0" /> LinkedIn
                          </a>
                        )}
                        {lead.website && (
                          <a href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary transition-colors">
                            <Globe className="w-3 h-3 shrink-0" /> Web
                          </a>
                        )}
                      </div>

                      {/* Row 4: Source + Actions */}
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1.5">
                          {lead.source && (
                            <Badge variant="outline" className="text-xs px-1.5 py-0 border-muted-foreground/30 text-muted-foreground">
                              {lead.source}
                            </Badge>
                          )}
                          {lead.niche_tag && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0">
                              {lead.niche_tag}
                            </Badge>
                          )}
                        </div>
                        {lead.email && (
                          <Button variant="outline" size="sm" className="h-6 gap-1 text-xs px-2" onClick={() => onDraftEmail(lead)}>
                            <Mail className="w-3 h-3" />
                            <Sparkles className="w-3 h-3" />
                            Draft
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
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
