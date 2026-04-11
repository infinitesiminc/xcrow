import { useLocation } from "react-router-dom";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { LayoutDashboard, Building2, Plus } from "lucide-react";
import { getAllTenants } from "@/config/tenants";

export default function EnterpriseSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const tenants = getAllTenants();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="p-4">
        {!collapsed ? (
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <span className="font-semibold text-sm text-foreground">Enterprise</span>
          </div>
        ) : (
          <Building2 className="h-5 w-5 text-primary mx-auto" />
        )}
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Overview</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                    <NavLink
                    to="/admin"
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${
                        isActive
                          ? "bg-accent text-accent-foreground font-medium"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <LayoutDashboard className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Accounts</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {tenants.map((tenant) => {
                const isActive = location.pathname === `/admin/${tenant.slug}`;
                return (
                  <SidebarMenuItem key={tenant.slug}>
                    <SidebarMenuButton asChild>
                      <NavLink
                        to={`/admin/${tenant.slug}`}
                        className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors ${
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {tenant.logo ? (
                          <img src={tenant.logo} alt={tenant.name} className="h-4 w-4 shrink-0 rounded" />
                        ) : (
                          <div className="h-4 w-4 shrink-0 rounded bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary">
                            {tenant.name.charAt(0)}
                          </div>
                        )}
                        {!collapsed && <span>{tenant.name}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}

              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <button
                    className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted transition-colors w-full cursor-not-allowed opacity-50"
                    disabled
                  >
                    <Plus className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Add Account</span>}
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-3">
        {!collapsed && (
          <p className="text-[10px] text-muted-foreground/50 text-center">
            Superadmin only
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
