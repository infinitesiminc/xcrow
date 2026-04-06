import { useState } from "react";
import logoCrow from "@/assets/logo-crow.png";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import SubscriptionBadge from "@/components/SubscriptionBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { User, Menu, X, Compass, Settings, LogOut, Globe, ChevronDown, Trash2 } from "lucide-react";
import type { UserWorkspace } from "@/hooks/use-workspaces";

interface NavbarProps {
  workspaces?: UserWorkspace[];
  activeWorkspaceKey?: string;
  onSwitchWorkspace?: (websiteKey: string) => void;
  onDeleteWorkspace?: (websiteKey: string) => void;
}

export default function Navbar({ workspaces, activeWorkspaceKey, onSwitchWorkspace, onDeleteWorkspace }: NavbarProps) {
  const { user, signOut, openAuthModal, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [wsOpen, setWsOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const navItems = [
    { label: "Lead Hunter", path: "/leadgen", icon: Compass },
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const activeWs = workspaces?.find(w => w.website_key === activeWorkspaceKey);
  const showSwitcher = user && workspaces && workspaces.length > 0 && location.pathname.startsWith("/leadhunter");

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleNav("/")}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <span className="text-lg font-bold text-foreground tracking-tight">
              Xcrow
            </span>
          </button>

          {/* Workspace Switcher */}
          {showSwitcher && (
            <>
              <span className="text-border/80 text-lg font-light select-none">/</span>
              <Popover open={wsOpen} onOpenChange={setWsOpen}>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors max-w-[200px]">
                    <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="truncate">{activeWs?.display_name || activeWorkspaceKey || "Select workspace"}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                  </button>
                </PopoverTrigger>
                <PopoverContent align="start" className="w-64 p-1.5" sideOffset={8}>
                  <p className="text-xs font-medium text-muted-foreground px-2 py-1.5">Workspaces</p>
                  <div className="max-h-[280px] overflow-y-auto space-y-0.5">
                    {workspaces.map((ws) => (
                      <div
                        key={ws.website_key}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors group ${
                          ws.website_key === activeWorkspaceKey
                            ? "bg-primary/8 text-primary font-medium"
                            : "text-foreground hover:bg-muted/50"
                        }`}
                        onClick={() => {
                          onSwitchWorkspace?.(ws.website_key);
                          setWsOpen(false);
                        }}
                      >
                        <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm">{ws.display_name || ws.website_key}</p>
                          <p className="text-xs text-muted-foreground truncate">{ws.website_key}</p>
                        </div>
                        {onDeleteWorkspace && (
                          <button
                            className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteWorkspace(ws.website_key);
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </>
          )}
        </div>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "text-primary bg-primary/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {Icon && <Icon className="h-4 w-4" />}
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1.5">
          {user ? (
            <>
              <div className="hidden sm:block">
                <SubscriptionBadge />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-3 py-2">
                    <p className="text-sm font-medium text-foreground truncate">
                      {user.user_metadata?.display_name || user.email}
                    </p>
                    {user.user_metadata?.display_name && (
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button size="sm" onClick={openAuthModal} className="font-semibold">
              Sign in
            </Button>
          )}

          {/* Mobile hamburger */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <>
          <div className="fixed inset-0 top-14 z-40 bg-background/60 backdrop-blur-sm md:hidden" onClick={() => setMobileOpen(false)} />
          <div className="fixed left-0 right-0 top-14 z-50 md:hidden shadow-lg bg-background border-t border-border">
            <nav className="flex flex-col px-4 py-3 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className={`flex items-center gap-2 text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      active
                        ? "text-primary bg-primary/8"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
