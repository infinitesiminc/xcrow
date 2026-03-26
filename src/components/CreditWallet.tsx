/**
 * CreditWallet — Compact credit balance display for the navbar/HUD.
 * Shows current balance with a coin icon, click opens credit details.
 */

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Coins, Plus, ChevronDown, Sparkles, Zap } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { useAuth } from "@/contexts/AuthContext";
import { CREDIT_ACTIONS, type CreditAction } from "@/lib/credit-config";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function CreditWallet() {
  const { balance, loading } = useCredits();
  const { user, isPro } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  if (!user) return null;

  const isLow = balance <= 3 && !isPro;

  return (
    <div className="relative">
      {/* Compact pill */}
      <button
        onClick={() => setExpanded(!expanded)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
          isLow
            ? "bg-destructive/10 border-destructive/30 text-destructive"
            : "bg-muted/50 border-border/40 text-foreground"
        }`}
      >
        <Coins size={13} className={isLow ? "text-destructive" : "text-amber-500"} />
        <span>{loading ? "…" : balance}</span>
        <ChevronDown size={11} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>

      {/* Expanded dropdown */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-[260px] z-50 rounded-xl border border-border/60 bg-card shadow-xl backdrop-blur-xl overflow-hidden"
          >
            {/* Balance header */}
            <div className="px-4 py-3 border-b border-border/30 flex items-center justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Credit Balance</p>
                <p className="text-2xl font-bold flex items-center gap-1.5">
                  <Coins size={18} className="text-amber-500" />
                  {balance}
                </p>
              </div>
              {isPro && (
                <div className="flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 rounded-full px-2 py-0.5">
                  <Sparkles size={10} />
                  Champion
                </div>
              )}
            </div>

            {/* Cost reference */}
            <div className="px-4 py-2">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1.5">Credit Costs</p>
              <div className="space-y-1">
                {Object.values(CREDIT_ACTIONS)
                  .filter(a => a.cost > 0)
                  .map(a => (
                    <div key={a.action} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {a.emoji} {a.label}
                      </span>
                      <span className="font-mono font-semibold text-foreground">
                        {a.cost} <Coins size={10} className="inline text-amber-500" />
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Actions */}
            <div className="px-4 py-3 border-t border-border/30 flex gap-2">
              <Button
                size="sm"
                className="flex-1 gap-1 text-xs"
                onClick={() => { setExpanded(false); navigate("/pricing"); }}
              >
                <Plus size={12} />
                Get Credits
              </Button>
              {isLow && !isPro && (
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1 text-xs"
                  onClick={() => { setExpanded(false); navigate("/pricing"); }}
                >
                  <Zap size={12} />
                  Upgrade
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click-away */}
      {expanded && (
        <div className="fixed inset-0 z-40" onClick={() => setExpanded(false)} />
      )}
    </div>
  );
}
