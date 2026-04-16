import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface DockedChatProps {
  /** Chat content (left side) */
  chat: React.ReactNode;
  /** Right side content. If null/undefined the chat takes full width. */
  right?: React.ReactNode;
}

/**
 * Resizable two-pane layout: chat on the left, optional content on the right.
 * - When `right` is omitted, the chat fills the full width.
 * - On mobile, chat is a full-screen overlay triggered by a FAB; right content fills the screen.
 */
export function DockedChat({ chat, right }: DockedChatProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobile: right takes full screen, chat is FAB overlay
  if (isMobile) {
    return (
      <>
        <div className="flex-1 min-h-0 overflow-hidden">{right ?? chat}</div>
        {right && !mobileOpen && (
          <Button
            onClick={() => setMobileOpen(true)}
            size="icon"
            className="fixed z-50 bottom-4 right-4 h-12 w-12 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <MessageCircle className="h-5 w-5" />
          </Button>
        )}
        {right && mobileOpen && (
          <div className="fixed inset-0 z-50 flex flex-col bg-background animate-in fade-in-0 slide-in-from-bottom-4 duration-200">
            <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
              <span className="text-sm font-medium text-foreground">AI Co-pilot</span>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setMobileOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">{chat}</div>
          </div>
        )}
      </>
    );
  }

  // Desktop without right: chat takes full width
  if (!right) {
    return <div className="flex-1 min-w-0 h-full overflow-hidden bg-background">{chat}</div>;
  }

  // Desktop with right: resizable split
  return (
    <ResizablePanelGroup direction="horizontal" className="flex-1 min-w-0 h-full">
      <ResizablePanel defaultSize={40} minSize={25} maxSize={70} className="bg-background">
        <div className="h-full flex flex-col overflow-hidden">{chat}</div>
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={60} minSize={30} className="bg-background">
        <div className="h-full overflow-y-auto" style={{ overscrollBehavior: "contain" }}>
          {right}
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
