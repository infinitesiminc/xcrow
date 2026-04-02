import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Layers, Tag, PanelLeftClose, PanelLeft } from "lucide-react";
import type { NicheEntry } from "./useLeadsCRUD";

interface NicheLeadLike {
  niche_tag?: string | null;
}

interface NicheSidebarProps {
  leads: NicheLeadLike[];
  savedNiches?: NicheEntry[];
  activeNiche: string | null;
  onSelectNiche: (niche: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface MergedNiche {
  label: string;
  description: string | null;
  leadCount: number;
  isPlaceholder: boolean; // true = from DB with 0 leads matched
}

export function NicheSidebar({ leads, savedNiches = [], activeNiche, onSelectNiche, collapsed, onToggleCollapse }: NicheSidebarProps) {
  const mergedNiches = useMemo(() => {
    // Count leads per niche_tag
    const leadCountMap = new Map<string, number>();
    for (const l of leads) {
      const tag = l.niche_tag || "Uncategorized";
      leadCountMap.set(tag, (leadCountMap.get(tag) || 0) + 1);
    }

    // Start with saved niches from DB
    const nicheMap = new Map<string, MergedNiche>();
    for (const n of savedNiches) {
      const count = leadCountMap.get(n.label) || 0;
      nicheMap.set(n.label, {
        label: n.label,
        description: n.description,
        leadCount: count,
        isPlaceholder: count === 0,
      });
    }

    // Add any lead-derived niches not in savedNiches
    for (const [tag, count] of leadCountMap) {
      if (!nicheMap.has(tag)) {
        nicheMap.set(tag, {
          label: tag,
          description: null,
          leadCount: count,
          isPlaceholder: false,
        });
      }
    }

    return Array.from(nicheMap.values()).sort((a, b) => {
      // Active niches with leads first, then placeholders
      if (a.leadCount > 0 && b.leadCount === 0) return -1;
      if (a.leadCount === 0 && b.leadCount > 0) return 1;
      return b.leadCount - a.leadCount;
    });
  }, [leads, savedNiches]);

  if (collapsed) {
    return (
      <div className="w-10 border-r border-border/40 bg-card/20 flex flex-col items-center py-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 mb-3" onClick={onToggleCollapse}>
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center gap-2 mt-1">
          {mergedNiches.slice(0, 8).map((n) => (
            <button
              key={n.label}
              onClick={() => onSelectNiche(activeNiche === n.label ? null : n.label)}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors",
                activeNiche === n.label
                  ? "bg-primary text-primary-foreground"
                  : n.isPlaceholder
                    ? "bg-muted/30 text-muted-foreground/50 hover:bg-muted/50 border border-dashed border-border/40"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
              title={n.label}
            >
              {n.label.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-56 border-r border-border/40 bg-card/20 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-border/40 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground">Niches</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onToggleCollapse}>
          <PanelLeftClose className="w-3.5 h-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-0.5">
          {/* All niches */}
          <button
            onClick={() => onSelectNiche(null)}
            className={cn(
              "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors text-left",
              activeNiche === null
                ? "bg-primary/10 text-primary font-medium"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Tag className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate flex-1">All Niches</span>
            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
              {leads.length}
            </Badge>
          </button>

          {/* Individual niches */}
          {mergedNiches.map((n) => {
            const isActive = activeNiche === n.label;

            return (
              <button
                key={n.label}
                onClick={() => onSelectNiche(isActive ? null : n.label)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors text-left group",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : n.isPlaceholder
                      ? "text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground border border-dashed border-transparent hover:border-border/30"
                      : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
                title={n.description || undefined}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isActive ? "bg-primary" : n.isPlaceholder ? "bg-muted-foreground/20" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                )} />
                <span className="truncate flex-1">{n.label}</span>
                {n.leadCount > 0 ? (
                  <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                    {n.leadCount}
                  </Badge>
                ) : (
                  <span className="text-[9px] text-muted-foreground/40 italic shrink-0">explore</span>
                )}
              </button>
            );
          })}

          {mergedNiches.length === 0 && (
            <div className="px-2.5 py-6 text-center space-y-2">
              <Layers className="w-6 h-6 text-muted-foreground/30 mx-auto" />
              <p className="text-[11px] text-muted-foreground/60">
                Niches appear here as you discover leads via chat.
              </p>
              <p className="text-[10px] text-muted-foreground/40">
                Each search branch is saved automatically.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
