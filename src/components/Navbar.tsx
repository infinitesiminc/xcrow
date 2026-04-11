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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { User, Menu, X, Compass, Settings, LogOut, Globe, ChevronDown, Trash2, Plus, Check, Shield } from "lucide-react";
import type { UserWorkspace } from "@/hooks/use-workspaces";

interface NavbarProps {
  workspaces?: UserWorkspace[];
  activeWorkspaceKey?: string;
  onSwitchWorkspace?: (websiteKey: string) => void;
  onDeleteWorkspace?: (websiteKey: string) => void;
  onNewWorkspace?: () => void;
}

export default function Navbar({ workspaces, activeWorkspaceKey, onSwitchWorkspace, onDeleteWorkspace, onNewWorkspace }: NavbarProps) {
  const { user, signOut, openAuthModal, profile, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserWorkspace | null>(null);

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const navItems = [
    { label: "Lead Gen", path: "/leadgen", icon: Compass },
    { label: "How It Works", path: "/how-it-works", icon: undefined },
    { label: "Pricing", path: "/pricing", icon: undefined },
    ...(isSuperAdmin ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const activeWs = workspaces?.find(w => w.website_key === activeWorkspaceKey);
  const showSwitcher = user && workspaces && workspaces.length > 0 && location.pathname.startsWith("/leadgen");

  const confirmDelete = () => {
    if (deleteTarget) {
      onDeleteWorkspace?.(deleteTarget.website_key);
      setDeleteTarget(null);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-md border-b border-border/60">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleNav("/")}
              className="flex items-center gap-1.5 hover:opacity-80 transition-opacity"
            >
              <img src={logoCrow} alt="Xcrow" className="h-7 w-7 object-contain" />
              <span className="text-lg font-bold text-foreground tracking-tight">
                Xcrow
              </span>
            </button>

            {/* Workspace Switcher — now using DropdownMenu */}
            {showSwitcher && (
              <>
                <span className="text-border/80 text-lg font-light select-none">/</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-medium text-foreground hover:bg-muted/50 transition-colors max-w-[200px]">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{activeWs?.display_name || activeWorkspaceKey || "Select workspace"}</span>
                      <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72" sideOffset={8}>
                    <DropdownMenuLabel className="text-xs text-muted-foreground font-medium">
                      Workspaces
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {workspaces.map((ws) => {
                      const isCurrentWs = ws.website_key === activeWorkspaceKey;
                      return (
                        <DropdownMenuItem
                          key={ws.website_key}
                          className="flex items-center gap-2 py-2 cursor-pointer group"
                          onClick={() => onSwitchWorkspace?.(ws.website_key)}
                        >
                          <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{ws.display_name || ws.website_key}</p>
                            {ws.display_name && ws.display_name !== ws.website_key && (
                              <p className="text-xs text-muted-foreground truncate">{ws.website_key}</p>
                            )}
                          </div>
                          {isCurrentWs && (
                            <Check className="w-4 h-4 text-primary shrink-0" />
                          )}
                          {onDeleteWorkspace && (
                            <button
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setDeleteTarget(ws);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            </button>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    {onNewWorkspace && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-muted-foreground cursor-pointer"
                          onClick={onNewWorkspace}
                        >
                          <Plus className="w-4 h-4" />
                          New workspace
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-semibold text-foreground">{deleteTarget?.display_name || deleteTarget?.website_key}</span> and all its leads, niches, and outreach history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete workspace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}