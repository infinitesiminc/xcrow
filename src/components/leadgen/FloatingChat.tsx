import { useState, useRef, useEffect } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FloatingChatProps {
  children: React.ReactNode;
}

export function FloatingChat({ children }: FloatingChatProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <>
      {/* Floating bubble */}
      {!open && (
        <Button
          onClick={() => setOpen(true)}
          size="icon"
          className={cn(
            "fixed z-50 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
            isMobile ? "bottom-4 right-4 h-12 w-12" : "bottom-6 right-6 h-14 w-14"
          )}
        >
          <MessageCircle className={isMobile ? "h-5 w-5" : "h-6 w-6"} />
        </Button>
      )}

      {/* Chat panel */}
      {open && (
        <div
          ref={panelRef}
          className={cn(
            "fixed z-50 flex flex-col bg-background border border-border rounded-xl shadow-2xl overflow-hidden",
            "animate-in fade-in-0 zoom-in-95 duration-200",
            isMobile
              ? "bottom-2 right-2 left-2 top-16"
              : "bottom-6 right-6 w-[400px] h-[520px]"
          )}
        >
          {/* Header with close */}
          <div className="flex items-center justify-between px-3 py-2 border-b border-border shrink-0">
            <span className="text-sm font-medium text-foreground">AI Assistant</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          {/* Chat content fills remaining space */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {children}
          </div>
        </div>
      )}
    </>
  );
}
