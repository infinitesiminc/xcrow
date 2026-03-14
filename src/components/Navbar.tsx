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
import { BarChart3, LayoutDashboard, Settings, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { user, signOut, openAuthModal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const initials = user?.user_metadata?.display_name
    ? user.user_metadata.display_name.slice(0, 2).toUpperCase()
    : user?.email?.slice(0, 2).toUpperCase() ?? "?";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo / Home */}
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 font-sans text-lg font-bold tracking-tight text-foreground hover:opacity-80 transition-opacity"
        >
          <img src={logo} alt="Infinite Sim" className="h-6 w-6" />
          <span className="hidden sm:inline">Infinite Sim</span>
        </button>

        {/* Nav links */}
        <nav className="flex items-center gap-1">
          <Button
            variant={isActive("/for-individuals") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/for-individuals")}
            className="text-sm"
          >
            For Individuals
          </Button>
          <Button
            variant={isActive("/for-organizations") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/for-organizations")}
            className="text-sm"
          >
            For Organizations
          </Button>
          <Button
            variant={isActive("/") ? "secondary" : "ghost"}
            size="sm"
            onClick={() => navigate("/")}
            className="text-sm"
          >
            Analyze
          </Button>

          {user && (
            <Button
              variant={isActive("/dashboard") ? "secondary" : "ghost"}
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="text-sm"
            >
              <LayoutDashboard className="mr-1.5 h-4 w-4" />
              Dashboard
            </Button>
          )}
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
            <Button size="sm" onClick={() => navigate("/auth")}>
              <User className="mr-1.5 h-4 w-4" />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
