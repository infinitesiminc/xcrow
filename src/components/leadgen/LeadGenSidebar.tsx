import { useNavigate } from "react-router-dom";
import { Search, Users, TableProperties, Mail, Settings, Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
