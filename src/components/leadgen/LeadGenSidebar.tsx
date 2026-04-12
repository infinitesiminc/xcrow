import { useNavigate } from "react-router-dom";
import { Search, Users, TableProperties, Settings, Globe, Plus, Building2, RotateCcw, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { UserWorkspace } from "@/hooks/use-workspaces";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from "@/components/ui/sidebar";

export type SidebarSection = "research" | "personas" | "leads";

interface LeadGenSidebarProps {
  activeSection: SidebarSection;
  onSelectSection: (s: SidebarSection) => void;
  websiteUrl?: string;
  personaCount?: number;
  leadCount?: number;
  outreachCount?: number;
  researchComplete?: boolean;
  workspaces?: UserWorkspace[];
  activeWorkspaceKey?: string;
  onSelectWorkspace?: (key: string) => void;
  onNewResearch?: () => void;
  onDeleteWorkspace?: (key: string) => void;
  onRerunWorkspace?: (key: string) => void;
}

const NAV_ITEMS: { id: SidebarSection; label: string; icon: typeof Search; }[] = [
  { id: "research", label: "Research", icon: Search },
  { id: "personas", label: "Personas", icon: Users },
  { id: "leads", label: "Leads", icon: TableProperties },
];

export function LeadGenSidebar({
  activeSection,
  onSelectSection,
  websiteUrl,
  personaCount = 0,
  leadCount = 0,
  outreachCount = 0,
  researchComplete,
  workspaces = [],
  activeWorkspaceKey,
  onSelectWorkspace,
  onNewResearch,
  onDeleteWorkspace,
  onRerunWorkspace,
}: LeadGenSidebarProps) {
  const navigate = useNavigate();

  const activeWorkspace = workspaces.find(w => w.website_key === activeWorkspaceKey);
  const displayDomain = activeWorkspaceKey || websiteUrl?.replace(/^https?:\/\//, "").replace(/\/$/, "");

  const getBadge = (id: SidebarSection) => {
    if (id === "personas" && personaCount > 0) return personaCount;
    if (id === "leads" && leadCount > 0) return leadCount;
    
    return null;
  };

  return (
    <Sidebar collapsible="icon">
      {/* Active workspace header */}
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2.5 px-1">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
            displayDomain ? "bg-primary/10 ring-1 ring-primary/20" : "bg-muted"
          )}>
            {activeWorkspace?.logo_url ? (
              <img src={activeWorkspace.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
            ) : displayDomain ? (
              <Globe className="w-4 h-4 text-primary" />
            ) : (
              <Globe className="w-4 h-4 text-muted-foreground" />
            )}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            {displayDomain ? (
              <>
                <p className="text-base font-bold text-sidebar-foreground truncate leading-tight">
                  {activeWorkspace?.display_name || displayDomain}
                </p>
                <p className="text-[10px] text-primary/70 font-mono truncate">Active workspace</p>
              </>
            ) : (
              <>
                <p className="text-base font-bold text-sidebar-foreground">Lead Gen</p>
                <p className="text-[10px] text-muted-foreground">No workspace selected</p>
              </>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Workspaces — top section */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Workspaces</span>
            <button
              onClick={onNewResearch}
              className="p-0.5 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors group-data-[collapsible=icon]:hidden"
              title="Start new research"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <ScrollArea className="max-h-[240px]">
              <SidebarMenu>
                {workspaces.map((ws) => {
                  const isActive = activeWorkspaceKey === ws.website_key;
                  return (
                    <SidebarMenuItem key={ws.website_key}>
                      <div className="flex items-center group/ws">
                        <SidebarMenuButton
                          isActive={isActive}
                          onClick={() => onSelectWorkspace?.(ws.website_key)}
                          tooltip={ws.display_name || ws.website_key}
                          className="flex-1"
                        >
                          {ws.logo_url ? (
                            <img src={ws.logo_url} alt="" className="w-4 h-4 rounded object-contain" />
                          ) : (
                            <Building2 className={cn("w-4 h-4", isActive ? "text-primary" : "text-muted-foreground")} />
                          )}
                          <span className="truncate text-xs">{ws.display_name || ws.website_key}</span>
                          {isActive && (
                            <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                          )}
                        </SidebarMenuButton>
                        <div className="hidden group-hover/ws:flex items-center gap-0.5 pr-1 group-data-[collapsible=icon]:hidden">
                          <button
                            onClick={(e) => { e.stopPropagation(); onRerunWorkspace?.(ws.website_key); }}
                            className="p-1 rounded hover:bg-sidebar-accent text-muted-foreground hover:text-foreground"
                            title="Re-run research"
                          >
                            <RotateCcw className="w-3 h-3" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDeleteWorkspace?.(ws.website_key); }}
                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                            title="Delete workspace"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </SidebarMenuItem>
                  );
                })}
                {workspaces.length === 0 && (
                  <p className="text-[10px] text-muted-foreground px-3 py-2 group-data-[collapsible=icon]:hidden">
                    No workspaces yet
                  </p>
                )}
              </SidebarMenu>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Pipeline */}
        <SidebarGroup>
          <SidebarGroupLabel>Pipeline</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV_ITEMS.map((item) => {
                const badge = getBadge(item.id);
                const disabled = !researchComplete && item.id !== "research";
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={activeSection === item.id}
                      onClick={() => !disabled && onSelectSection(item.id)}
                      tooltip={item.label}
                      className={disabled ? "opacity-40 pointer-events-none" : ""}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                      {badge != null && (
                        <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0 h-4">
                          {badge}
                        </Badge>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
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
