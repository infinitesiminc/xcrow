import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight, Layers, Tag, PanelLeftClose, PanelLeft } from "lucide-react";
import type { SavedLead } from "./useLeadsCRUD";

interface NicheSidebarProps {
  leads: SavedLead[];
  activeNiche: string | null; // null = "All"
  onSelectNiche: (niche: string | null) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

interface NicheGroup {
  tag: string;
  count: number;
  statuses: Record<string, number>;
}

export function NicheSidebar({ leads, activeNiche, onSelectNiche, collapsed, onToggleCollapse }: NicheSidebarProps) {
  const niches = useMemo(() => {
    const map = new Map<string, NicheGroup>();
    for (const l of leads) {
      const tag = l.niche_tag || "Uncategorized";
      const existing = map.get(tag);
      if (existing) {
        existing.count++;
        existing.statuses[l.status] = (existing.statuses[l.status] || 0) + 1;
      } else {
        map.set(tag, { tag, count: 1, statuses: { [l.status]: 1 } });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, [leads]);

  if (collapsed) {
    return (
      <div className="w-10 border-r border-border/40 bg-card/20 flex flex-col items-center py-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 mb-3" onClick={onToggleCollapse}>
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center gap-2 mt-1">
          {niches.slice(0, 8).map((n) => (
            <button
              key={n.tag}
              onClick={() => onSelectNiche(activeNiche === n.tag ? null : n.tag)}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold transition-colors",
                activeNiche === n.tag
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              )}
              title={n.tag}
            >
              {n.tag.charAt(0).toUpperCase()}
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
          {niches.map((n) => {
            const isActive = activeNiche === n.tag;
            const newCount = n.statuses["new"] || 0;
            const contactedCount = (n.statuses["contacted"] || 0) + (n.statuses["replied"] || 0) + (n.statuses["won"] || 0);

            return (
              <button
                key={n.tag}
                onClick={() => onSelectNiche(isActive ? null : n.tag)}
                className={cn(
                  "w-full flex items-center gap-2 px-2.5 py-2 rounded-md text-xs transition-colors text-left group",
                  isActive
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                )}
              >
                <div className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isActive ? "bg-primary" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
                )} />
                <span className="truncate flex-1">{n.tag}</span>
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4 shrink-0">
                  {n.count}
                </Badge>
              </button>
            );
          })}

          {niches.length === 0 && (
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
