/**
 * NPCMechanics — Actual game mechanics for each Wandering NPC archetype.
 * Each NPC type opens a distinct mini-interaction panel.
 */
import { motion } from "framer-motion";
import { motion } from "framer-motion";
import { Gem, Eye, Swords, Compass, Hammer, ScrollText, ChevronRight, X, Sparkles, Star, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WanderingNPC } from "@/lib/wandering-npcs";
import type { FutureSkillCategory } from "@/hooks/use-future-skills";
import { TERRITORY_ORDER } from "@/lib/territory-colors";

interface NPCMechanicsProps {
  npc: WanderingNPC;
  territory: FutureSkillCategory;
  scoutedSkillCount: number;
  territoriesScouted: Set<string>;
  onClose: () => void;
  /** Navigate user to a territory on the map */
  onFocusTerritory?: (category: FutureSkillCategory) => void;
  /** Launch a quick sim challenge */
  onQuickChallenge?: () => void;
}

const cinzel = { fontFamily: "'Cinzel', serif" };

/** Merchant: shows XP trade offers */
function MerchantShop({ territory, onClose }: { territory: FutureSkillCategory; onClose: () => void }) {
  const offers = [
    { name: "Hint Scroll", desc: "Reveals the best skill to practice next", cost: "5 XP", emoji: "📜" },
    { name: "Territory Map", desc: "Highlights all undiscovered skills in this territory", cost: "10 XP", emoji: "🗺️" },
    { name: "Lucky Charm", desc: "+5% score bonus on your next sim", cost: "15 XP", emoji: "🍀" },
  ];

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">Browse my wares, adventurer:</p>
      {offers.map((offer, i) => (
        <motion.div
          key={offer.name}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.1 }}
          className="rounded-lg p-3 flex items-center gap-3 cursor-pointer hover:brightness-110 transition-all"
          style={{
            background: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
          }}
        >
          <span className="text-xl">{offer.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-foreground">{offer.name}</p>
            <p className="text-[10px] text-muted-foreground">{offer.desc}</p>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary whitespace-nowrap">
            {offer.cost}
          </span>
        </motion.div>
      ))}
      <p className="text-[10px] text-muted-foreground/60 text-center italic">Shop coming soon — earn XP through quests!</p>
    </div>
  );
}

/** Oracle: shows territory prophecy / trending skill insights */
function OracleProphecy({ territory, territoriesScouted }: { territory: FutureSkillCategory; territoriesScouted: Set<string> }) {
  const unexplored = TERRITORY_ORDER.filter(t => !territoriesScouted.has(t));
  const prophecies = [
    { text: `The ${territory} territory grows in power. Those who master it early will lead.`, icon: Star },
    { text: unexplored.length > 0
      ? `I sense untapped potential in the ${unexplored[0]} lands. Have you explored there?`
      : "You have walked all territories. Impressive. Now go deeper.", icon: Eye },
    { text: "A great challenge approaches. The Guardians grow restless. Are you prepared?", icon: Sparkles },
  ];

  return (
    <div className="space-y-3">
      {prophecies.map((p, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 + i * 0.3 }}
          className="flex items-start gap-2"
        >
          <p.icon size={14} className="shrink-0 mt-0.5 text-primary/70" />
          <p className="text-xs text-muted-foreground leading-relaxed italic">"{p.text}"</p>
        </motion.div>
      ))}
    </div>
  );
}

/** Rival: speed challenge teaser */
function RivalDuel({ onQuickChallenge, onClose }: { onQuickChallenge?: () => void; onClose: () => void }) {
  return (
    <div className="space-y-4 text-center">
      <motion.div
        animate={{ rotate: [0, -5, 5, -5, 0] }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="text-4xl"
      >
        ⚔️
      </motion.div>
      <p className="text-sm text-muted-foreground">
        "Think you're fast? Let's see if you can clear a sim in under 3 minutes. Winner gets bragging rights."
      </p>
      <Button
        onClick={onQuickChallenge}
        className="gap-2"
        style={{
          background: "linear-gradient(135deg, hsl(0 50% 35%), hsl(0 60% 45%))",
          color: "white",
        }}
      >
        <Swords size={14} />
        Accept Duel
      </Button>
      <p className="text-[10px] text-muted-foreground/60 italic">Speed duels coming soon!</p>
    </div>
  );
}

/** Scout: recommends next territory to explore */
function ScoutIntel({ territoriesScouted, onFocusTerritory }: { territoriesScouted: Set<string>; onFocusTerritory?: (c: FutureSkillCategory) => void }) {
  const unexplored = TERRITORY_ORDER.filter(t => !territoriesScouted.has(t));
  const explored = TERRITORY_ORDER.filter(t => territoriesScouted.has(t));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        {unexplored.length > 0
          ? `You've explored ${explored.length} of ${TERRITORY_ORDER.length} territories. Here's where to go next:`
          : "You've explored every territory! Now master them."}
      </p>
      {unexplored.slice(0, 3).map((terr, i) => {
        return (
          <motion.button
            key={terr}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            onClick={() => onFocusTerritory?.(terr as FutureSkillCategory)}
            className="w-full text-left rounded-lg p-3 flex items-center gap-3 hover:brightness-110 transition-all bg-card border border-border"
          >
            <MapPin size={14} className="text-primary/70" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground">{terr}</p>
              <p className="text-[10px] text-muted-foreground">Unexplored — talk to NPCs here</p>
            </div>
            <ChevronRight size={12} className="text-muted-foreground" />
          </motion.button>
        );
      })}
      {unexplored.length === 0 && (
        <div className="text-center py-3">
          <span className="text-2xl">🏆</span>
          <p className="text-xs text-primary mt-1 font-semibold">All territories scouted!</p>
        </div>
      )}
    </div>
  );
}

/** Blacksmith: shows weakest skills for targeted practice */
function BlacksmithForge() {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        "Bring me your weakest skill. I'll forge it into something stronger through focused practice."
      </p>
      <div className="rounded-lg p-4 text-center" style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}>
        <Hammer size={24} className="mx-auto text-orange-400 mb-2" />
        <p className="text-xs text-muted-foreground">Complete sims to identify your weakest skills.</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">Targeted drills unlock after your first sim.</p>
      </div>
    </div>
  );
}

/** Bard: tells a lore story about the territory */
function BardStory({ territory }: { territory: FutureSkillCategory }) {
  const stories: Record<string, string> = {
    "Technical": "In the age before AI, engineers wrote every line by hand. Then came the Code Companions — AI pair programmers that could scaffold entire applications. But they had a fatal flaw: they couldn't understand WHY code needed to exist, only HOW to write it.",
    "Analytical": "The Data Highlands were once a wilderness of spreadsheets. The first analysts who learned to wield AI discovered they could see patterns invisible to the human eye — but they also learned that AI could find 'patterns' that were pure illusion.",
    "Strategic": "From the Command Summit, the greatest strategists watched as AI learned to predict market shifts. But they kept a secret: the best strategies aren't about prediction. They're about creating futures that don't exist yet.",
    "Communication": "The Bridge Isles connected all territories through the power of words. When AI learned to write, many feared the bridges would crumble. Instead, they multiplied — but only for those who could distinguish authentic voice from algorithmic echo.",
    "Leadership": "Crown Heights has crowned many rulers, but the wisest knew that leading humans and AI requires different skills. You must inspire the humans and optimize the machines — never confuse the two.",
    "Creative": "The Prism Coast births new ideas daily. AI brought a flood of creative output, but the true artists learned to surf that wave rather than drown in it. Quality, they found, still requires a human soul.",
    "Ethics & Compliance": "The Watchtower stands at the boundary between progress and peril. Its sentinels learned the hardest lesson: the most dangerous AI isn't the one that's malicious — it's the one that's biased in ways nobody notices.",
    "Human Edge": "Soul Springs feeds the one resource no machine can replicate: genuine human connection. In a world of AI, those who can truly listen, empathize, and build trust hold the most valuable skill of all.",
  };

  return (
    <div className="space-y-3">
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-xs text-muted-foreground leading-relaxed italic"
      >
        "{stories[territory] || stories["Technical"]}"
      </motion.p>
      <p className="text-[10px] text-muted-foreground/50 text-center">— From the Chronicles of the AI Frontier</p>
    </div>
  );
}

export default function NPCMechanics({
  npc, territory, scoutedSkillCount, territoriesScouted,
  onClose, onFocusTerritory, onQuickChallenge,
}: NPCMechanicsProps) {
  const content = (() => {
    switch (npc.interactionType) {
      case "shop": return <MerchantShop territory={territory} onClose={onClose} />;
      case "prophecy": return <OracleProphecy territory={territory} territoriesScouted={territoriesScouted} />;
      case "duel": return <RivalDuel onQuickChallenge={onQuickChallenge} onClose={onClose} />;
      case "intel": return <ScoutIntel territoriesScouted={territoriesScouted} onFocusTerritory={onFocusTerritory} />;
      case "upgrade": return <BlacksmithForge />;
      case "story": return <BardStory territory={territory} />;
      default: return <p className="text-xs text-muted-foreground">This NPC has nothing to offer right now.</p>;
    }
  })();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "hsl(var(--background) / 0.8)" }}
    >
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="relative z-10 w-full max-w-sm mx-4 rounded-xl border border-border/60 bg-card/95 backdrop-blur-xl overflow-hidden"
        style={{ boxShadow: "0 20px 60px hsl(var(--background) / 0.5)" }}
      >
        {/* Header */}
        <div className="px-5 pt-4 pb-3 flex items-center gap-3 border-b border-border/40">
          <span className="text-2xl">{npc.emoji}</span>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-foreground" style={cinzel}>{npc.name}</h3>
            <p className="text-[10px] text-muted-foreground">{npc.title}</p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-lg flex items-center justify-center bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 py-4">
          {content}
        </div>
      </motion.div>
    </motion.div>
  );
}
