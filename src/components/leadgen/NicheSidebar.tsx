import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Layers, Tag, PanelLeftClose, PanelLeft, ChevronRight } from "lucide-react";
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

interface TreeNiche {
  label: string;
  description: string | null;
  leadCount: number;
  isPlaceholder: boolean;
  children: TreeNiche[];
}

export function NicheSidebar({
  leads,
  savedNiches = [],
  activeNiche,
  onSelectNiche,
  collapsed,
  onToggleCollapse,
}: NicheSidebarProps) {
  const nicheTree = useMemo(() => {
    const leadCountMap = new Map<string, number>();
    for (const l of leads) {
      const tag = l.niche_tag || "Uncategorized";
      leadCountMap.set(tag, (leadCountMap.get(tag) || 0) + 1);
    }

    const allNiches = new Map<string, { label: string; description: string | null; parent: string | null; leadCount: number }>();
    for (const n of savedNiches) {
      allNiches.set(n.label, {
        label: n.label,
        description: n.description,
        parent: n.parent_label || null,
        leadCount: leadCountMap.get(n.label) || 0,
      });
    }

    for (const [tag, count] of leadCountMap) {
      if (!allNiches.has(tag)) {
        allNiches.set(tag, { label: tag, description: null, parent: null, leadCount: count });
      }
    }

    const rootNiches: TreeNiche[] = [];
    const childrenMap = new Map<string, TreeNiche[]>();

    for (const n of allNiches.values()) {
      const node: TreeNiche = {
        label: n.label,
        description: n.description,
        leadCount: n.leadCount,
        isPlaceholder: n.leadCount === 0,
        children: [],
      };

      if (n.parent) {
        if (!childrenMap.has(n.parent)) childrenMap.set(n.parent, []);
        childrenMap.get(n.parent)!.push(node);
      } else {
        rootNiches.push(node);
      }
    }

    const attachChildren = (nodes: TreeNiche[]) => {
      for (const node of nodes) {
        node.children = childrenMap.get(node.label) || [];
        attachChildren(node.children);
      }
    };
    attachChildren(rootNiches);

    const sortNodes = (nodes: TreeNiche[]) => {
      nodes.sort((a, b) => {
        const aTotal = a.leadCount + a.children.reduce((s, c) => s + c.leadCount, 0);
        const bTotal = b.leadCount + b.children.reduce((s, c) => s + c.leadCount, 0);
        if (aTotal > 0 && bTotal === 0) return -1;
        if (aTotal === 0 && bTotal > 0) return 1;
        return bTotal - aTotal;
      });
      for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(rootNiches);

    return rootNiches;
  }, [leads, savedNiches]);

  if (collapsed) {
    return (
      <div className="w-10 border-r border-border/40 bg-card/20 flex flex-col items-center py-3 shrink-0">
        <Button variant="ghost" size="icon" className="h-7 w-7 mb-3" onClick={onToggleCollapse}>
          <PanelLeft className="w-4 h-4" />
        </Button>
        <div className="flex flex-col items-center gap-2 mt-1">
          {nicheTree.slice(0, 8).map((n) => (
            <button
              key={n.label}
              onClick={() => onSelectNiche(activeNiche === n.label ? null : n.label)}
              className={cn(
                "w-7 h-7 rounded-md flex items-center justify-center text-xs font-bold transition-colors",
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

  const renderNicheNode = (n: TreeNiche, depth: number) => {
    const isActive = activeNiche === n.label;
    const totalLeads = n.leadCount + n.children.reduce((s, c) => s + c.leadCount, 0);
    const hasChildren = n.children.length > 0;

    return (
      <div key={n.label}>
        <button
          onClick={() => onSelectNiche(isActive ? null : n.label)}
          className={cn(
            "w-full flex items-center gap-2 py-2 rounded-md text-xs transition-colors text-left group",
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : n.isPlaceholder && !hasChildren
                ? "text-muted-foreground/60 hover:bg-muted/30 hover:text-muted-foreground border border-dashed border-transparent hover:border-border/30"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          )}
          style={{ paddingLeft: `${10 + depth * 12}px`, paddingRight: "10px" }}
          title={n.description || undefined}
        >
          {hasChildren ? (
            <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", isActive && "rotate-90")} />
          ) : (
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              isActive ? "bg-primary" : n.isPlaceholder ? "bg-muted-foreground/20" : "bg-muted-foreground/30 group-hover:bg-muted-foreground/50"
            )} />
          )}
          <span className="truncate flex-1">{n.label}</span>
          {totalLeads > 0 ? (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 shrink-0">
              {totalLeads}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/40 italic shrink-0">explore</span>
          )}
        </button>
        {hasChildren && (
          <div className="ml-0">
            {n.children.map((child) => renderNicheNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-56 border-r border-border/40 bg-card/20 flex flex-col shrink-0">
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
            <Badge variant="secondary" className="text-xs px-1.5 py-0 h-4 shrink-0">
              {leads.length}
            </Badge>
          </button>

          {nicheTree.map((n) => renderNicheNode(n, 0))}

          {nicheTree.length === 0 && (
            <div className="px-2.5 py-6 text-center space-y-2">
              <Layers className="w-6 h-6 text-muted-foreground/30 mx-auto" />
              <p className="text-xs text-muted-foreground/60">
                Niches appear here as you discover leads via chat.
              </p>
              <p className="text-xs text-muted-foreground/40">
                Each search branch is saved automatically.
              </p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
