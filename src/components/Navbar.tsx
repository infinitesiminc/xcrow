import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import logo from "@/assets/logo.png";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LayoutDashboard, Settings, LogOut, User, Menu, X, ChevronDown } from "lucide-react";

export default function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  const productItems = [
    { label: "Platform Overview", path: "/" },
    { label: "Simulation Builder", path: "/products/simulation-builder" },
  ];

  const navItems = [
    { label: "Pricing", path: "/pricing" },
    { label: "Contact", path: "/contact" },
    ...(user ? [
      { label: "Simulations", path: "/simulations" },
      { label: "Dashboard", path: "/dashboard" },
    ] : []),
  ];

  const handleNav = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <button
          onClick={() => handleNav("/")}
          className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <img src={logo} alt="Infinite Sim" className="h-6 w-6" />
          <span className="hidden sm:inline">Infinite Sim</span>
        </button>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1">
          {/* Products dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant={location.pathname.startsWith("/products") ? "secondary" : "ghost"}
                size="sm"
                className="text-sm gap-1"
              >
                Products <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {productItems.map((item) => (
                <DropdownMenuItem key={item.path} onClick={() => navigate(item.path)} className="cursor-pointer">
                  {item.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {navItems.map((item) => (
            <Button
              key={item.path}
              variant={isActive(item.path) ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate(item.path)}
              className="text-sm"
            >
              {item.label === "Dashboard" && <LayoutDashboard className="mr-1.5 h-4 w-4" />}
              {item.label}
            </Button>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
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
                <div className="px-2 py-1.5">
                  <p className="text-sm font-medium text-foreground truncate">
                    {user.user_metadata?.display_name || user.email}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={async () => {
                    await signOut();
                    navigate("/");
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button size="sm" onClick={openAuthModal}>
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
              <p className="px-3 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Products</p>
              {productItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="border-t border-border my-1.5" />
              {navItems.map((item) => (
                <button
                  key={item.path}
                  onClick={() => handleNav(item.path)}
                  className={`text-left px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.path)
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </>
      )}
    </header>
  );
}
