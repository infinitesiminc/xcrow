import { useMemo, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  ChevronDown,
  Search,
  UserCheck,
  BarChart3,
  Mail,
  Download,
  Loader2,
  Layers,
  Building2,
  Target,
  Users,
  ChevronsUpDown,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
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
  onScoreLeads?: (niche: string) => void;
  onDraftAll?: (niche: string) => void;
  onExportNiche?: (niche: string) => void;
  isFinding?: boolean;
}

interface TreeNode {
  label: string;
  description: string | null;
  nicheType: NicheType;
  leadCount: number;
  children: TreeNode[];
}

const LAYER_ICON: Record<NicheType, { icon: typeof Layers; color: string }> = {
  vertical: { icon: Building2, color: "text-primary" },
  segment: { icon: Target, color: "text-emerald-500" },
  persona: { icon: Users, color: "text-amber-500" },
};

function totalLeads(n: TreeNode): number {
  return n.leadCount + n.children.reduce((s, c) => s + totalLeads(c), 0);
}

/* ── Single tree row ── */
function TreeRow({
  node,
  depth,
  isExpanded,
  isSelected,
  onToggle,
  onSelect,
  activeNiche,
  onFindLeads,
  onScoreLeads,
  onDraftAll,
  onExportNiche,
  isFinding,
  isEnriching,
  expandedSet,
  onToggleExpand,
  onSelectNiche,
}: {
  node: TreeNode;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onSelect: () => void;
  activeNiche: string | null;
  onFindLeads?: (niche: string) => void;
  onScoreLeads?: (niche: string) => void;
  onDraftAll?: (niche: string) => void;
  onExportNiche?: (niche: string) => void;
  isFinding?: boolean;
  expandedSet: Set<string>;
  onToggleExpand: (label: string) => void;
  onSelectNiche: (niche: string | null) => void;
}) {
  const hasChildren = node.children.length > 0;
  const total = totalLeads(node);
  const config = LAYER_ICON[node.nicheType];
  const Icon = config.icon;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }}
        transition={{ duration: 0.15 }}
      >
        <button
          onClick={() => {
            onSelect();
            if (hasChildren && !isExpanded) onToggle();
          }}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-1.5 text-left rounded-md transition-colors group",
            isSelected
              ? "bg-primary/10 text-primary"
              : "hover:bg-muted/50 text-foreground"
          )}
          style={{ paddingLeft: `${12 + depth * 20}px` }}
        >
          {/* Expand/collapse chevron */}
          {hasChildren ? (
            <span
              onClick={(e) => {
                e.stopPropagation();
                onToggle();
              }}
              className="shrink-0 w-4 h-4 flex items-center justify-center cursor-pointer"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </span>
          ) : (
            <span className="w-4 shrink-0" />
          )}

          {/* Layer icon */}
          <Icon className={cn("w-3.5 h-3.5 shrink-0", config.color)} />

          {/* Label */}
          <span className={cn(
            "text-sm truncate flex-1",
            isSelected ? "font-semibold" : "font-medium"
          )}>
            {node.label}
          </span>

          {/* Lead count */}
          {total > 0 ? (
            <Badge variant="secondary" className="text-xs px-1.5 py-0 shrink-0">
              {total}
            </Badge>
          ) : (
            <span className="text-xs text-muted-foreground/40 shrink-0">—</span>
          )}
        </button>

        {/* Inline action bar for selected node */}
        {isSelected && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex items-center gap-1.5 flex-wrap overflow-hidden"
            style={{ paddingLeft: `${32 + depth * 20}px`, paddingRight: 12, paddingTop: 4, paddingBottom: 6 }}
          >
            <Button variant="default" size="sm" className="h-6 text-xs gap-1 px-2" onClick={() => onFindLeads?.(node.label)} disabled={isFinding}>
              {isFinding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Search className="w-3 h-3" />}
              Find
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2" onClick={() => onScoreLeads?.(node.label)} disabled={total === 0}>
              <BarChart3 className="w-3 h-3" /> Score
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-xs gap-1 px-2" onClick={() => onDraftAll?.(node.label)} disabled={total === 0}>
              <Mail className="w-3 h-3" /> Draft
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs gap-1 px-2 text-muted-foreground" onClick={() => onExportNiche?.(node.label)} disabled={total === 0}>
              <Download className="w-3 h-3" /> CSV
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Children */}
      <AnimatePresence>
        {isExpanded &&
          node.children.map((child) => (
            <TreeRow
              key={child.label}
              node={child}
              depth={depth + 1}
              isExpanded={expandedSet.has(child.label)}
              isSelected={activeNiche === child.label}
              onToggle={() => onToggleExpand(child.label)}
              onSelect={() => onSelectNiche(activeNiche === child.label ? null : child.label)}
              activeNiche={activeNiche}
              onFindLeads={onFindLeads}
              onEnrichLeads={onEnrichLeads}
              onScoreLeads={onScoreLeads}
              onDraftAll={onDraftAll}
              onExportNiche={onExportNiche}
              isFinding={isFinding}
              isEnriching={isEnriching}
              expandedSet={expandedSet}
              onToggleExpand={onToggleExpand}
              onSelectNiche={onSelectNiche}
            />
          ))}
      </AnimatePresence>
    </>
  );
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

    const sortNodes = (nodes: TreeNode[]) => {
      nodes.sort((a, b) => totalLeads(b) - totalLeads(a));
      for (const n of nodes) sortNodes(n.children);
    };
    sortNodes(rootNodes);

    return rootNodes;
  }, [savedNiches, leadCountMap]);

  // Expand/collapse state
  const [expandedSet, setExpandedSet] = useState<Set<string>>(() => {
    // Start with all roots expanded
    const set = new Set<string>();
    return set;
  });

  const allLabels = useMemo(() => {
    const labels: string[] = [];
    const collect = (nodes: TreeNode[]) => {
      for (const n of nodes) {
        if (n.children.length > 0) labels.push(n.label);
        collect(n.children);
      }
    };
    collect(roots);
    return labels;
  }, [roots]);

  const allExpanded = allLabels.length > 0 && allLabels.every((l) => expandedSet.has(l));

  const toggleExpand = useCallback((label: string) => {
    setExpandedSet((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    if (allExpanded) {
      setExpandedSet(new Set());
    } else {
      setExpandedSet(new Set(allLabels));
    }
  }, [allExpanded, allLabels]);

  const totalLeadCount = leads.length;

  if (roots.length === 0) {
    return (
      <div className="px-6 py-10 text-center border-b border-border/40 bg-card/30">
        <Layers className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Start a chat to discover your market niches.</p>
        <p className="text-xs text-muted-foreground/60 mt-1">The AI will map your targets into Industry → Segment → Persona layers.</p>
      </div>
    );
  }

  return (
    <div className="border-b border-border/40 bg-card/30">
      {/* Header */}
      <div className="px-3 py-2 flex items-center justify-between border-b border-border/20">
        <button
          onClick={toggleAll}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronsUpDown className="w-3.5 h-3.5" />
          {allExpanded ? "Collapse All" : "Expand All"}
        </button>
        <button
          onClick={() => onSelectNiche(null)}
          className={cn(
            "text-xs px-2 py-0.5 rounded-md transition-colors",
            !activeNiche
              ? "text-primary font-semibold bg-primary/10"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All Niches ({totalLeadCount})
        </button>
      </div>

      {/* Tree */}
      <div className="py-1 max-h-64 overflow-y-auto">
        <AnimatePresence>
          {roots.map((node) => (
            <TreeRow
              key={node.label}
              node={node}
              depth={0}
              isExpanded={expandedSet.has(node.label)}
              isSelected={activeNiche === node.label}
              onToggle={() => toggleExpand(node.label)}
              onSelect={() => onSelectNiche(activeNiche === node.label ? null : node.label)}
              activeNiche={activeNiche}
              onFindLeads={onFindLeads}
              onEnrichLeads={onEnrichLeads}
              onScoreLeads={onScoreLeads}
              onDraftAll={onDraftAll}
              onExportNiche={onExportNiche}
              isFinding={isFinding}
              isEnriching={isEnriching}
              expandedSet={expandedSet}
              onToggleExpand={toggleExpand}
              onSelectNiche={onSelectNiche}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
