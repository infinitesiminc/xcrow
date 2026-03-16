import { useLocation } from "react-router-dom";
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

const SUPERADMIN_IDS = [
  "7be41055-be68-4cab-b63c-f3b0c483e6eb",
  "bb10735b-051e-4bb5-918e-931a9c79d0fd",
];

const diagnoseItems = [
  { title: "Role Explorer", url: "/hr/simulations", icon: Blocks },
  { title: "AI Exposure Map", url: "/hr/score-distributions", icon: Activity },
  { title: "ATS Sync", url: "/hr/ats-sync", icon: RefreshCw },
];

const upskillItems = [
  { title: "Team Progress", url: "/hr/team-progress", icon: BarChart3 },
  { title: "Action Center", url: "/hr/action-center", icon: Zap },
];

const workspaceItems = [
  { title: "Members", url: "/hr/members", icon: Users },
  { title: "Settings", url: "/hr/settings", icon: Settings },
];

const superadminItems = [
  { title: "Workspaces", url: "/hr/workspaces", icon: Building2 },
  { title: "Roadmap", url: "/hr/roadmap", icon: Target },
  { title: "Analyze Tool", url: "/hr/analyze", icon: Search },
];

function NavGroup({ label, items, collapsed, icon }: { label: string; items: typeof diagnoseItems; collapsed: boolean; icon?: React.ReactNode }) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel className="flex items-center gap-2">
        {icon}
        {!collapsed && <span>{label}</span>}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end
                  className="hover:bg-muted/50"
                  activeClassName="bg-muted text-primary font-medium"
                >
                  <item.icon className="mr-2 h-4 w-4" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function HRSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();

  const isSuperAdmin = !!user && SUPERADMIN_IDS.includes(user.id);

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarContent className="pt-4">
        <NavGroup label="Diagnose" items={diagnoseItems} collapsed={collapsed} icon={<Search className="h-4 w-4" />} />
        <NavGroup label="Upskill & Monitor" items={upskillItems} collapsed={collapsed} icon={<BarChart3 className="h-4 w-4" />} />
        <NavGroup label="Workspace" items={workspaceItems} collapsed={collapsed} icon={<Building2 className="h-4 w-4" />} />

        {isSuperAdmin && (
          <NavGroup label="Superadmin" items={superadminItems} collapsed={collapsed} icon={<Shield className="h-4 w-4" />} />
        )}
      </SidebarContent>
    </Sidebar>
  );
}
