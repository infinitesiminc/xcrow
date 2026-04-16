import { useEffect, useState, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Network, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PathCard, type WarmPath } from "./PathCard";
import type { SavedLead } from "./useLeadsCRUD";

interface WarmPathDrawerProps {
  lead: SavedLead | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceKey: string;
  onUsePath?: (lead: SavedLead, path: WarmPath) => void;
}

export function WarmPathDrawer({ lead, open, onOpenChange, workspaceKey, onUsePath }: WarmPathDrawerProps) {
  const [paths, setPaths] = useState<WarmPath[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [networkEmpty, setNetworkEmpty] = useState(false);

  const generate = useCallback(async (force = false) => {
    if (!lead) return;
    setLoading(true);
    setError(null);
    try {
      const { data: net } = await supabase
        .from("user_network")
        .select("id")
        .eq("workspace_key", workspaceKey)
        .limit(1);
      if (!net || net.length === 0) {
        setNetworkEmpty(true);
        setLoading(false);
        return;
      }
      setNetworkEmpty(false);

      const { data: { session } } = await supabase.auth.getSession();
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-warm-paths`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ workspaceKey, lead, forceRegenerate: force }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setPaths(data.paths || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Failed to generate paths");
    } finally {
      setLoading(false);
    }
  }, [lead, workspaceKey]);

  useEffect(() => {
    if (open && lead) generate(false);
  }, [open, lead, generate]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <Network className="w-4 h-4 text-primary" />
            Warm intro paths
          </SheetTitle>
          {lead && (
            <p className="text-xs text-muted-foreground">
              Into <span className="font-medium text-foreground">{lead.company || lead.name}</span>
            </p>
          )}
        </SheetHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            <span className="text-sm">Reasoning over your network…</span>
          </div>
        )}

        {networkEmpty && !loading && (
          <div className="text-center py-12 px-4">
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium mb-1">Your network is empty</p>
            <p className="text-xs text-muted-foreground mb-4">
              Add your customers, investors, partners, and team in <strong>Your Network</strong> — or enable AI auto-discover to scrape them from your site.
            </p>
          </div>
        )}

        {error && !loading && (
          <div className="text-center py-8 px-4 text-sm text-destructive">{error}</div>
        )}

        {!loading && !networkEmpty && paths.length > 0 && (
          <>
            <div className="space-y-3 mb-4">
              {paths.map((p, i) => (
                <PathCard key={i} path={p} onUsePath={lead ? (path) => onUsePath?.(lead, path) : undefined} />
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => generate(true)}
              disabled={loading}
            >
              <RefreshCw className="w-3 h-3" /> Regenerate
            </Button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
