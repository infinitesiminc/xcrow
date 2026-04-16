import { useState } from "react";
import { Sparkles, Plus, X, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";

interface DeepResearchInputProps {
  enabled: boolean;
  onEnabledChange: (v: boolean) => void;
  urls: string[];
  onUrlsChange: (urls: string[]) => void;
  disabled?: boolean;
}

const MAX_URLS = 5;

export function DeepResearchInput({
  enabled,
  onEnabledChange,
  urls,
  onUrlsChange,
  disabled,
}: DeepResearchInputProps) {
  const [draft, setDraft] = useState("");

  const addUrl = () => {
    const v = draft.trim();
    if (!v) return;
    if (urls.length >= MAX_URLS) return;
    if (!/^https?:\/\//i.test(v)) {
      onUrlsChange([...urls, `https://${v}`]);
    } else {
      onUrlsChange([...urls, v]);
    }
    setDraft("");
  };

  const removeUrl = (idx: number) => {
    onUrlsChange(urls.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-lg border border-border/50 bg-muted/10">
      {/* Toggle header */}
      <div className="flex items-center justify-between gap-3 px-3 py-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className={cn("w-3.5 h-3.5 shrink-0", enabled ? "text-primary" : "text-muted-foreground")} />
          <div className="min-w-0">
            <div className="text-xs font-medium text-foreground">Deep Research Mode</div>
            <div className="text-[10px] text-muted-foreground leading-tight">
              Add customer case studies — AI will ground personas in proven wins
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

          {urls.length < MAX_URLS && (
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
                disabled={disabled}
                placeholder="https://yoursite.com/customers/acme-case-study"
                className="flex-1 h-8 rounded-md border border-border/50 bg-background/60 px-2.5 text-[11px] font-mono placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={addUrl}
                disabled={disabled || !draft.trim()}
                className="h-8 px-2 text-[11px] gap-1"
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>
          )}

          <p className="text-[10px] text-muted-foreground/80 leading-relaxed">
            {urls.length}/{MAX_URLS} added · Paste links to your customer success stories,
            testimonials, or competitor case studies. AI will extract real buyer titles,
            industries, and triggers from these wins.
          </p>
        </div>
      )}
    </div>
  );
}
