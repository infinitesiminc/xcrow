import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import crowLogo from "@/assets/crowy-logo.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Menu, X, Compass, Shield, Bookmark, ArrowRight, Clock, Map, Settings, LogOut, Trophy, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RecentActivity {
  type: "analysis" | "simulation" | "bookmark";
  label: string;
  subtitle?: string;
  timestamp: string;
  jobTitle: string;
  company: string | null;
}

export default function Navbar() {
  const { user, signOut, openAuthModal, isSuperAdmin, isSchoolAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [savedOpen, setSavedOpen] = useState(false);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const navItems = [
    { label: "Explore", path: "/", icon: Compass },
    { label: "For Students", path: "/students", icon: GraduationCap },
    { label: "For Schools", path: "/schools", icon: GraduationCap },
    { label: "Pricing", path: "/pricing", icon: null },
    { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
    ...(user ? [
      { label: "Skill Map", path: "/journey", icon: Map },
    ] : []),
    ...(isSchoolAdmin ? [
      { label: "School", path: "/school", icon: GraduationCap },
    ] : []),
    ...(isSuperAdmin ? [
      { label: "Admin", path: "/admin", icon: Shield },
    ] : []),
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  // Fetch recent activities when dropdown opens
  useEffect(() => {
    if (!savedOpen || !user) return;
    setLoadingActivities(true);
    (async () => {
      const [bookmarks, analyses, sims] = await Promise.all([
        supabase.from("bookmarked_roles").select("job_title, company, bookmarked_at").eq("user_id", user.id).order("bookmarked_at", { ascending: false }).limit(10),
        supabase.from("analysis_history").select("job_title, company, analyzed_at").eq("user_id", user.id).order("analyzed_at", { ascending: false }).limit(10),
        supabase.from("completed_simulations").select("job_title, task_name, company, completed_at").eq("user_id", user.id).order("completed_at", { ascending: false }).limit(10),
      ]);

      const items: RecentActivity[] = [];
      for (const b of bookmarks.data || []) {
        items.push({ type: "bookmark", label: b.job_title, subtitle: b.company, timestamp: b.bookmarked_at, jobTitle: b.job_title, company: b.company });
      }
      for (const a of analyses.data || []) {
        items.push({ type: "analysis", label: a.job_title, subtitle: a.company, timestamp: a.analyzed_at, jobTitle: a.job_title, company: a.company });
      }
      for (const s of sims.data || []) {
        items.push({ type: "simulation", label: s.task_name, subtitle: s.job_title, timestamp: s.completed_at, jobTitle: s.job_title, company: s.company });
      }

      items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setActivities(items.slice(0, 15));
      setLoadingActivities(false);
    })();
  }, [savedOpen, user]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!savedOpen) return;
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setSavedOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [savedOpen]);

  // Close on route change
  useEffect(() => { setSavedOpen(false); }, [location.pathname]);

  const goToRole = (jobTitle: string, company: string | null) => {
    setSavedOpen(false);
    const params = new URLSearchParams({ title: jobTitle });
    if (company) params.set("company", company);
    navigate(`/analysis?${params.toString()}`);
  };

  const timeAgo = (ts: string) => {
    const diff = Date.now() - new Date(ts).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  };

  const activityIcon = (type: RecentActivity["type"]) => {
    switch (type) {
      case "bookmark": return <Bookmark className="h-3 w-3 text-primary fill-primary shrink-0" />;
      case "analysis": return <Compass className="h-3 w-3 text-blue-400 shrink-0" />;
      case "simulation": return <Shield className="h-3 w-3 text-amber-400 shrink-0" />;
    }
  };

  const activityLabel = (type: RecentActivity["type"]) => {
    switch (type) {
      case "bookmark": return "Saved";
      case "analysis": return "Explored";
      case "simulation": return "Practiced";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <button
            onClick={() => handleNav("/")}
            className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
          >
            <img src={crowLogo} alt="crowy.ai" className="h-8 w-8 rounded-lg" />
            <span className="hidden sm:inline neon-text font-extrabold">crowy.ai</span>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Button
                  key={item.path}
                  variant={isActive(item.path) ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => navigate(item.path)}
                  className={`text-sm gap-1.5 ${isActive(item.path) ? "text-primary" : ""}`}
                >
                  {Icon && <Icon className="h-4 w-4" />}
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1.5">
            {user && (
              <div className="relative" ref={dropdownRef}>
                <Button
                  variant="ghost"
                  size="icon"
                  className={`rounded-full ${savedOpen ? "bg-accent" : ""}`}
                  onClick={() => setSavedOpen(o => !o)}
                >
                  <Clock className="h-4.5 w-4.5 text-muted-foreground" />
                </Button>

                {savedOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-border bg-background shadow-2xl z-50 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                      <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Recent Activity</h3>
                      <button
                        onClick={() => { setSavedOpen(false); navigate("/settings"); }}
                        className="text-[10px] text-primary hover:text-primary/80 font-medium flex items-center gap-0.5"
                      >
                        All saved <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>

                    {/* Activity list */}
                    <div className="max-h-[360px] overflow-y-auto">
                      {loadingActivities ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                        </div>
                      ) : activities.length === 0 ? (
                        <div className="text-center py-8 px-4">
                          <Clock className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground">No activity yet</p>
                        </div>
                      ) : (
                        <div className="py-1">
                          {activities.map((a, i) => (
                            <button
                              key={`${a.type}-${a.label}-${i}`}
                              onClick={() => goToRole(a.jobTitle, a.company)}
                              className="w-full flex items-start gap-2.5 px-4 py-2.5 hover:bg-muted/30 transition-colors group"
                            >
                              <div className="mt-0.5">{activityIcon(a.type)}</div>
                              <div className="flex-1 min-w-0 text-left">
                                <p className="text-xs font-medium text-foreground truncate">{a.label}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] text-muted-foreground">{activityLabel(a.type)}</span>
                                  {a.subtitle && (
                                    <>
                                      <span className="text-[10px] text-muted-foreground/40">·</span>
                                      <span className="text-[10px] text-muted-foreground truncate">{a.subtitle}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                              <span className="text-[10px] text-muted-foreground/60 shrink-0 mt-0.5">{timeAgo(a.timestamp)}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
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
                  <DropdownMenuItem onClick={() => navigate("/journey")}>
                    <Map className="mr-2 h-4 w-4" />
                    Skill Map
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={openAuthModal} className="bg-primary hover:bg-primary/90 glow-purple">
                <User className="mr-1.5 h-4 w-4" />
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
            <div className="fixed left-0 right-0 top-14 z-50 md:hidden border-t border-border bg-background shadow-lg">
              <nav className="flex flex-col px-4 py-3 gap-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.path}
                          onClick={() => handleNav(item.path)}
                          className={`flex items-center gap-2 text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            isActive(item.path)
                              ? "bg-accent text-primary"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
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

    </>
  );
}
