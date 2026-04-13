import { useNavigate } from "react-router-dom";
import { Settings, Globe, Plus, Building2, RotateCcw, Trash2, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WorkspaceManagerDrawer } from "./WorkspaceManagerDrawer";
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

export function LeadGenSidebar({
  websiteUrl,
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

  return (
    <Sidebar collapsible="icon">
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
                <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Lead Gen for</p>
                <p className="text-base font-bold text-sidebar-foreground truncate leading-tight">
                  {activeWorkspace?.display_name || displayDomain}
                </p>
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
            <ScrollArea className="max-h-[400px]">
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
      </SidebarContent>

      <SidebarFooter>
        <SidebarSeparator />
        <SidebarMenu>
          <SidebarMenuItem>
            <WorkspaceManagerDrawer
              workspaces={workspaces}
              activeWorkspaceKey={activeWorkspaceKey}
              onSelectWorkspace={onSelectWorkspace}
              onDeleteWorkspace={onDeleteWorkspace}
              onRerunWorkspace={onRerunWorkspace}
              trigger={
                <SidebarMenuButton tooltip="Manage Workspaces">
                  <LayoutGrid className="w-4 h-4" />
                  <span>Manage Workspaces</span>
                </SidebarMenuButton>
              }
            />
          </SidebarMenuItem>
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
