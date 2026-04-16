import { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, Plus, Trash2, Sparkles, Users, TrendingUp, Handshake, UserCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Category = "customer" | "investor" | "partner" | "team";

interface NetworkRow {
  id: string;
  category: Category;
  name: string;
  company: string | null;
  notes: string | null;
  source: "manual" | "auto_discovered";
}

const CATEGORIES: { key: Category; label: string; icon: any; color: string }[] = [
  { key: "customer", label: "Customers", icon: Users, color: "text-emerald-400" },
  { key: "investor", label: "Investors", icon: TrendingUp, color: "text-amber-400" },
  { key: "partner", label: "Partners", icon: Handshake, color: "text-blue-400" },
  { key: "team", label: "Team & Advisors", icon: UserCheck, color: "text-primary" },
];

interface NetworkManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceKey: string;
  userId?: string;
}

export function NetworkManager({ open, onOpenChange, workspaceKey, userId }: NetworkManagerProps) {
  const [rows, setRows] = useState<NetworkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [autoDiscover, setAutoDiscover] = useState(false);
  const [newName, setNewName] = useState<Record<Category, string>>({ customer: "", investor: "", partner: "", team: "" });
  const [newCompany, setNewCompany] = useState<Record<Category, string>>({ customer: "", investor: "", partner: "", team: "" });

  const load = useCallback(async () => {
    if (!userId || !workspaceKey) return;
    setLoading(true);
    const [{ data: net }, { data: settings }] = await Promise.all([
      (supabase.from("user_network") as any)
        .select("*")
        .eq("workspace_key", workspaceKey)
        .order("created_at", { ascending: true }),
      (supabase.from("workspace_settings") as any)
        .select("auto_discover_network")
        .eq("workspace_key", workspaceKey)
        .maybeSingle(),
    ]);
    setRows((net as NetworkRow[]) || []);
    setAutoDiscover(!!settings?.auto_discover_network);
    setLoading(false);
  }, [userId, workspaceKey]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const runDiscovery = useCallback(async () => {
    setDiscovering(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/discover-network`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ workspaceKey }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      toast.success(`Discovered ${data.total} contacts across ${data.pagesScraped} pages`);
      await load();
    } catch (e: any) {
      console.error(e);
      toast.error("Auto-discovery failed");
    } finally {
      setDiscovering(false);
    }
  }, [workspaceKey, load]);

  const handleToggleAutoDiscover = useCallback(async (checked: boolean) => {
    setAutoDiscover(checked);
    if (!userId) return;
    await (supabase.from("workspace_settings") as any).upsert({
      user_id: userId,
      workspace_key: workspaceKey,
      auto_discover_network: checked,
    }, { onConflict: "user_id,workspace_key" });
    if (checked) {
      await runDiscovery();
    }
  }, [userId, workspaceKey, runDiscovery]);

  const addRow = useCallback(async (category: Category) => {
    const name = newName[category].trim();
    if (!name || !userId) return;
    const { data, error } = await (supabase.from("user_network") as any).insert({
      user_id: userId,
      workspace_key: workspaceKey,
      category,
      name,
      company: newCompany[category].trim() || null,
      source: "manual",
    }).select().single();
    if (error) { toast.error(error.message); return; }
    setRows((r) => [...r, data as NetworkRow]);
    setNewName((s) => ({ ...s, [category]: "" }));
    setNewCompany((s) => ({ ...s, [category]: "" }));
  }, [newName, newCompany, userId, workspaceKey]);

  const deleteRow = useCallback(async (id: string) => {
    await supabase.from("user_network").delete().eq("id", id);
    setRows((r) => r.filter((x) => x.id !== id));
  }, []);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Your Network
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            Powers warm intro path suggestions for every lead.
          </p>
        </SheetHeader>

        {/* Auto-discover toggle */}
        <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-5">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                AI auto-discover
              </div>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Scan <span className="font-mono">{workspaceKey}</span> for customers, investors, partners & team.
              </p>
            </div>
            <Switch checked={autoDiscover} onCheckedChange={handleToggleAutoDiscover} disabled={discovering} />
          </div>
          {discovering && (
            <div className="flex items-center gap-2 text-[11px] text-primary mt-2">
              <Loader2 className="w-3 h-3 animate-spin" /> Scanning website…
            </div>
          )}
          {autoDiscover && !discovering && (
            <Button variant="ghost" size="sm" className="h-6 text-[11px] gap-1 px-2 mt-1" onClick={runDiscovery}>
              <Sparkles className="w-3 h-3" /> Re-scan now
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {CATEGORIES.map(({ key, label, icon: Icon, color }) => {
              const items = rows.filter((r) => r.category === key);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                      <Icon className={cn("w-3.5 h-3.5", color)} />
                      <span className="text-xs font-semibold uppercase tracking-wider">{label}</span>
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{items.length}</Badge>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {items.map((r) => (
                      <div key={r.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-muted/40 group">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{r.name}</div>
                          {r.company && <div className="text-[10px] text-muted-foreground truncate">{r.company}</div>}
                        </div>
                        {r.source === "auto_discovered" && (
                          <Badge variant="outline" className="text-[9px] h-4 px-1 border-primary/30 text-primary">AI</Badge>
                        )}
                        <button onClick={() => deleteRow(r.id)} className="opacity-0 group-hover:opacity-100 p-0.5 text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    <div className="flex gap-1.5">
                      <Input
                        placeholder="Name"
                        value={newName[key]}
                        onChange={(e) => setNewName((s) => ({ ...s, [key]: e.target.value }))}
                        className="h-7 text-xs"
                      />
                      <Input
                        placeholder="Company"
                        value={newCompany[key]}
                        onChange={(e) => setNewCompany((s) => ({ ...s, [key]: e.target.value }))}
                        className="h-7 text-xs"
                      />
                      <Button size="sm" variant="outline" className="h-7 px-2 shrink-0" onClick={() => addRow(key)} disabled={!newName[key].trim()}>
                        <Plus className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
