import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Target, X, Zap, Loader2, Sparkles, TrendingUp,
  Package, Building2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

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

interface AIFeedback {
  successRate: number;
  recommendation: string;
  loading: boolean;
}

export default function TargetZone({
  cards, onRemoveCard, onGenerate, isGenerating, companySummary,
}: TargetZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [feedback, setFeedback] = useState<AIFeedback>({ successRate: 0, recommendation: "", loading: false });
  const feedbackTimeout = useRef<ReturnType<typeof setTimeout>>();

  const hasProducts = cards.some(c => c.type === "product");
  const hasVerticals = cards.some(c => c.type === "vertical");

  // Fetch AI feedback when cards change
  const fetchFeedback = useCallback(async () => {
    if (cards.length === 0) {
      setFeedback({ successRate: 0, recommendation: "Drag product or vertical cards here to build your targeting criteria.", loading: false });
      return;
    }

    setFeedback(prev => ({ ...prev, loading: true }));

    // Compute heuristic score locally (fast, no API call needed)
    let score = 30; // base
    if (hasProducts) score += 25;
    if (hasVerticals) score += 30;
    if (hasProducts && hasVerticals) score += 15; // combo bonus

    const productCards = cards.filter(c => c.type === "product");
    const verticalCards = cards.filter(c => c.type === "vertical");

    let recommendation = "";
    if (!hasProducts && !hasVerticals) {
      recommendation = "Start by dragging a product card to define what you're selling.";
    } else if (hasProducts && !hasVerticals) {
      recommendation = "Great product selection! Now add a vertical to narrow your target market.";
    } else if (!hasProducts && hasVerticals) {
      recommendation = "Good vertical focus! Add a product card to specify what solution you're targeting.";
    } else if (productCards.length === 1 && verticalCards.length === 1) {
      recommendation = `Strong combo: ${productCards[0].label} × ${verticalCards[0].label}. Ready to generate high-quality leads!`;
    } else if (productCards.length > 1 || verticalCards.length > 1) {
      recommendation = `Multi-target strategy: ${cards.length} criteria selected. Broader search — expect more diverse results.`;
    }

    setFeedback({ successRate: Math.min(score, 95), recommendation, loading: false });
  }, [cards, hasProducts, hasVerticals]);

  useEffect(() => {
    if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current);
    feedbackTimeout.current = setTimeout(fetchFeedback, 300);
    return () => { if (feedbackTimeout.current) clearTimeout(feedbackTimeout.current); };
  }, [fetchFeedback]);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    // Parent handles the actual drop via onDrop on the container
  }

  const scoreColor = feedback.successRate >= 70
    ? "text-green-600"
    : feedback.successRate >= 40
    ? "text-yellow-600"
    : "text-muted-foreground";

  const scoreBg = feedback.successRate >= 70
    ? "bg-green-500/15"
    : feedback.successRate >= 40
    ? "bg-yellow-500/15"
    : "bg-muted/30";

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`mx-4 mb-3 rounded-xl border-2 border-dashed transition-all ${
        isDragOver
          ? "border-primary bg-primary/5 shadow-inner"
          : cards.length > 0
          ? "border-primary/30 bg-card"
          : "border-border/60 bg-muted/10"
      }`}
    >
      {cards.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-6 gap-2">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDragOver ? "bg-primary/20" : "bg-muted/40"
          }`}>
            <Target className={`w-5 h-5 ${isDragOver ? "text-primary" : "text-muted-foreground"}`} />
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            {isDragOver ? "Drop to add targeting criteria" : "Drag cards here to build your lead search"}
          </p>
          <p className="text-xs text-muted-foreground/70">
            Combine products + verticals for best results
          </p>
        </div>
      ) : (
        /* Cards + feedback */
        <div className="p-3">
          {/* Dropped cards as chips */}
          <div className="flex flex-wrap gap-2 mb-3">
            {cards.map(card => (
              <div
                key={card.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/30 bg-primary/5 text-sm"
              >
                {card.type === "product" ? (
                  <Package className="w-3.5 h-3.5 text-primary shrink-0" />
                ) : (
                  <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                )}
                <span className="font-medium text-foreground">{card.label}</span>
                {card.meta && card.type === "vertical" && (
                  <span className="text-xs text-muted-foreground">· DM: {card.meta}</span>
                )}
                <button
                  onClick={() => onRemoveCard(card.id)}
                  className="ml-1 p-0.5 rounded hover:bg-destructive/10 transition-colors"
                >
                  <X className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                </button>
              </div>
            ))}
          </div>

          {/* AI Feedback bar */}
          <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/20 border border-border/40">
            {/* Success rate */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${scoreBg} shrink-0`}>
              <TrendingUp className={`w-3.5 h-3.5 ${scoreColor}`} />
              <span className={`text-sm font-semibold ${scoreColor}`}>{feedback.successRate}%</span>
            </div>

            {/* Recommendation */}
            <div className="flex-1 min-w-0">
              {feedback.loading ? (
                <div className="flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Analyzing targeting combo…</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <Sparkles className="w-3 h-3 text-primary inline mr-1" />
                  {feedback.recommendation}
                </p>
              )}
            </div>

            {/* Generate button */}
            <Button
              size="sm"
              className="h-8 gap-1.5 text-xs shrink-0"
              onClick={onGenerate}
              disabled={isGenerating || cards.length === 0}
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5" />
              )}
              Generate Leads
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
