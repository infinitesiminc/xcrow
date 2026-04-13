import { useState } from "react";
import { Globe, Building2, RotateCcw, Trash2, ExternalLink, Calendar, Search } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import type { UserWorkspace } from "@/hooks/use-workspaces";
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

interface WorkspaceManagerDrawerProps {
  workspaces: UserWorkspace[];
  activeWorkspaceKey?: string;
  onSelectWorkspace?: (key: string) => void;
  onDeleteWorkspace?: (key: string) => void;
  onRerunWorkspace?: (key: string) => void;
  trigger: React.ReactNode;
}

export function WorkspaceManagerDrawer({
  workspaces,
  activeWorkspaceKey,
  onSelectWorkspace,
  onDeleteWorkspace,
  onRerunWorkspace,
  trigger,
}: WorkspaceManagerDrawerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = workspaces.filter((ws) => {
    const q = search.toLowerCase();
    return (
      ws.website_key.toLowerCase().includes(q) ||
      (ws.display_name || "").toLowerCase().includes(q)
    );
  });

  const handleSelect = (key: string) => {
    onSelectWorkspace?.(key);
    setOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      onDeleteWorkspace?.(deleteTarget);
      setDeleteTarget(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>{trigger}</SheetTrigger>
        <SheetContent side="left" className="w-[400px] sm:w-[440px] p-0 flex flex-col">
          <SheetHeader className="px-5 pt-5 pb-3 border-b">
            <SheetTitle className="text-lg">All Workspaces</SheetTitle>
            <div className="relative mt-2">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workspaces…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 h-9 text-sm"
              />
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="px-3 py-2 space-y-1">
              {filtered.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  {search ? "No workspaces match your search" : "No workspaces yet"}
                </p>
              )}
              {filtered.map((ws) => {
                const isActive = activeWorkspaceKey === ws.website_key;
                return (
                  <div
                    key={ws.website_key}
                    className={cn(
                      "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                      isActive
                        ? "bg-primary/10 ring-1 ring-primary/20"
                        : "hover:bg-muted/60"
                    )}
                    onClick={() => handleSelect(ws.website_key)}
                  >
                    {/* Logo / Icon */}
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      {ws.logo_url ? (
                        <img src={ws.logo_url} alt="" className="w-5 h-5 rounded object-contain" />
                      ) : (
                        <Building2 className="w-4 h-4 text-muted-foreground" />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm font-medium truncate",
                        isActive ? "text-primary" : "text-foreground"
                      )}>
                        {ws.display_name || ws.website_key}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                        <Globe className="w-3 h-3 shrink-0" />
                        <span className="truncate">{ws.website_key}</span>
                        <span className="text-muted-foreground/50">·</span>
                        <Calendar className="w-3 h-3 shrink-0" />
                        <span>{formatDate(ws.last_accessed_at)}</span>
                      </div>
                    </div>

                    {/* Active indicator */}
                    {isActive && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}

                    {/* Actions */}
                    <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        title="Re-run research"
                        onClick={(e) => {
                          e.stopPropagation();
                          onRerunWorkspace?.(ws.website_key);
                        }}
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:text-destructive hover:bg-destructive/10"
                        title="Delete workspace"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(ws.website_key);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          <div className="border-t px-5 py-3">
            <p className="text-xs text-muted-foreground text-center">
              {workspaces.length} workspace{workspaces.length !== 1 ? "s" : ""}
            </p>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete workspace?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete <span className="font-medium text-foreground">{deleteTarget}</span> and all its leads, niches, and outreach data. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
