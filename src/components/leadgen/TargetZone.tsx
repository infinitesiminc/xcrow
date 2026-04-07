import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Zap, Loader2, Sparkles, TrendingUp, Square, RotateCcw } from "lucide-react";

export interface DroppedCard {
  id: string;
  type: "product" | "vertical";
  label: string;
  description: string;
  meta?: string;
}

interface TargetZoneProps {
  cards: DroppedCard[];
  onGenerate: () => void;
  isGenerating?: boolean;
  onStop?: () => void;
  hasCustomizations?: boolean;
  onReset?: () => void;
}

export default function TargetZone({ cards, onGenerate, isGenerating, onStop, hasCustomizations, onReset }: TargetZoneProps) {
  const [feedback, setFeedback] = useState({ successRate: 0, recommendation: "", loading: false });
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>();

  const hasProducts = cards.some(c => c.type === "product");
  const hasVerticals = cards.some(c => c.type === "vertical");

  const fetchFeedback = useCallback(() => {
    if (cards.length === 0) {
      setFeedback({ successRate: 0, recommendation: "Select products & personas above", loading: false });
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
    else rec = `${cards.length} criteria selected.`;
    setFeedback({ successRate: Math.min(score, 95), recommendation: rec, loading: false });
  }, [cards, hasProducts, hasVerticals]);

  useEffect(() => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(fetchFeedback, 200);
    return () => { if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current); };
  }, [fetchFeedback]);

  const scoreColor = feedback.successRate >= 70 ? "text-green-600" : feedback.successRate >= 40 ? "text-yellow-600" : "text-muted-foreground";
  const scoreBg = feedback.successRate >= 70 ? "bg-green-500/15" : feedback.successRate >= 40 ? "bg-yellow-500/15" : "bg-muted/30";

  return (
    <div className="px-3 py-3 space-y-3">
      {cards.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 border border-border/30">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md ${scoreBg} shrink-0`}>
            <TrendingUp className={`w-4 h-4 ${scoreColor}`} />
            <span className={`text-sm font-bold ${scoreColor}`}>{feedback.successRate}%</span>
          </div>
          <p className="text-sm text-muted-foreground flex-1 min-w-0 leading-snug">
            <Sparkles className="w-3.5 h-3.5 text-primary inline mr-1" />
            {feedback.recommendation}
          </p>
        </div>
      )}
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          className={`flex-1 h-12 gap-2 text-base font-semibold transition-all duration-300 ${
            isGenerating
              ? "bg-primary/90 hover:bg-primary/80 animate-pulse"
              : ""
          }`}
          onClick={isGenerating ? onStop : onGenerate}
          disabled={!isGenerating && cards.length === 0}
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="flex-1 text-left">Finding leads…</span>
              <span className="flex items-center gap-1 text-xs opacity-80 font-normal bg-primary-foreground/20 px-2 py-0.5 rounded-md">
                <Square className="w-3 h-3" />
                Stop
              </span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4" />
              Generate Leads
            </>
          )}
        </Button>
        {hasCustomizations && onReset && (
          <Button
            variant="ghost"
            size="lg"
            className="h-12 px-3 gap-1.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={onReset}
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>
    </div>
  );
}