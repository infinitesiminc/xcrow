/**
 * NPCEncounter — Cinematic fullscreen encounter when a player clicks a wandering NPC.
 * Mirrors GuardianEncounter pattern with HeroScene backdrop + cinematic dialogue.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, Eye, Swords, Map, Hammer, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WanderingNPC } from "@/lib/wandering-npcs";
import HeroScene from "@/components/territory/HeroScene";
import { getTerritoryHeroImage } from "@/lib/territory-hero-images";
import type { FutureSkillCategory } from "@/hooks/use-future-skills";

import npcMerchant from "@/assets/npc-merchant.png";
import npcOracle from "@/assets/npc-oracle.png";
import npcRival from "@/assets/npc-rival.png";
import npcScout from "@/assets/npc-scout.png";
import npcBlacksmith from "@/assets/npc-blacksmith.png";
import npcBard from "@/assets/npc-bard.png";

interface NPCEncounterProps {
  npc: WanderingNPC;
  territory?: FutureSkillCategory;
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

/** Lucide icon components keyed by NPC iconName */
const NPC_ICON_COMPONENTS: Record<string, typeof Gem> = {
  gem: Gem,
  eye: Eye,
  swords: Swords,
  compass: Compass,
  hammer: Hammer,
  "scroll-text": ScrollText,
};

const NPC_HUES: Record<string, number> = {
  merchant: 280,
  oracle: 220,
  rival: 0,
  scout: 150,
  blacksmith: 25,
  bard: 45,
};

const NPC_TERRITORY_FALLBACK: Record<string, FutureSkillCategory> = {
  merchant: "Strategic",
  oracle: "Analytical",
  rival: "Technical",
  scout: "Leadership",
  blacksmith: "Technical",
  bard: "Creative",
};

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function NPCEncounter({ npc, territory, onClose, onInteract }: NPCEncounterProps) {
  const ActionIcon = INTERACTION_ICONS[npc.interactionType] || BookOpen;
  const label = INTERACTION_LABELS[npc.interactionType] || "Interact";
  const hue = NPC_HUES[npc.id] ?? 200;
  const heroTerritory = territory || NPC_TERRITORY_FALLBACK[npc.id] || "Technical";
  const heroImage = getTerritoryHeroImage(heroTerritory);
  const AvatarIcon = NPC_ICON_COMPONENTS[npc.iconName] || Gem;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
      >
        <HeroScene
          imageUrl={heroImage}
          intensity="full"
          camera="ken-burns"
          overlay="letterbox"
          hue={hue}
          className="absolute inset-0"
        />

        <div className="absolute inset-0 z-[3]" onClick={onClose} />

        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.5, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-[4] w-full max-w-xl mx-4 mb-8"
        >
          <div
            className="rounded-xl border-2 overflow-hidden backdrop-blur-xl"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 30% 8% / 0.92), hsl(${hue} 20% 12% / 0.92))`,
              borderColor: `hsl(${hue} 45% 35%)`,
              boxShadow: `0 0 50px hsl(${hue} 55% 30% / 0.4), inset 0 1px 0 hsl(${hue} 35% 28% / 0.3)`,
            }}
          >
            {/* Header */}
            <div className="relative px-5 pt-4 pb-2 flex items-start gap-3">
              <motion.div
                animate={{
                  boxShadow: [
                    `0 0 15px hsl(${hue} 55% 40% / 0.25)`,
                    `0 0 30px hsl(${hue} 55% 40% / 0.5)`,
                    `0 0 15px hsl(${hue} 55% 40% / 0.25)`,
                  ],
                }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 35% 15%), hsl(${hue} 25% 20%))`,
                  border: `2px solid hsl(${hue} 45% 32%)`,
                }}
              >
                <AvatarIcon size={28} style={{ color: `hsl(${hue} 50% 65%)` }} />
              </motion.div>
              <div className="flex-1 min-w-0">
                <span
                  className="text-[10px] uppercase tracking-[0.15em] font-medium"
                  style={{ color: `hsl(${hue} 35% 52%)` }}
                >
                  Wandering {npc.title}
                </span>
                <h3
                  className="text-lg font-bold tracking-wide"
                  style={{ ...cinzel, color: `hsl(${hue} 45% 72%)` }}
                >
                  {npc.name}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: `hsl(${hue} 20% 16%)` }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Greeting */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5, duration: 0.45 }}
              className="px-5 pb-3"
            >
              <div
                className="rounded-lg px-4 py-3 text-sm leading-relaxed"
                style={{
                  background: `hsl(${hue} 18% 10% / 0.7)`,
                  borderLeft: `3px solid hsl(${hue} 45% 42%)`,
                  color: `hsl(${hue} 12% 80%)`,
                  fontStyle: "italic",
                }}
              >
                "{npc.greeting}"
              </div>
            </motion.div>

            {/* Offering */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="px-5 pb-3"
            >
              <p className="text-xs text-muted-foreground leading-relaxed">{npc.offering}</p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.85, duration: 0.4 }}
              className="px-5 pb-4 flex gap-3"
            >
              <Button
                size="lg"
                className="flex-1 gap-2 text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, hsl(${hue} 45% 32%), hsl(${hue} 55% 42%))`,
                  color: "white",
                  boxShadow: `0 0 25px hsl(${hue} 55% 38% / 0.35)`,
                }}
                onClick={() => onInteract?.(npc)}
              >
                <ActionIcon size={16} />
                {label}
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="gap-2"
                style={{
                  borderColor: `hsl(${hue} 25% 28%)`,
                  color: `hsl(${hue} 25% 62%)`,
                }}
                onClick={onClose}
              >
                Walk Away
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
