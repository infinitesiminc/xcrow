import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, Users, ToggleLeft, Settings, Mail, ArrowLeft, Search, Trash2, Crown, Shield,
} from "lucide-react";
import Navbar from "@/components/Navbar";

type Section = "users" | "flags" | "config" | "emails";

const NAV = [
  { key: "users" as Section, label: "Users", icon: Users },
  { key: "flags" as Section, label: "Feature Flags", icon: ToggleLeft },
  { key: "config" as Section, label: "Platform Config", icon: Settings },
  { key: "emails" as Section, label: "Email Logs", icon: Mail },
];

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

interface FeatureFlag {
  key: string;
  enabled: boolean;
  description: string | null;
}

interface PlatformConfigRow {
  key: string;
  value: string;
  label: string | null;
  description: string | null;
}

interface EmailLog {
  id: string;
  created_at: string;
  template_name: string;
  recipient_email: string;
  status: string;
  error_message: string | null;
}

export default function Admin() {
  const { user, loading: authLoading, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [section, setSection] = useState<Section>("users");

  useEffect(() => {
    if (!authLoading && (!user || !isSuperAdmin)) navigate("/leadgen", { replace: true });
  }, [authLoading, user, isSuperAdmin, navigate]);

  if (authLoading || !isSuperAdmin) return null;

  return (
    <>
      <Navbar />
      <div className="min-h-[100dvh] bg-background flex">
        {/* Sidebar */}
        <aside className="hidden md:flex w-56 shrink-0 border-r border-border/50 flex-col bg-muted/5">
          <div className="p-4 border-b border-border/30">
            <button onClick={() => navigate("/leadgen")} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm mb-3">
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <h1 className="text-base font-bold text-foreground">Admin</h1>
            </div>
          </div>
          <nav className="flex-1 p-2 space-y-0.5">
            {NAV.map(n => (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={`w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all ${
                  section === n.key ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                }`}
              >
                <n.icon className="h-4 w-4 shrink-0" />
                {n.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile nav */}
        <div className="md:hidden fixed top-14 left-0 right-0 z-30 bg-background/90 backdrop-blur-md border-b border-border/50">
          <div className="flex gap-1 px-3 py-2 overflow-x-auto">
            {NAV.map(n => (
              <button
                key={n.key}
                onClick={() => setSection(n.key)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs whitespace-nowrap shrink-0 transition-all ${
                  section === n.key ? "bg-primary/15 text-primary font-medium" : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                <n.icon className="h-3 w-3" />
                {n.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 min-w-0 md:overflow-y-auto">
          <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 md:py-10 mt-12 md:mt-0">
            {section === "users" && <UsersSection />}
            {section === "flags" && <FlagsSection />}
            {section === "config" && <ConfigSection />}
            {section === "emails" && <EmailsSection />}
          </div>
        </main>
      </div>
    </>
  );
}

/* ── Users Section ── */
function UsersSection() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-list-users");
    if (!error && Array.isArray(data)) setUsers(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await supabase.functions.invoke("admin-delete-user", { body: { user_id: deleteTarget.user_id } });
      toast({ title: "User deleted" });
      setUsers(prev => prev.filter(u => u.user_id !== deleteTarget.user_id));
    } catch {
      toast({ title: "Failed to delete user", variant: "destructive" });
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const filtered = users.filter(u =>
    `${u.display_name} ${u.email} ${u.company}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Users</h2>
          <p className="text-sm text-muted-foreground">{users.length} total users</p>
        </div>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Company</TableHead>
                <TableHead className="hidden md:table-cell">Joined</TableHead>
                <TableHead className="w-[60px]" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(u => (
                <TableRow key={u.user_id}>
                  <TableCell>
                    <p className="text-sm font-medium text-foreground">{u.display_name}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    {u.job_title && <p className="text-xs text-muted-foreground">{u.job_title}</p>}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">{u.company || "—"}</TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">{deleteTarget?.email}</span> and all their data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete user
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ── Feature Flags Section ── */
function FlagsSection() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("feature_flags").select("key, enabled, description").order("key");
      if (data) setFlags(data);
      setLoading(false);
    })();
  }, []);

  const toggle = async (key: string, enabled: boolean) => {
    setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled } : f));
    const { error } = await supabase.from("feature_flags").update({ enabled }).eq("key", key);
    if (error) {
      toast({ title: "Failed to update flag", variant: "destructive" });
      setFlags(prev => prev.map(f => f.key === key ? { ...f, enabled: !enabled } : f));
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Feature Flags</h2>
      <p className="text-sm text-muted-foreground mb-6">Toggle features on/off across the platform.</p>

      <div className="space-y-3 max-w-lg">
        {flags.map(f => (
          <div key={f.key} className="flex items-center justify-between rounded-xl border border-border/50 bg-card px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground font-mono">{f.key}</p>
              {f.description && <p className="text-xs text-muted-foreground">{f.description}</p>}
            </div>
            <Switch checked={f.enabled} onCheckedChange={v => toggle(f.key, v)} />
          </div>
        ))}
        {flags.length === 0 && <p className="text-muted-foreground text-sm">No feature flags configured.</p>}
      </div>
    </div>
  );
}

/* ── Platform Config Section ── */
function ConfigSection() {
  const [configs, setConfigs] = useState<PlatformConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("platform_config").select("key, value, label, description").order("key");
      if (data) setConfigs(data);
      setLoading(false);
    })();
  }, []);

  const updateValue = (key: string, value: string) => {
    setConfigs(prev => prev.map(c => c.key === key ? { ...c, value } : c));
  };

  const save = async (key: string, value: string) => {
    setSaving(key);
    const { error } = await supabase.from("platform_config").update({ value }).eq("key", key);
    if (error) toast({ title: "Failed to save", variant: "destructive" });
    else toast({ title: `${key} updated` });
    setSaving(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Platform Config</h2>
      <p className="text-sm text-muted-foreground mb-6">Edit global configuration values.</p>

      <div className="space-y-4 max-w-lg">
        {configs.map(c => (
          <div key={c.key} className="rounded-xl border border-border/50 bg-card p-4 space-y-2">
            <div>
              <p className="text-sm font-medium text-foreground">{c.label || c.key}</p>
              {c.description && <p className="text-xs text-muted-foreground">{c.description}</p>}
            </div>
            <div className="flex gap-2">
              <Input
                value={c.value}
                onChange={e => updateValue(c.key, e.target.value)}
                className="text-sm"
              />
              <Button size="sm" variant="outline" onClick={() => save(c.key, c.value)} disabled={saving === c.key}>
                {saving === c.key ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
              </Button>
            </div>
          </div>
        ))}
        {configs.length === 0 && <p className="text-muted-foreground text-sm">No config values found.</p>}
      </div>
    </div>
  );
}

/* ── Email Logs Section ── */
function EmailsSection() {
  const [logs, setLogs] = useState<EmailLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      // email_send_log is service_role only, so we query via edge function or RPC
      // For now, use analytics query approach
      setLoading(false);
    })();
  }, []);

  return (
    <div>
      <h2 className="text-xl font-bold text-foreground mb-1">Email Logs</h2>
      <p className="text-sm text-muted-foreground mb-6">Recent email sends and delivery status.</p>

      <div className="rounded-xl border border-border/50 bg-card p-6 text-center text-muted-foreground">
        <Mail className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Email logs are accessible via backend analytics.</p>
        <p className="text-xs mt-1">View delivery metrics in your Lovable Cloud dashboard.</p>
      </div>
    </div>
  );
}
