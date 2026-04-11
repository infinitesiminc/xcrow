import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  MapPin, ExternalLink, Users, Mail, Linkedin, Loader2,
  DollarSign, Calendar, UserCheck, Swords, Warehouse, Clock, FileText,
  ChevronDown,
} from "lucide-react";
import { useFlashAccountData, type AccountContact } from "./useFlashAccountData";
import type { FlashAccount, AccountStage } from "@/types/accounts";
import { STAGE_CONFIG } from "@/types/accounts";

interface AccountDetailPanelProps {
  account: FlashAccount;
  onFindContacts: (account: FlashAccount) => void;
  loadingLeads: boolean;
  activityLog: string[];
  /** In-memory leads found via streaming (before DB save) */
  streamedLeads: { name: string; title?: string; email?: string; linkedin?: string; score?: number; reason?: string }[];
  onStageChange?: (accountId: string, stage: AccountStage) => void;
}

export default function AccountDetailPanel({
  account, onFindContacts, loadingLeads, activityLog, streamedLeads, onStageChange,
}: AccountDetailPanelProps) {
  const { contacts, activities, linkedGarages, loading, fetchAll, saveContacts, logActivity, updateStage } = useFlashAccountData(account.id);
  const [activeTab, setActiveTab] = useState("overview");
  const [stageOpen, setStageOpen] = useState(false);

  // Fetch data when account changes
  useEffect(() => {
    fetchAll();
    setActiveTab("overview");
  }, [account.id, fetchAll]);

  // Save streamed leads to DB when they arrive
  useEffect(() => {
    if (streamedLeads.length > 0 && !loadingLeads) {
      saveContacts(account.id, streamedLeads);
      logActivity(account.id, "contacts_found", `Found ${streamedLeads.length} decision-makers`);
    }
  }, [streamedLeads, loadingLeads, account.id, saveContacts, logActivity]);

  const displayContacts = contacts.length > 0 ? contacts : streamedLeads.map((l, i) => ({
    id: `temp-${i}`,
    account_id: account.id,
    name: l.name,
    title: l.title || null,
    email: l.email || null,
    phone: null,
    linkedin: l.linkedin || null,
    score: l.score ?? null,
    reason: l.reason || null,
    outreach_status: "new",
    created_at: new Date().toISOString(),
  }));

  const handleStageChange = async (newStage: AccountStage) => {
    await updateStage(account.id, newStage);
    onStageChange?.(account.id, newStage);
    setStageOpen(false);
    fetchAll(); // refresh activities
  };

  const cfg = STAGE_CONFIG[account.stage];

  return (
    <div className="space-y-2">
      {/* Header */}
      <div>
        <h3 className="font-bold text-sm leading-tight">
          {account.name}{account.accountType === "fleet_operator" ? " (HQ)" : ""}
        </h3>
        <p className="text-[11px] text-muted-foreground">{account.hqCity}</p>
      </div>

      {/* Stage badge (editable) */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <button
            onClick={() => setStageOpen(!stageOpen)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium text-white"
            style={{ backgroundColor: cfg.markerColor }}
          >
            {cfg.label}
            <ChevronDown className="w-3 h-3" />
          </button>
          {stageOpen && (
            <div className="absolute top-full left-0 mt-1 bg-background border border-border rounded-lg shadow-lg z-50 py-1 min-w-[120px]">
              {(["whitespace", "target", "active", "competitor"] as AccountStage[]).map((s) => (
                <button
                  key={s}
                  onClick={() => handleStageChange(s)}
                  className="w-full text-left px-3 py-1.5 text-[11px] hover:bg-muted flex items-center gap-2"
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: STAGE_CONFIG[s].markerColor }} />
                  {STAGE_CONFIG[s].label}
                </button>
              ))}
            </div>
          )}
        </div>
        <span className="text-[10px] text-muted-foreground">{account.estimatedSpaces} spaces · {account.facilityCount}</span>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full h-7 p-0.5 bg-muted/60">
          <TabsTrigger value="overview" className="flex-1 text-[10px] h-6 px-1 data-[state=active]:text-xs">Overview</TabsTrigger>
          <TabsTrigger value="contacts" className="flex-1 text-[10px] h-6 px-1 data-[state=active]:text-xs">
            Contacts {displayContacts.length > 0 && <Badge variant="secondary" className="ml-1 text-[8px] px-1 py-0 h-3.5">{displayContacts.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="locations" className="flex-1 text-[10px] h-6 px-1 data-[state=active]:text-xs">
            Locations {linkedGarages.length > 0 && <Badge variant="secondary" className="ml-1 text-[8px] px-1 py-0 h-3.5">{linkedGarages.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="activity" className="flex-1 text-[10px] h-6 px-1 data-[state=active]:text-xs">Activity</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-2 space-y-2">
          {(account.annualRevenue || account.employeeCount || account.founded) && (
            <div className="grid grid-cols-3 gap-1.5">
              {account.annualRevenue && (
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <DollarSign className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                  <p className="text-[10px] font-semibold">{account.annualRevenue}</p>
                  <p className="text-[8px] text-muted-foreground">Revenue</p>
                </div>
              )}
              {account.employeeCount && (
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <UserCheck className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                  <p className="text-[10px] font-semibold">{account.employeeCount}</p>
                  <p className="text-[8px] text-muted-foreground">Employees</p>
                </div>
              )}
              {account.founded && (
                <div className="bg-muted/50 rounded-md px-2 py-1.5 text-center">
                  <Calendar className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
                  <p className="text-[10px] font-semibold">{account.founded}</p>
                  <p className="text-[8px] text-muted-foreground">Founded</p>
                </div>
              )}
            </div>
          )}
          <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]">
            {account.currentVendor && (
              <span className="inline-flex items-center gap-1 text-destructive font-medium">
                <Swords className="w-3 h-3" /> {account.currentVendor}
              </span>
            )}
            <span className="text-muted-foreground">{account.focusArea}</span>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <a href={account.website} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
              Website <ExternalLink className="w-3 h-3" />
            </a>
            {account.caseStudyUrl && (
              <a href={account.caseStudyUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline font-medium">
                Case study <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          {account.differentiator && (
            <p className="text-[10px] text-muted-foreground">{account.differentiator}</p>
          )}
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-1.5 pt-1">
            <div className="bg-muted/30 rounded-md px-2 py-1.5 text-center border border-border/50">
              <Users className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
              <p className="text-[10px] font-semibold">{displayContacts.length}</p>
              <p className="text-[8px] text-muted-foreground">Contacts</p>
            </div>
            <div className="bg-muted/30 rounded-md px-2 py-1.5 text-center border border-border/50">
              <Warehouse className="w-3 h-3 mx-auto text-muted-foreground mb-0.5" />
              <p className="text-[10px] font-semibold">{linkedGarages.length}</p>
              <p className="text-[8px] text-muted-foreground">Locations</p>
            </div>
          </div>
        </TabsContent>

        {/* Contacts Tab */}
        <TabsContent value="contacts" className="mt-2 space-y-2">
          {!displayContacts.length && !loadingLeads && (
            <div className="text-center py-4">
              <Users className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-[11px] text-muted-foreground mb-2">No contacts found yet</p>
              <Button size="sm" variant="outline" className="text-[11px]" onClick={() => onFindContacts(account)}>
                <Users className="w-3 h-3 mr-1.5" /> Find Decision-Makers
              </Button>
            </div>
          )}
          {loadingLeads && (
            <div className="space-y-1.5 py-2">
              {activityLog.map((msg, i) => (
                <div key={i} className={`flex items-start gap-2 text-[11px] ${i === activityLog.length - 1 ? "text-foreground" : "text-muted-foreground"}`}>
                  {i === activityLog.length - 1 ? (
                    <Loader2 className="w-3 h-3 animate-spin shrink-0 mt-0.5" />
                  ) : (
                    <span className="w-3 h-3 shrink-0 mt-0.5 text-center text-[9px]">✓</span>
                  )}
                  <span>{msg}</span>
                </div>
              ))}
            </div>
          )}
          {displayContacts.length > 0 && !loadingLeads && (
            <div className="space-y-1.5">
              {displayContacts.map((contact) => (
                <ContactCard key={contact.id} contact={contact} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Locations Tab */}
        <TabsContent value="locations" className="mt-2 space-y-2">
          {linkedGarages.length === 0 ? (
            <div className="text-center py-4">
              <Warehouse className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-[11px] text-muted-foreground">No linked locations yet</p>
              <p className="text-[10px] text-muted-foreground/70 mt-1">Garages are auto-linked when scanned</p>
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                {linkedGarages.length} Linked Locations
              </p>
              {linkedGarages.map((g) => (
                <div key={g.id} className="flex items-start gap-2 p-2 rounded-lg bg-muted/30 border border-border/50">
                  <Warehouse className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-medium leading-tight truncate">{g.name}</p>
                    {g.address && <p className="text-[10px] text-muted-foreground truncate">{g.address}</p>}
                    <div className="flex items-center gap-2 mt-0.5">
                      {g.capacity && <span className="text-[9px] text-muted-foreground">🅿️ {g.capacity.toLocaleString()}</span>}
                      {g.rating && <span className="text-[9px] text-muted-foreground">⭐ {g.rating}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Activity Tab */}
        <TabsContent value="activity" className="mt-2 space-y-2">
          {activities.length === 0 ? (
            <div className="text-center py-4">
              <Clock className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-[11px] text-muted-foreground">No activity recorded yet</p>
            </div>
          ) : (
            <div className="space-y-1">
              {activities.map((a) => (
                <div key={a.id} className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/30">
                  <ActivityIcon type={a.activity_type} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] leading-tight">{a.description}</p>
                    <p className="text-[9px] text-muted-foreground mt-0.5">
                      {new Date(a.created_at).toLocaleDateString()} {new Date(a.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ContactCard({ contact }: { contact: AccountContact | { id: string; name: string; title: string | null; email: string | null; linkedin: string | null; score: number | null; reason: string | null; outreach_status: string } }) {
  const initials = contact.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <div className="flex items-start gap-2.5 p-2.5 rounded-xl bg-muted/30 border border-border/50 hover:border-border transition-colors">
      <div className="relative shrink-0">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
          {initials}
        </div>
        {contact.score != null && (
          <span className={`absolute -bottom-1 -right-1 text-[9px] font-bold px-1 py-px rounded-full border border-background ${
            contact.score >= 80 ? "bg-green-500 text-white" : contact.score >= 60 ? "bg-yellow-500 text-white" : "bg-muted text-muted-foreground"
          }`}>{contact.score}</span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold leading-tight truncate">{contact.name}</p>
        {contact.title && <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{contact.title}</p>}
        {contact.reason && <p className="text-[10px] text-muted-foreground/70 mt-1 leading-snug">{contact.reason}</p>}
        <div className="flex gap-3 mt-1.5">
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-primary hover:text-primary/80 text-[10px] inline-flex items-center gap-1 font-medium">
              <Mail className="w-3 h-3" /> Email
            </a>
          )}
          {contact.linkedin && (
            <a href={contact.linkedin} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 text-[10px] inline-flex items-center gap-1 font-medium">
              <Linkedin className="w-3 h-3" /> LinkedIn
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ActivityIcon({ type }: { type: string }) {
  switch (type) {
    case "contacts_found": return <Users className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0" />;
    case "stage_change": return <FileText className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />;
    default: return <Clock className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />;
  }
}
