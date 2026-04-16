import { useState } from "react";
import { Sparkles, Plus, X, Link2, Loader2, Compass, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeepResearchInputProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  disabled?: boolean;
}

const MAX_URLS = 10;

interface DiscoveredChild {
  url: string;
  text: string;
}

export function DeepResearchInput({
  enabled,
  onEnabledChange,
  urls,
  onUrlsChange,
  disabled,
}: DeepResearchInputProps) {
  const [draft, setDraft] = useState("");
  const [discovering, setDiscovering] = useState(false);
  const [discoveredFor, setDiscoveredFor] = useState<string | null>(null);
  const [children, setChildren] = useState<DiscoveredChild[]>([]);
  const [selectedChildren, setSelectedChildren] = useState<Set<string>>(new Set());

  const normalizeUrl = (v: string) =>
    /^https?:\/\//i.test(v) ? v : `https://${v}`;

  const addUrl = () => {
    const v = draft.trim();
    if (!v) return;
    if (urls.length >= MAX_URLS) return;
    const normalized = normalizeUrl(v);
    if (urls.includes(normalized)) {
      setDraft("");
      return;
    }
    onUrlsChange([...urls, normalized]);
    setDraft("");
  };

  const removeUrl = (idx: number) => {
    onUrlsChange(urls.filter((_, i) => i !== idx));
  };

  const discoverSubpages = async () => {
    const v = draft.trim();
    if (!v) return;
    const normalized = normalizeUrl(v);
    setDiscovering(true);
    setChildren([]);
    setSelectedChildren(new Set());
    setDiscoveredFor(null);
    try {
      const { data, error } = await supabase.functions.invoke("discover-case-studies", {
        body: { url: normalized },
      });
      if (error) throw error;
      const found: DiscoveredChild[] = (data?.children || []).filter(
        (c: DiscoveredChild) => !urls.includes(c.url),
      );
      if (found.length === 0) {
        toast.info("No sub-pages found", {
          description: "Adding this URL as a single case study instead.",
        });
        if (urls.length < MAX_URLS && !urls.includes(normalized)) {
          onUrlsChange([...urls, normalized]);
          setDraft("");
        }
      } else {
        setChildren(found);
        setDiscoveredFor(normalized);
        // pre-select up to remaining capacity
        const remaining = MAX_URLS - urls.length;
        const preSelected = new Set(found.slice(0, remaining).map((c) => c.url));
        setSelectedChildren(preSelected);
      }
    } catch (e) {
      toast.error("Discovery failed", {
        description: e instanceof Error ? e.message : "Try adding the URL manually",
      });
    } finally {
      setDiscovering(false);
    }
  };

  const confirmSelection = () => {
    const remaining = MAX_URLS - urls.length;
    const picked = Array.from(selectedChildren).slice(0, remaining);
    if (picked.length === 0) {
      cancelDiscovery();
      return;
    }
    onUrlsChange([...urls, ...picked]);
    cancelDiscovery();
  };

  const cancelDiscovery = () => {
    setChildren([]);
    setSelectedChildren(new Set());
    setDiscoveredFor(null);
    setDraft("");
  };

  const toggleChild = (url: string) => {
    setSelectedChildren((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        const remaining = MAX_URLS - urls.length;
        if (next.size >= remaining) {
          toast.warning(`Max ${MAX_URLS} case studies — deselect one to add another`);
          return next;
        }
        next.add(url);
      }
      return next;
    });
  };

  const remainingSlots = MAX_URLS - urls.length;
  const inDiscoveryMode = children.length > 0;

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10">
      {/* Toggle header */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className={cn("w-3.5 h-3.5 shrink-0", enabled ? "text-primary" : "text-muted-foreground")} />
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground">Deep Research Mode</div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              Each case study URL becomes its own ICP persona, grounded in a real win
            </div>
          </div>
        </div>
        <Switch
          checked={enabled}
          onCheckedChange={onEnabledChange}
          disabled={disabled}
        />
      </div>

      {/* URL list (visible when enabled) */}
      {enabled && (
        <div className="border-t border-border/40 px-3 py-2.5 space-y-2">
          {urls.length > 0 && (
            <ul className="space-y-1.5">
              {urls.map((url, idx) => (
                <li
                  key={`${url}-${idx}`}
                  className="flex items-center gap-2 rounded-md bg-background/60 border border-border/40 px-2 py-1.5"
                >
                  <Link2 className="w-3 h-3 text-muted-foreground shrink-0" />
                  <span className="text-[11px] font-mono text-foreground truncate flex-1">
                    {url}
                  </span>
                  <button
                    onClick={() => removeUrl(idx)}
                    disabled={disabled}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    aria-label="Remove URL"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Discovery preview panel */}
          {inDiscoveryMode && (
            <div className="rounded-md border border-primary/30 bg-primary/5 p-2.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-[11px] font-medium text-foreground">
                  Found {children.length} case studies on this page
                </div>
                <div className="text-[10px] text-muted-foreground font-mono">
                  {selectedChildren.size}/{remainingSlots} selected
                </div>
              </div>
              <div className="text-[10px] text-muted-foreground truncate font-mono">
                {discoveredFor}
              </div>
              <ul className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {children.map((child) => {
                  const checked = selectedChildren.has(child.url);
                  return (
                    <li
                      key={child.url}
                      className="flex items-start gap-2 rounded bg-background/80 border border-border/40 px-2 py-1.5 cursor-pointer hover:border-primary/40"
                      onClick={() => toggleChild(child.url)}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggleChild(child.url)}
                        className="mt-0.5 shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <div className="min-w-0 flex-1">
                        {child.text && (
                          <div className="text-[11px] text-foreground truncate leading-tight">
                            {child.text}
                          </div>
                        )}
                        <div className="text-[10px] text-muted-foreground font-mono truncate">
                          {child.url}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="flex gap-1.5 justify-end pt-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={cancelDiscovery}
                  className="h-7 px-2 text-[11px]"
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={confirmSelection}
                  disabled={selectedChildren.size === 0}
                  className="h-7 px-2 text-[11px] gap-1"
                >
                  <Check className="w-3 h-3" /> Add {selectedChildren.size}
                </Button>
              </div>
            </div>
          )}

          {!inDiscoveryMode && urls.length < MAX_URLS && (
            <div className="space-y-1.5">
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addUrl();
                    }
                  }}
                  disabled={disabled || discovering}
                  placeholder="https://yoursite.com/customers   (or paste a hub page)"
                  className="flex-1 h-8 rounded-md border border-border/50 bg-background/60 px-2.5 text-[11px] font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={addUrl}
                  disabled={disabled || discovering || !draft.trim()}
                  className="h-8 px-2 text-[11px] gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </Button>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={discoverSubpages}
                disabled={disabled || discovering || !draft.trim()}
                className="h-7 w-full text-[11px] gap-1.5 text-primary hover:text-primary"
              >
                {discovering ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Discovering sub-pages…
                  </>
                ) : (
                  <>
                    <Compass className="w-3 h-3" /> Discover sub-pages from this URL
                  </>
                )}
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            {urls.length}/{MAX_URLS} added · One persona per URL. Paste a single case study,
            or paste a hub like <span className="font-mono">/customers</span> and use{" "}
            <span className="font-mono">Discover sub-pages</span> to auto-find individual stories.
          </p>
        </div>
      )}
    </div>
  );
}
