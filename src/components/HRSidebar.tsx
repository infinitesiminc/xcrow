import { useLocation, useSearchParams } from "react-router-dom";
import { BarChart3, Users, Settings, Building2, Blocks, RefreshCw, Shield, Target, Search, Activity, Zap } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth } from "@/contexts/AuthContext";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const platformItems = [
  { title: "Overview", url: "/admin/team-progress", icon: BarChart3 },
  { title: "Roles & Simulations", url: "/admin/simulations", icon: Blocks },
  { title: "Exposure Map", url: "/admin/score-distributions", icon: Activity },
  { title: "Action Center", url: "/admin/action-center", icon: Zap },
  { title: "Import Roles", url: "/admin/ats-sync", icon: RefreshCw },
];

const workspaceItems = [
  { title: "Members", url: "/admin/members", icon: Users },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const superadminItems = [
  { title: "Workspaces", url: "/admin/workspaces", icon: Building2 },
  { title: "Roadmap", url: "/admin/roadmap", icon: Target },
  { title: "Analyze Tool", url: "/admin/analyze", icon: Search },
];

function NavGroup({ label, items, collapsed, icon, wsParam }: {
  label: string;
  items: typeof platformItems;
  collapsed: boolean;
  icon?: React.ReactNode;
  wsParam?: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        {icon}
        {!collapsed && <span>{label}</span>}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const url = wsParam ? `${item.url}?workspace=${wsParam}` : item.url;
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={url}
                    end
                    className="hover:bg-muted/50"
                    activeClassName="bg-muted text-primary font-medium"
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function HRSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { isSuperAdmin } = useAuth();
  const [searchParams] = useSearchParams();
  const wsParam = searchParams.get("workspace") || undefined;

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <NavGroup label="Platform" items={platformItems} collapsed={collapsed} icon={<Activity className="h-4 w-4" />} wsParam={wsParam} />
        <NavGroup label="Workspace" items={workspaceItems} collapsed={collapsed} icon={<Building2 className="h-4 w-4" />} wsParam={wsParam} />
        <NavGroup label="Superadmin" items={superadminItems} collapsed={collapsed} icon={<Shield className="h-4 w-4" />} />
      </SidebarContent>
    </Sidebar>
  );
}
