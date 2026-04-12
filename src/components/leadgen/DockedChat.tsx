import { useState } from "react";
import { MessageCircle, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface DockedChatProps {
  children: React.ReactNode;
}

export function DockedChat({ children }: DockedChatProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  // Desktop: collapsible docked panel
  if (!isMobile) {
    if (collapsed) {
      return (
        <div className="w-10 border-r border-border flex flex-col items-center py-3 bg-background shrink-0 h-full">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCollapsed(false)}
            title="Open AI Co-pilot"
          >
            <PanelLeftOpen className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div className="w-[420px] border-r border-border flex flex-col bg-background shrink-0 h-full overflow-hidden">
        <div className="flex items-center justify-between px-3 py-1.5 border-b border-border/50 shrink-0">
          <span className="text-xs font-medium text-muted-foreground">AI Co-pilot</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
            onClick={() => setCollapsed(true)}
            title="Collapse panel"
          >
            <PanelLeftClose className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  // Mobile: FAB + full-screen overlay
  return (
    <>
      {!mobileOpen && (
        <Button
          onClick={() => setMobileOpen(true)}
          size="icon"
          className="fixed z-50 bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <MessageCircle className="h-5 w-5" />
        </Button>
      )}

      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <span className="text-sm font-medium text-foreground">AI Co-pilot</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
