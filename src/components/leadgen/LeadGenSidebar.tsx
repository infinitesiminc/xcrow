import { useNavigate } from "react-router-dom";
import { Search, Users, TableProperties, Mail, Settings, Globe, Plus, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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

export type SidebarSection = "research" | "personas" | "leads" | "outreach";

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
}

const NAV_ITEMS: { id: SidebarSection; label: string; icon: typeof Search; }[] = [
  { id: "research", label: "Research", icon: Search },
  { id: "personas", label: "Personas", icon: Users },
  { id: "leads", label: "Leads", icon: TableProperties },
  { id: "outreach", label: "Outreach", icon: Mail },
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
}: LeadGenSidebarProps) {
  const navigate = useNavigate();

  const getBadge = (id: SidebarSection) => {
    if (id === "personas" && personaCount > 0) return personaCount;
    if (id === "leads" && leadCount > 0) return leadCount;
    if (id === "outreach" && outreachCount > 0) return outreachCount;
    return null;
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Globe className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">
              Lead Gen
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

        {/* Workspaces */}
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center justify-between">
            <span>Workspaces</span>
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2 h-8 text-xs"
                onClick={onNewResearch}
              >
                <Plus className="w-3 h-3" />
                New Research
              </Button>
            </div>
            <ScrollArea className="max-h-[200px]">
              <SidebarMenu>
                {workspaces.map((ws) => (
                  <SidebarMenuItem key={ws.website_key}>
                    <SidebarMenuButton
                      isActive={activeWorkspaceKey === ws.website_key}
                      onClick={() => onSelectWorkspace?.(ws.website_key)}
                      tooltip={ws.display_name || ws.website_key}
                    >
                      {ws.logo_url ? (
                        <img src={ws.logo_url} alt="" className="w-4 h-4 rounded object-contain" />
                      ) : (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="truncate text-xs">{ws.display_name || ws.website_key}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
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
