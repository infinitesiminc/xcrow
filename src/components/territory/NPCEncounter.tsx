/**
 * NPCEncounter — Pop-up panel when a player clicks a wandering NPC on the map.
 * Each NPC archetype shows different content based on their interactionType.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Eye, Swords, Map, Hammer, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WanderingNPC } from "@/lib/wandering-npcs";

interface NPCEncounterProps {
  npc: WanderingNPC;
  onClose: () => void;
  onInteract?: (npc: WanderingNPC) => void;
}

const INTERACTION_ICONS: Record<string, typeof ShoppingBag> = {
  shop: ShoppingBag,
  prophecy: Eye,
  duel: Swords,
  intel: Map,
  upgrade: Hammer,
  story: BookOpen,
};

const INTERACTION_LABELS: Record<string, string> = {
  shop: "Browse Wares",
  prophecy: "Hear Prophecy",
  duel: "Accept Duel",
  intel: "Get Intel",
  upgrade: "Forge Skill",
  story: "Hear Tale",
};

export default function NPCEncounter({ npc, onClose, onInteract }: NPCEncounterProps) {
  const Icon = INTERACTION_ICONS[npc.interactionType] || BookOpen;
  const label = INTERACTION_LABELS[npc.interactionType] || "Interact";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.96 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-[380px] max-w-[88vw]"
      >
        <div className="rounded-xl border border-border/60 overflow-hidden backdrop-blur-xl bg-card/95 shadow-xl">
          {/* Header */}
          <div className="px-4 pt-3 pb-2 flex items-start gap-3">
            <div className="w-12 h-12 rounded-lg bg-muted/50 flex items-center justify-center text-2xl shrink-0 border border-border/40">
              {npc.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                {npc.name}
              </h3>
              <p className="text-xs text-muted-foreground">{npc.title}</p>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={14} />
            </button>
          </div>

          {/* Greeting */}
          <div className="px-4 pb-2">
            <div className="rounded-lg bg-muted/30 px-3 py-2 text-sm italic text-muted-foreground border-l-2 border-primary/40">
              "{npc.greeting}"
            </div>
          </div>

          {/* Offering description */}
          <div className="px-4 pb-3">
            <p className="text-xs text-muted-foreground/80">{npc.offering}</p>
          </div>

          {/* Actions */}
          <div className="px-4 pb-3 flex gap-2">
            <Button
              size="sm"
              className="flex-1 gap-1.5"
              onClick={() => onInteract?.(npc)}
            >
              <Icon size={14} />
              {label}
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}>
              Walk Away
            </Button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
