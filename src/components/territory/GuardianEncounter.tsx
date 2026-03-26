/**
 * GuardianEncounter — Cinematic encounter panel when a player clicks a territory guardian.
 * Shows the guardian's lore, challenge quote, and action buttons.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TerritoryGuardian } from "@/lib/territory-guardians";

interface GuardianEncounterProps {
  guardian: TerritoryGuardian;
  onClose: () => void;
  onChallenge?: (guardian: TerritoryGuardian) => void;
}

export default function GuardianEncounter({ guardian, onClose, onChallenge }: GuardianEncounterProps) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[420px] max-w-[90vw]"
      >
        <div
          className="rounded-xl border-2 overflow-hidden backdrop-blur-xl"
          style={{
            background: `linear-gradient(135deg, hsl(${guardian.hue} 30% 8% / 0.95), hsl(${guardian.hue} 20% 12% / 0.95))`,
            borderColor: `hsl(${guardian.hue} 50% 40%)`,
            boxShadow: `0 0 40px hsl(${guardian.hue} 60% 30% / 0.4), inset 0 1px 0 hsl(${guardian.hue} 40% 30% / 0.3)`,
          }}
        >
          {/* Header */}
          <div className="relative px-5 pt-4 pb-3 flex items-start gap-3">
            {/* Guardian emoji avatar */}
            <div
              className="w-14 h-14 rounded-lg flex items-center justify-center text-3xl shrink-0"
              style={{
                background: `hsl(${guardian.hue} 40% 15%)`,
                border: `2px solid hsl(${guardian.hue} 50% 35%)`,
                boxShadow: `0 0 20px hsl(${guardian.hue} 60% 40% / 0.3)`,
              }}
            >
              {guardian.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3
                className="text-base font-bold tracking-wide"
                style={{
                  fontFamily: "'Cinzel', serif",
                  color: `hsl(${guardian.hue} 50% 75%)`,
                }}
              >
                {guardian.name}
              </h3>
              <p className="text-xs text-muted-foreground italic">{guardian.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              style={{ background: `hsl(${guardian.hue} 20% 18%)` }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Challenge quote */}
          <div className="px-5 pb-3">
            <div
              className="rounded-lg px-4 py-3 text-sm italic leading-relaxed"
              style={{
                background: `hsl(${guardian.hue} 20% 12%)`,
                borderLeft: `3px solid hsl(${guardian.hue} 50% 45%)`,
                color: `hsl(${guardian.hue} 20% 80%)`,
              }}
            >
              "{guardian.challengeQuote}"
            </div>
          </div>

          {/* Lore */}
          <div className="px-5 pb-3">
            <p className="text-xs text-muted-foreground leading-relaxed">
              {guardian.lore}
            </p>
          </div>

          {/* Actions */}
          <div className="px-5 pb-4 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              style={{
                background: `hsl(${guardian.hue} 50% 35%)`,
                color: "white",
              }}
              onClick={() => onChallenge?.(guardian)}
            >
              <Swords size={14} />
              Accept Challenge
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              style={{
                borderColor: `hsl(${guardian.hue} 30% 30%)`,
                color: `hsl(${guardian.hue} 30% 65%)`,
              }}
              onClick={onClose}
            >
              <BookOpen size={14} />
              Later
            </Button>
          </div>

          {/* Coaching hint (subtle) */}
          <div
            className="px-5 py-2 text-[10px] text-muted-foreground/60 border-t"
            style={{ borderColor: `hsl(${guardian.hue} 20% 20%)` }}
          >
            💡 {guardian.coachingHint}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
