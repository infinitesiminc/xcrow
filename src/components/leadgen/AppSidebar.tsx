import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Globe, Layers, Tag, ChevronRight, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import type { NicheEntry } from "./useLeadsCRUD";

interface NicheLeadLike {
  niche_tag?: string | null;
}

interface TreeNiche {
  label: string;
  description: string | null;
  leadCount: number;
  isPlaceholder: boolean;
  children: TreeNiche[];
}

interface AppSidebarProps {
  leads: NicheLeadLike[];
  savedNiches?: NicheEntry[];
  activeNiche: string | null;
  onSelectNiche: (niche: string | null) => void;
  companySummary?: string;
  websiteUrl?: string;
}

export function AppSidebar({
  leads,
  savedNiches = [],
  activeNiche,
  onSelectNiche,
  companySummary,
  websiteUrl,
}: AppSidebarProps) {
  const navigate = useNavigate();

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

  const renderNicheNode = (n: TreeNiche, depth: number) => {
    const isActive = activeNiche === n.label;
    const totalLeads = n.leadCount + n.children.reduce((s, c) => s + c.leadCount, 0);
    const hasChildren = n.children.length > 0;

    return (
      <div key={n.label}>
        <button
          onClick={() => onSelectNiche(isActive ? null : n.label)}
          className={cn(
            "w-full flex items-center gap-2 py-1.5 rounded-md text-xs transition-colors text-left",
            isActive
              ? "bg-primary/10 text-primary font-medium"
              : n.isPlaceholder && !hasChildren
                ? "text-muted-foreground/60 hover:bg-muted/30"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          )}
          style={{ paddingLeft: `${8 + depth * 14}px`, paddingRight: "8px" }}
          title={n.description || undefined}
        >
          {hasChildren ? (
            <ChevronRight className={cn("w-3 h-3 shrink-0 transition-transform", isActive && "rotate-90")} />
          ) : (
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              isActive ? "bg-primary" : "bg-muted-foreground/30"
            )} />
          )}
          <span className="truncate flex-1">{n.label}</span>
          {totalLeads > 0 ? (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
              {totalLeads}
            </Badge>
          ) : (
            <span className="text-[10px] text-muted-foreground/40 italic shrink-0">explore</span>
          )}
        </button>
        {hasChildren && (
          <div>
            {n.children.map((child) => renderNicheNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Sidebar collapsible="icon">
      {/* Company Header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              {companySummary || "Lead Hunter"}
            </p>
            {websiteUrl && (
              <p className="text-[10px] text-muted-foreground truncate">
                {websiteUrl.replace(/^https?:\/\//, "").replace(/\/$/, "")}
              </p>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>
            <Layers className="w-3.5 h-3.5 mr-1.5" />
            ICP Niches
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {/* All Leads item */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={activeNiche === null}
                  onClick={() => onSelectNiche(null)}
                  tooltip="All Leads"
                >
                  <Tag className="w-4 h-4" />
                  <span>All Leads</span>
                  <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                    {leads.length}
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>

            {/* Niche Tree */}
            <div className="px-1 mt-1 group-data-[collapsible=icon]:hidden">
              <ScrollArea className="max-h-[calc(100vh-280px)]">
                {nicheTree.map((n) => renderNicheNode(n, 0))}
                {nicheTree.length === 0 && (
                  <div className="px-2 py-6 text-center">
                    <Layers className="w-5 h-5 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-[10px] text-muted-foreground/60">
                      Niches appear after ICP discovery
                    </p>
                  </div>
                )}
              </ScrollArea>
            </div>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={() => navigate("/settings")} tooltip="Settings">
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
