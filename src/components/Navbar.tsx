import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import xcrowLogo from "@/assets/xcrow-logo.png";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getAvatarById } from "@/lib/avatars";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Menu, X, Compass, Shield, Map, Settings, LogOut, Trophy, GraduationCap, Sun, Moon } from "lucide-react";

export default function Navbar() {
  const { user, signOut, openAuthModal, isSuperAdmin, isSchoolAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Parchment mode toggle
  const [parchment, setParchment] = useState(() => {
    return localStorage.getItem("xcrow-theme") === "parchment";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (parchment) {
      root.classList.add("parchment");
      root.classList.remove("dark");
      root.style.colorScheme = "light";
      localStorage.setItem("xcrow-theme", "parchment");
    } else {
      root.classList.remove("parchment");
      root.classList.add("dark");
      root.style.colorScheme = "dark";
      localStorage.setItem("xcrow-theme", "dark");
    }
  }, [parchment]);

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const navItems = user
    ? [
        { label: "Home", path: "/map", icon: Map },
        { label: "Leaderboard", path: "/leaderboard", icon: Trophy },
        ...(isSchoolAdmin ? [{ label: "School", path: "/school", icon: GraduationCap }] : []),
        ...(isSuperAdmin ? [{ label: "Admin", path: "/admin", icon: Shield }] : []),
      ]
    : [
        { label: "Explore", path: "/", icon: Compass },
        { label: "For Students", path: "/students", icon: GraduationCap },
        { label: "For Schools", path: "/schools", icon: GraduationCap },
        { label: "Pricing", path: "/pricing", icon: null },
      ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full backdrop-blur-xl"
      style={{
        background: "hsl(var(--surface-stone) / 0.85)",
        borderBottom: "1px solid hsl(var(--filigree) / 0.2)",
        boxShadow: "0 2px 12px hsl(var(--emboss-shadow))",
      }}
    >
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => handleNav("/")}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
        >
          <img src={xcrowLogo} alt="Xcrow" className="h-11 w-11 object-contain" />
          <span
            className="hidden sm:inline text-lg font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "'Cinzel', serif", letterSpacing: "0.02em" }}
          >
            Xcrow.ai
          </span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
                style={{
                  fontFamily: "'Cinzel', serif",
                  letterSpacing: "0.04em",
                  fontSize: "0.8rem",
                  ...(active
                    ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.1)", textShadow: "0 0 8px hsl(var(--filigree-glow) / 0.4)" }
                    : { color: "hsl(var(--muted-foreground))" }),
                }}
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar className="h-8 w-8">
                    {(() => {
                      const av = getAvatarById(profile?.avatarId);
                      return av ? <AvatarImage src={av.src} alt={av.label} className="object-contain bg-muted/30" /> : null;
                    })()}
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-48"
                style={{
                  background: "hsl(var(--surface-stone))",
                  border: "1px solid hsl(var(--filigree) / 0.2)",
                }}
              >
                <div className="px-3 py-2">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.display_name || user.email}
                  </p>
                  {user.user_metadata?.display_name && (
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  )}
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setParchment(!parchment)}>
                  {parchment ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                  {parchment ? "Dark Mode" : "Parchment Mode"}
                </DropdownMenuItem>
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
          ) : (
            <Button
              size="sm"
              onClick={openAuthModal}
              style={{
                background: "hsl(var(--primary))",
                fontFamily: "'Cinzel', serif",
                letterSpacing: "0.04em",
              }}
            >
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
          <div
            className="fixed left-0 right-0 top-14 z-50 md:hidden shadow-lg"
            style={{
              background: "hsl(var(--surface-stone))",
              borderTop: "1px solid hsl(var(--filigree) / 0.2)",
            }}
          >
            <nav className="flex flex-col px-4 py-3 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => handleNav(item.path)}
                    className="flex items-center gap-2 text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors"
                    style={{
                      fontFamily: "'Cinzel', serif",
                      ...(active
                        ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.1)" }
                        : { color: "hsl(var(--muted-foreground))" }),
                    }}
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
