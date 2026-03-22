import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import xcrowLogo from "@/assets/avatars/crow.png";
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
import { User, Menu, X, Compass, Shield, Map, Settings, LogOut, Trophy, GraduationCap } from "lucide-react";

export default function Navbar() {
  const { user, signOut, openAuthModal, isSuperAdmin, isSchoolAdmin, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const navItems = user
    ? [
        { label: "Home", path: "/", icon: Compass },
        { label: "Skill Map", path: "/map", icon: Map },
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
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => handleNav("/")}
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <img src={xcrowLogo} alt="Xcrow" className="h-11 w-11 object-contain" />
          <span className="hidden sm:inline text-lg font-extrabold text-foreground tracking-tight" style={{ fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif", letterSpacing: '-0.02em' }}>Xcrow.ai</span>
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
  );
}
