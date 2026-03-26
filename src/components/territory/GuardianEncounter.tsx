/**
 * GuardianEncounter — Cinematic fullscreen encounter with territory hero backdrop.
 * Uses HeroScene for immersive Ken Burns + letterbox cinematic experience.
 */

import { motion, AnimatePresence } from "framer-motion";
import { X, Swords, BookOpen, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TerritoryGuardian } from "@/lib/territory-guardians";
import HeroScene from "@/components/territory/HeroScene";
import { getTerritoryHeroImage } from "@/lib/territory-hero-images";

import guardIronclad from "@/assets/guardian-ironclad.png";
import guardLexicon from "@/assets/guardian-lexicon.png";
import guardSovereign from "@/assets/guardian-sovereign.png";
import guardHerald from "@/assets/guardian-herald.png";
import guardCrownweaver from "@/assets/guardian-crownweaver.png";
import guardPrisma from "@/assets/guardian-prisma.png";
import guardAegis from "@/assets/guardian-aegis.png";
import guardKindred from "@/assets/guardian-kindred.png";

const GUARDIAN_AVATARS: Record<string, string> = {
  ironclad: guardIronclad, lexicon: guardLexicon, sovereign: guardSovereign,
  herald: guardHerald, crownweaver: guardCrownweaver, prisma: guardPrisma,
  aegis: guardAegis, kindred: guardKindred,
};

interface GuardianEncounterProps {
  guardian: TerritoryGuardian;
  onClose: () => void;
  onChallenge?: (guardian: TerritoryGuardian) => void;
  /** Called when guardian is defeated — marks territory as conquered */
  onConquerTerritory?: (category: string) => void;
}

const cinzel = { fontFamily: "'Cinzel', serif" };

export default function GuardianEncounter({ guardian, onClose, onChallenge, onConquerTerritory }: GuardianEncounterProps) {
  const heroImage = getTerritoryHeroImage(guardian.category);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed inset-0 z-50 flex items-end justify-center"
      >
        {/* Fullscreen hero backdrop */}
        <HeroScene
          imageUrl={heroImage}
          intensity="full"
          camera="ken-burns"
          overlay="letterbox"
          hue={guardian.hue}
          className="absolute inset-0"
        />

        {/* Click-away backdrop */}
        <div className="absolute inset-0 z-[3]" onClick={onClose} />

        {/* Content panel — bottom-anchored cinematic dialogue */}
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-[4] w-full max-w-2xl mx-4 mb-8"
        >
          <div
            className="rounded-xl border-2 overflow-hidden backdrop-blur-xl flex"
            style={{
              background: `linear-gradient(135deg, hsl(${guardian.hue} 30% 8% / 0.92), hsl(${guardian.hue} 20% 12% / 0.92))`,
              borderColor: `hsl(${guardian.hue} 50% 40%)`,
              boxShadow: `0 0 60px hsl(${guardian.hue} 60% 30% / 0.5), inset 0 1px 0 hsl(${guardian.hue} 40% 30% / 0.3)`,
            }}
          >
            {/* Full-height character portrait */}
            <motion.div
              animate={{
                boxShadow: [
                  `4px 0 20px hsl(${guardian.hue} 60% 40% / 0.2)`,
                  `4px 0 40px hsl(${guardian.hue} 60% 40% / 0.5)`,
                  `4px 0 20px hsl(${guardian.hue} 60% 40% / 0.2)`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="w-36 shrink-0 relative pointer-events-none"
              style={{ borderRight: `2px solid hsl(${guardian.hue} 50% 35%)` }}
            >
              <img
                src={GUARDIAN_AVATARS[guardian.id] || guardIronclad}
                alt={guardian.name}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
              />
              <div
                className="absolute inset-0"
                style={{ background: `linear-gradient(to right, transparent 60%, hsl(${guardian.hue} 30% 8% / 0.4))` }}
              />
            </motion.div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="relative px-5 pt-4 pb-2 flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Shield className="h-3.5 w-3.5" style={{ color: `hsl(${guardian.hue} 50% 55%)` }} />
                    <span className="text-[10px] uppercase tracking-[0.15em] font-medium" style={{ color: `hsl(${guardian.hue} 40% 55%)` }}>
                      Territory Guardian
                    </span>
                  </div>
                  <h3
                    className="text-xl font-bold tracking-wide"
                    style={{ ...cinzel, color: `hsl(${guardian.hue} 50% 75%)` }}
                  >
                    {guardian.name}
                  </h3>
                  <p className="text-xs text-muted-foreground italic mt-0.5">{guardian.title}</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  style={{ background: `hsl(${guardian.hue} 20% 18%)` }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Challenge quote */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="px-5 pb-3"
              >
                <div
                  className="rounded-lg px-4 py-3 text-sm leading-relaxed"
                  style={{
                    background: `hsl(${guardian.hue} 20% 10% / 0.7)`,
                    borderLeft: `3px solid hsl(${guardian.hue} 50% 45%)`,
                    color: `hsl(${guardian.hue} 15% 82%)`,
                    fontStyle: "italic",
                  }}
                >
                  "{guardian.challengeQuote}"
                </div>
              </motion.div>

              {/* Lore */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="px-5 pb-3"
              >
                <p className="text-xs text-muted-foreground leading-relaxed">{guardian.lore}</p>
              </motion.div>

              {/* Actions */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1, duration: 0.4 }}
                className="px-5 pb-4 flex gap-3"
              >
                <Button
                  size="lg"
                  className="flex-1 gap-2 text-sm font-semibold"
                  style={{
                    background: `linear-gradient(135deg, hsl(${guardian.hue} 50% 35%), hsl(${guardian.hue} 60% 45%))`,
                    color: "white",
                    boxShadow: `0 0 30px hsl(${guardian.hue} 60% 40% / 0.4)`,
                  }}
                  onClick={() => onChallenge?.(guardian)}
                >
                  <Swords size={18} />
                  Accept Challenge
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  style={{
                    borderColor: `hsl(${guardian.hue} 30% 30%)`,
                    color: `hsl(${guardian.hue} 30% 65%)`,
                  }}
                  onClick={onClose}
                >
                  <BookOpen size={16} />
                  Later
                </Button>
              </motion.div>

              {/* Coaching hint */}
              <div
                className="px-5 py-2 text-[10px] text-muted-foreground/60 border-t"
                style={{ borderColor: `hsl(${guardian.hue} 20% 18%)` }}
              >
                💡 {guardian.coachingHint}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
