import { useMemo } from "react";
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
  Layers,
  Building2,
  Users,
  Briefcase,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { NicheEntry, NicheType } from "./useLeadsCRUD";

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

interface TreeNode {
  label: string;
  description: string | null;
  nicheType: NicheType;
  leadCount: number;
  children: TreeNode[];
}

const LAYER_CONFIG: Record<NicheType, { label: string; icon: typeof Layers; color: string }> = {
  vertical: { label: "Industry Verticals", icon: Building2, color: "text-primary" },
  segment: { label: "Company Segments", icon: Target, color: "text-emerald-500" },
  persona: { label: "Buyer Personas", icon: Users, color: "text-amber-500" },
};

const LAYER_ORDER: NicheType[] = ["vertical", "segment", "persona"];

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
  // Build lead count map
  const leadCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const l of leads) {
      const tag = l.niche_tag || "Uncategorized";
      m.set(tag, (m.get(tag) || 0) + 1);
    }
    return m;
  }, [leads]);

  // Build tree
  const roots = useMemo(() => {
    const allNiches = new Map<string, { label: string; description: string | null; parent: string | null; nicheType: NicheType; leadCount: number }>();
    for (const n of savedNiches) {
      allNiches.set(n.label, {
        label: n.label,
        description: n.description,
        parent: n.parent_label || null,
        nicheType: (n.niche_type as NicheType) || "vertical",
        leadCount: leadCountMap.get(n.label) || 0,
      });
    }
    // Add any lead tags not in saved niches
    for (const [tag, count] of leadCountMap) {
      if (!allNiches.has(tag)) {
        allNiches.set(tag, { label: tag, description: null, parent: null, nicheType: "vertical", leadCount: count });
      }
    }

    const childrenMap = new Map<string, TreeNode[]>();
    const rootNodes: TreeNode[] = [];

    for (const n of allNiches.values()) {
      const node: TreeNode = { label: n.label, description: n.description, nicheType: n.nicheType, leadCount: n.leadCount, children: [] };
      if (n.parent) {
        if (!childrenMap.has(n.parent)) childrenMap.set(n.parent, []);
        childrenMap.get(n.parent)!.push(node);
      } else {
        rootNodes.push(node);
      }
    }

    const attach = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        node.children = childrenMap.get(node.label) || [];
        attach(node.children);
      }
    };
    attach(rootNodes);

    // Sort by total leads desc
    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => {
        const totalLeads = (n: TreeNode): number => n.leadCount + n.children.reduce((s, c) => s + totalLeads(c), 0);
        return totalLeads(b) - totalLeads(a);
      });
      for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [savedNiches, leadCountMap]);

  // Build breadcrumb path to active niche
  const breadcrumbs = useMemo(() => {
    if (!activeNiche) return [];
    const parentMap = new Map<string, string>();
    for (const n of savedNiches) {
      if (n.parent_label) parentMap.set(n.label, n.parent_label);
    }
    const path: string[] = [];
    let current: string | undefined = activeNiche;
    while (current) {
      path.unshift(current);
      current = parentMap.get(current);
    }
    return path;
  }, [activeNiche, savedNiches]);

  // Determine visible layers: always show verticals, then children of selected path
  const visibleLayers = useMemo(() => {
    const layers: { type: NicheType; nodes: TreeNode[]; parentLabel: string | null }[] = [];

    // Layer 1: all roots (verticals)
    layers.push({ type: "vertical", nodes: roots, parentLabel: null });

    // If a vertical is selected, show its children (segments)
    if (breadcrumbs.length >= 1) {
      const selectedVertical = roots.find((n) => n.label === breadcrumbs[0]);
      if (selectedVertical && selectedVertical.children.length > 0) {
        layers.push({ type: "segment", nodes: selectedVertical.children, parentLabel: selectedVertical.label });
      }
    }

    // If a segment is selected, show its children (personas)
    if (breadcrumbs.length >= 2) {
      const selectedVertical = roots.find((n) => n.label === breadcrumbs[0]);
      const selectedSegment = selectedVertical?.children.find((n) => n.label === breadcrumbs[1]);
      if (selectedSegment && selectedSegment.children.length > 0) {
        layers.push({ type: "persona", nodes: selectedSegment.children, parentLabel: selectedSegment.label });
      }
    }

    return layers;
  }, [roots, breadcrumbs]);

  // Active node details
  const activeNode = useMemo(() => {
    if (!activeNiche) return null;
    const find = (nodes: TreeNode[]): TreeNode | null => {
      for (const n of nodes) {
        if (n.label === activeNiche) return n;
        const found = find(n.children);
        if (found) return found;
      }
      return null;
    };
    return find(roots);
  }, [activeNiche, roots]);

  const totalLeadsForActive = useMemo(() => {
    if (!activeNode) return leads.length;
    const count = (n: TreeNode): number => n.leadCount + n.children.reduce((s, c) => s + count(c), 0);
    return count(activeNode);
  }, [activeNode, leads.length]);

  if (roots.length === 0) {
    return (
      <div className="px-6 py-10 text-center border-b border-border/40 bg-card/30">
        <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Start a chat to discover your market niches.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">The AI will map your ICP into Industry → Segment → Persona layers.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border/40 bg-card/30">
      {/* Breadcrumb navigation */}
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
        {breadcrumbs.map((crumb) => (
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

      {/* Tree layers */}
      <div className="px-4 pb-3 space-y-1">
        {visibleLayers.map((layer, layerIdx) => {
          const config = LAYER_CONFIG[layer.type];
          const LayerIcon = config.icon;
          const isLastLayer = layerIdx === visibleLayers.length - 1;

          return (
            <div key={`${layer.type}-${layer.parentLabel || "root"}`}>
              {/* Layer header */}
              <div className="flex items-center gap-2 py-1.5">
                <LayerIcon className={cn("w-3.5 h-3.5", config.color)} />
                <span className={cn("text-xs font-semibold uppercase tracking-wider", config.color)}>
                  {config.label}
                </span>
                <div className="flex-1 h-px bg-border/30" />
              </div>

              {/* Connector line from parent */}
              {layerIdx > 0 && (
                <div className="flex justify-center -mt-1 mb-1">
                  <div className="w-px h-3 bg-border/50" />
                </div>
              )}

              {/* Cards grid */}
              <ScrollArea className="w-full">
                <div className="flex gap-2.5 pb-2 overflow-x-auto">
                  <AnimatePresence mode="popLayout">
                    {layer.nodes.map((node, idx) => {
                      const totalLeads = node.leadCount + node.children.reduce((s, c) => s + c.leadCount, 0);
                      const hasChildren = node.children.length > 0;
                      const isSelected = breadcrumbs.includes(node.label);
                      const isActive = activeNiche === node.label;

                      return (
                        <motion.button
                          key={node.label}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ delay: idx * 0.03 }}
                          onClick={() => onSelectNiche(isActive ? null : node.label)}
                          className={cn(
                            "flex-shrink-0 w-48 rounded-lg border p-3 text-left transition-all group",
                            isActive
                              ? "border-primary bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20"
                              : isSelected
                                ? "border-primary/40 bg-primary/5"
                                : totalLeads > 0
                                  ? "border-border/60 bg-card/60 hover:border-primary/40 hover:shadow-sm"
                                  : "border-dashed border-border/40 bg-card/20 hover:border-border/60 hover:bg-card/40"
                          )}
                        >
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <h4 className={cn(
                              "text-xs font-semibold leading-tight line-clamp-2",
                              isActive ? "text-primary" : "text-foreground"
                            )}>
                              {node.label}
                            </h4>
                            {hasChildren && (
                              <ChevronRight className={cn(
                                "w-3 h-3 shrink-0 mt-0.5 transition-transform",
                                isActive ? "text-primary rotate-90" : "text-muted-foreground"
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
                                {node.children.length} {LAYER_ORDER[LAYER_ORDER.indexOf(node.nicheType) + 1] === "segment" ? "segments" : "personas"}
                              </span>
                            )}
                          </div>
                        </motion.button>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      {/* Action bar for active niche */}
      {activeNiche && activeNode && (
        <div className="px-4 py-2.5 flex items-center gap-3 flex-wrap border-t border-border/30 bg-card/50">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
              <Briefcase className="w-3.5 h-3.5 text-primary" />
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
    </div>
  );
}
