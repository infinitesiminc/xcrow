import { X, BarChart3, MapPin } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import MarketPanel, { type GeoContext, type ViewportHint } from "./MarketPanel";

export type PanelMode = "market" | "detail" | "hidden";

interface ContextPanelProps {
  mode: PanelMode;
  onModeChange: (mode: PanelMode) => void;
  geo: GeoContext;
  onGeoChange: (geo: GeoContext) => void;
  onViewportHint?: (hint: ViewportHint) => void;
  detailContent: React.ReactNode;
}

export default function ContextPanel({ mode, onModeChange, geo, onGeoChange, onViewportHint, detailContent }: ContextPanelProps) {
  if (mode === "hidden") return null;

  return (
    <div className="absolute top-0 right-0 z-[1000] w-96 h-full transition-transform duration-300 ease-out translate-x-0">
      <div className="h-full bg-background/80 backdrop-blur-xl border-l border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-background shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onModeChange("market")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                mode === "market" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              Market
            </button>
            <button
              onClick={() => onModeChange("detail")}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-colors ${
                mode === "detail" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              }`}
            >
              <MapPin className="h-3.5 w-3.5" />
              Detail
            </button>
          </div>
          <button
            onClick={() => onModeChange("hidden")}
            className="w-6 h-6 rounded-full bg-muted/80 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-3">
            {mode === "market" && (
              <MarketPanel geo={geo} onGeoChange={onGeoChange} onViewportHint={onViewportHint} />
            )}
            {mode === "detail" && detailContent}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
