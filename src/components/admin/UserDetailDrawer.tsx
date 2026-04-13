import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Loader2, Globe, Users, FileText, Mail, Building2, Briefcase, Calendar, CreditCard } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  user_id: string;
  display_name: string;
  email: string;
  company: string;
  job_title: string;
  created_at: string;
  onboarding_completed: boolean;
  credit_balance: number;
  lead_count: number;
  last_sign_in: string | null;
  plan: string;
  plan_source: string | null;
}

interface Workspace {
  id: string;
  website_key: string;
  display_name: string | null;
  last_accessed_at: string;
  created_at: string;
}

interface LeadSummary {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  status: string;
  workspace_key: string;
  created_at: string;
}

interface UserDetailDrawerProps {
  user: AdminUser | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UserDetailDrawer({ user, open, onOpenChange }: UserDetailDrawerProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [leads, setLeads] = useState<LeadSummary[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [wsRes, leadsRes] = await Promise.all([
      (supabase.from("user_workspaces") as any)
        .select("id, website_key, display_name, last_accessed_at, created_at")
        .eq("user_id", user.user_id)
        .order("last_accessed_at", { ascending: false }),
      (supabase.from("saved_leads") as any)
        .select("id, name, company, email, status, workspace_key, created_at")
        .eq("user_id", user.user_id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    if (wsRes.data) setWorkspaces(wsRes.data);
    if (leadsRes.data) setLeads(leadsRes.data);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (open && user) fetchDetails();
    if (!open) { setWorkspaces([]); setLeads([]); }
  }, [open, user, fetchDetails]);

  if (!user) return null;

  const leadsByWorkspace = leads.reduce<Record<string, LeadSummary[]>>((acc, l) => {
    const key = l.workspace_key || "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(l);
    return acc;
  }, {});

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col gap-0">
        <SheetHeader className="px-5 pt-5 pb-0 shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <span className="text-lg font-semibold text-primary">
                {user.display_name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-lg text-left">{user.display_name}</SheetTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <Badge variant={user.plan === "free" ? "secondary" : "default"} className="text-xs capitalize">
                  {user.plan}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1 px-5">
          <div className="py-4 space-y-5">
            {/* User Info */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Details</h4>
              <div className="space-y-1.5 text-sm">
                {user.company && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Building2 className="w-4 h-4" /> <span>{user.company}</span>
                  </div>
                )}
                {user.job_title && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Briefcase className="w-4 h-4" /> <span>{user.job_title}</span>
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Mail className="w-4 h-4" /> <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <CreditCard className="w-4 h-4" /> <span>{user.credit_balance} credits</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Users className="w-4 h-4" /> <span>{user.lead_count} leads</span>
                </div>
                <div className="flex items-center gap-2.5 text-muted-foreground">
                  <Calendar className="w-4 h-4" /> <span>Joined {new Date(user.created_at).toLocaleDateString()}</span>
                </div>
                {user.last_sign_in && (
                  <div className="flex items-center gap-2.5 text-muted-foreground">
                    <Calendar className="w-4 h-4" /> <span>Last active {new Date(user.last_sign_in).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Workspaces */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Workspaces ({workspaces.length})
              </h4>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              ) : workspaces.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No workspaces</p>
              ) : (
                <div className="space-y-2">
                  {workspaces.map(ws => {
                    const wsLeads = leadsByWorkspace[ws.website_key] || [];
                    return (
                      <div key={ws.id} className="bg-muted/30 border border-border/30 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-sm font-medium text-foreground">{ws.display_name || ws.website_key}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">{wsLeads.length} leads</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Last accessed {new Date(ws.last_accessed_at).toLocaleDateString()}
                        </p>

                        {/* Leads in this workspace */}
                        {wsLeads.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {wsLeads.slice(0, 5).map(lead => (
                              <div key={lead.id} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-background/50">
                                <div className="min-w-0">
                                  <span className="font-medium text-foreground">{lead.name}</span>
                                  {lead.company && <span className="text-muted-foreground ml-1">@ {lead.company}</span>}
                                </div>
                                <Badge variant="outline" className="text-[10px] capitalize shrink-0 ml-2">{lead.status}</Badge>
                              </div>
                            ))}
                            {wsLeads.length > 5 && (
                              <p className="text-[10px] text-muted-foreground/60 text-center pt-1">
                                +{wsLeads.length - 5} more leads
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <Separator />

            {/* All Leads Summary */}
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                All Leads ({leads.length})
              </h4>

              {loading ? (
                <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                  <Loader2 className="w-3 h-3 animate-spin" /> Loading...
                </div>
              ) : leads.length === 0 ? (
                <p className="text-xs text-muted-foreground/60 italic">No leads</p>
              ) : (
                <div className="space-y-1">
                  {leads.slice(0, 20).map(lead => (
                    <div key={lead.id} className="flex items-center justify-between text-xs py-1.5 px-2.5 rounded-lg bg-muted/20 border border-border/20">
                      <div className="min-w-0 flex-1">
                        <span className="font-medium text-foreground">{lead.name}</span>
                        {lead.company && <span className="text-muted-foreground ml-1">@ {lead.company}</span>}
                        {lead.email && <p className="text-muted-foreground/70 truncate">{lead.email}</p>}
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span className="text-[10px] text-muted-foreground">{lead.workspace_key}</span>
                        <Badge variant="outline" className="text-[10px] capitalize">{lead.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {leads.length > 20 && (
                    <p className="text-xs text-muted-foreground/60 text-center pt-1">
                      +{leads.length - 20} more leads (showing first 20)
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
