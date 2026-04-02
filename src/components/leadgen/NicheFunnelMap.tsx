import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ChevronRight,
  Search,
  UserCheck,
  BarChart3,
  Mail,
  Download,
  Loader2,
  Target,
  ArrowRight,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NicheEntry } from "./useLeadsCRUD";

interface NicheLeadLike {
  niche_tag?: string | null;
}

interface NicheFunnelMapProps {
  leads: NicheLeadLike[];
  savedNiches?: NicheEntry[];
  activeNiche: string | null;
  onSelectNiche: (niche: string | null) => void;
  onFindLeads?: (niche: string) => void;
  onEnrichLeads?: (niche: string) => void;
  onScoreLeads?: (niche: string) => void;
  onDraftAll?: (niche: string) => void;
  onExportNiche?: (niche: string) => void;
  isFinding?: boolean;
  isEnriching?: boolean;
}

interface FunnelNode {
  label: string;
  description: string | null;
  leadCount: number;
  children: FunnelNode[];
}

export function NicheFunnelMap({
  leads,
  savedNiches = [],
  activeNiche,
  onSelectNiche,
  onFindLeads,
  onEnrichLeads,
  onScoreLeads,
  onDraftAll,
  onExportNiche,
  isFinding,
  isEnriching,
}: NicheFunnelMapProps) {
  // Build tree from flat niches
  const { roots, childrenMap, leadCountMap } = useMemo(() => {
    const lcm = new Map<string, number>();
    for (const l of leads) {
      const tag = l.niche_tag || "Uncategorized";
      lcm.set(tag, (lcm.get(tag) || 0) + 1);
    }

    const allNiches = new Map<string, { label: string; description: string | null; parent: string | null; leadCount: number }>();
    for (const n of savedNiches) {
      allNiches.set(n.label, {
        label: n.label,
        description: n.description,
        parent: n.parent_label || null,
        leadCount: lcm.get(n.label) || 0,
      });
    }
    for (const [tag, count] of lcm) {
      if (!allNiches.has(tag)) {
        allNiches.set(tag, { label: tag, description: null, parent: null, leadCount: count });
      }
    }

    const cmap = new Map<string, FunnelNode[]>();
    const rootNodes: FunnelNode[] = [];

    for (const n of allNiches.values()) {
      const node: FunnelNode = { label: n.label, description: n.description, leadCount: n.leadCount, children: [] };
      if (n.parent) {
        if (!cmap.has(n.parent)) cmap.set(n.parent, []);
        cmap.get(n.parent)!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    const attach = (nodes: FunnelNode[]) => {
      for (const node of nodes) {
        node.children = cmap.get(node.label) || [];
        attach(node.children);
      }
    };
    attach(rootNodes);

    // Sort by lead count desc
    const sortNodes = (nodes: FunnelNode[]) => {
      nodes.sort((a, b) => {
        const aTotal = a.leadCount + a.children.reduce((s, c) => s + c.leadCount, 0);
        const bTotal = b.leadCount + b.children.reduce((s, c) => s + c.leadCount, 0);
        return bTotal - aTotal;
      });
      for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(rootNodes);

    return { roots: rootNodes, childrenMap: cmap, leadCountMap: lcm };
  }, [leads, savedNiches]);

  // Build breadcrumb path to active niche
  const breadcrumbs = useMemo(() => {
    if (!activeNiche) return [];
    const path: string[] = [];
    let current = activeNiche;
    const parentMap = new Map<string, string>();
    for (const n of savedNiches) {
      if (n.parent_label) parentMap.set(n.label, n.parent_label);
    }
    while (current) {
      path.unshift(current);
      current = parentMap.get(current) || "";
      if (!current) break;
    }
    return path;
  }, [activeNiche, savedNiches]);

  // Determine which level to show
  const currentChildren = useMemo(() => {
    if (!activeNiche) return roots;
    const findChildren = (nodes: FunnelNode[]): FunnelNode[] | null => {
      for (const n of nodes) {
        if (n.label === activeNiche) return n.children;
        const found = findChildren(n.children);
        if (found) return found;
      }
      return null;
    };
    return findChildren(roots) || [];
  }, [activeNiche, roots]);

  const activeNode = useMemo(() => {
    if (!activeNiche) return null;
    const find = (nodes: FunnelNode[]): FunnelNode | null => {
      for (const n of nodes) {
        if (n.label === activeNiche) return n;
        const found = find(n.children);
        if (found) return found;
      }
      return null;
    };
    return find(roots);
  }, [activeNiche, roots]);

  const totalLeadsForActive = activeNode
    ? activeNode.leadCount + activeNode.children.reduce((s, c) => s + c.leadCount, 0)
    : leads.length;

  if (roots.length === 0) {
    return (
      <div className="px-6 py-8 text-center">
        <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Start a chat to discover your market niches.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">Each AI conversation builds your funnel map.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border/40 bg-card/30">
      {/* Breadcrumbs */}
      <div className="px-4 pt-3 pb-1 flex items-center gap-1 text-xs flex-wrap">
        <button
          onClick={() => onSelectNiche(null)}
          className={cn(
            "px-2 py-0.5 rounded-md transition-colors font-medium",
            !activeNiche ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All Markets
        </button>
        {breadcrumbs.map((crumb, i) => (
          <span key={crumb} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
            <button
              onClick={() => onSelectNiche(crumb)}
              className={cn(
                "px-2 py-0.5 rounded-md transition-colors",
                crumb === activeNiche
                  ? "text-primary font-medium bg-primary/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {crumb}
            </button>
          </span>
        ))}
      </div>

      {/* Active niche action bar */}
      {activeNiche && activeNode && (
        <div className="px-4 py-2 flex items-center gap-3 flex-wrap border-t border-border/20 mt-1">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-3.5 h-3.5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">{activeNiche}</p>
              {activeNode.description && (
                <p className="text-xs text-muted-foreground truncate max-w-sm">{activeNode.description}</p>
              )}
            </div>
            <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
              {totalLeadsForActive} leads
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            <Button variant="default" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onFindLeads?.(activeNiche)} disabled={isFinding}>
              {isFinding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Find Leads
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onEnrichLeads?.(activeNiche)} disabled={isEnriching || totalLeadsForActive === 0}>
              {isEnriching ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
              Enrich
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onScoreLeads?.(activeNiche)} disabled={totalLeadsForActive === 0}>
              <BarChart3 className="w-3 h-3" /> Score
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5" onClick={() => onDraftAll?.(activeNiche)} disabled={totalLeadsForActive === 0}>
              <Mail className="w-3 h-3" /> Draft
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-muted-foreground" onClick={() => onExportNiche?.(activeNiche)} disabled={totalLeadsForActive === 0}>
              <Download className="w-3 h-3" /> CSV
            </Button>
          </div>
        </div>
      )}

      {/* Funnel cards grid */}
      {currentChildren.length > 0 && (
        <ScrollArea className="w-full">
          <div className="px-4 py-3 flex gap-3 overflow-x-auto pb-3">
            <AnimatePresence mode="popLayout">
              {currentChildren.map((node, idx) => {
                const totalLeads = node.leadCount + node.children.reduce((s, c) => s + c.leadCount, 0);
                const hasChildren = node.children.length > 0;
                const isActive = activeNiche === node.label;

                return (
                  <motion.button
                    key={node.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.04 }}
                    onClick={() => onSelectNiche(isActive ? null : node.label)}
                    className={cn(
                      "flex-shrink-0 w-52 rounded-xl border p-3 text-left transition-all group relative overflow-hidden",
                      isActive
                        ? "border-primary bg-primary/5 shadow-md shadow-primary/10"
                        : totalLeads > 0
                          ? "border-border/60 bg-card/60 hover:border-primary/40 hover:shadow-sm"
                          : "border-dashed border-border/40 bg-card/20 hover:border-border/60 hover:bg-card/40"
                    )}
                  >
                    {/* Connector line indicator */}
                    <div className={cn(
                      "absolute top-0 left-1/2 -translate-x-1/2 w-px h-2",
                      isActive ? "bg-primary" : "bg-border/60"
                    )} />

                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className={cn(
                        "text-xs font-semibold leading-tight line-clamp-2",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {node.label}
                      </h4>
                      {hasChildren && (
                        <ChevronRight className={cn(
                          "w-3.5 h-3.5 shrink-0 mt-0.5 transition-transform",
                          isActive ? "text-primary rotate-90" : "text-muted-foreground group-hover:translate-x-0.5"
                        )} />
                      )}
                    </div>

                    {node.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">
                        {node.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between">
                      {totalLeads > 0 ? (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0">
                          {totalLeads} leads
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground/50 italic">explore</span>
                      )}
                      {hasChildren && (
                        <span className="text-xs text-muted-foreground/60">
                          {node.children.length} sub-niches
                        </span>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>
      )}

      {/* No sub-niches message when drilled into a leaf */}
      {activeNiche && currentChildren.length === 0 && (
        <div className="px-4 py-3 flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowRight className="w-3 h-3" />
          <span>This is a leaf niche — use the action buttons above to find leads, or chat to discover sub-segments.</span>
        </div>
      )}
    </div>
  );
}
