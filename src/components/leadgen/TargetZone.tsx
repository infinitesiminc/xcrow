import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Target, X, Zap, Loader2, Sparkles, TrendingUp,
  Package, Building2,
} from "lucide-react";

export interface DroppedCard {
  id: string;
  type: "product" | "vertical";
  label: string;
  description: string;
  meta?: string;
}

interface TargetZoneProps {
  cards: DroppedCard[];
  onRemoveCard: (id: string) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  companySummary?: string;
}

export default function TargetZone({
  cards, onRemoveCard, onGenerate, isGenerating,
}: TargetZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [feedback, setFeedback] = useState({ successRate: 0, recommendation: "", loading: false });
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>();

  const hasProducts = cards.some(c => c.type === "product");
  const hasVerticals = cards.some(c => c.type === "vertical");

  const fetchFeedback = useCallback(async () => {
    if (cards.length === 0) {
      setFeedback({ successRate: 0, recommendation: "Drag cards here", loading: false });
      return;
    }
    let score = 30;
    if (hasProducts) score += 25;
    if (hasVerticals) score += 30;
    if (hasProducts && hasVerticals) score += 15;
    const pCards = cards.filter(c => c.type === "product");
    const vCards = cards.filter(c => c.type === "vertical");
    let rec = "";
    if (hasProducts && !hasVerticals) rec = "Add a persona to narrow targeting.";
    else if (!hasProducts && hasVerticals) rec = "Add a product to complete targeting.";
    else if (pCards.length === 1 && vCards.length === 1) rec = `${pCards[0].label} × ${vCards[0].label} — ready!`;
    else rec = `${cards.length} criteria — broader search.`;
    setFeedback({ successRate: Math.min(score, 95), recommendation: rec, loading: false });
  }, [cards, hasProducts, hasVerticals]);

  useEffect(() => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(fetchFeedback, 300);
    return () => { if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current); };
  }, [fetchFeedback]);

  const scoreColor = feedback.successRate >= 70 ? "text-green-600" : feedback.successRate >= 40 ? "text-yellow-600" : "text-muted-foreground";
  const scoreBg = feedback.successRate >= 70 ? "bg-green-500/15" : feedback.successRate >= 40 ? "bg-yellow-500/15" : "bg-muted/30";

  return (
    <div
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "copy"; setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={e => { e.preventDefault(); setIsDragOver(false); }}
      className={`mx-2 mb-2 rounded-lg border-2 border-dashed transition-all ${
        isDragOver ? "border-primary bg-primary/5" : cards.length > 0 ? "border-primary/30 bg-card" : "border-border/50 bg-muted/10"
      }`}
    >
      {cards.length === 0 ? (
        <div className="flex items-center justify-center py-4 gap-2">
          <Target className={`w-4 h-4 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">
            {isDragOver ? "Drop here" : "Drag cards here"}
          </span>
        </div>
      ) : (
        <div className="p-2 space-y-2">
          {/* Chips */}
          <div className="flex flex-col gap-1.5">
            {cards.map(card => (
              <div key={card.id} className="flex items-center gap-1.5 px-2 py-1 rounded-md border border-primary/30 bg-primary/5 text-xs">
                {card.type === "product" ? <Package className="w-3 h-3 text-primary shrink-0" /> : <Building2 className="w-3 h-3 text-primary shrink-0" />}
                <span className="font-medium text-foreground truncate">{card.label}</span>
                {card.meta && card.type === "vertical" && <span className="text-muted-foreground truncate">· {card.meta}</span>}
                <button onClick={() => onRemoveCard(card.id)} className="ml-auto p-0.5 rounded hover:bg-destructive/10 shrink-0">
                  <X className="w-2.5 h-2.5 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          {/* Feedback + Generate */}
          <div className="flex items-center gap-2 p-2 rounded-md bg-muted/20 border border-border/30">
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded ${scoreBg} shrink-0`}>
              <TrendingUp className={`w-3 h-3 ${scoreColor}`} />
              <span className={`text-xs font-bold ${scoreColor}`}>{feedback.successRate}%</span>
            </div>
            <p className="text-[11px] text-muted-foreground flex-1 min-w-0 leading-snug">
              <Sparkles className="w-2.5 h-2.5 text-primary inline mr-0.5" />
              {feedback.recommendation}
            </p>
          </div>
          <Button
            size="sm"
            className="w-full h-7 gap-1.5 text-xs"
            onClick={onGenerate}
            disabled={isGenerating || cards.length === 0}
          >
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
            Generate Leads
          </Button>
        </div>
      )}
    </div>
  );
}
