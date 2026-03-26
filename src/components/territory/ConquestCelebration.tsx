/**
 * ConquestCelebration — Full-screen cinematic celebration when a territory is conquered.
 * Shows particle explosion, guardian defeat text, and territory name.
 */
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Crown, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface ConquestCelebrationProps {
  guardianName: string;
  territoryName: string;
  hue: number;
  onComplete: () => void;
}

const cinzel = { fontFamily: "'Cinzel', serif" };

function Particle({ index, hue }: { index: number; hue: number }) {
  const angle = (index / 20) * Math.PI * 2 + Math.random() * 0.5;
  const distance = 120 + Math.random() * 200;
  const size = 3 + Math.random() * 6;
  const delay = Math.random() * 0.3;
  const targetX = Math.cos(angle) * distance;
  const targetY = Math.sin(angle) * distance;
  const colorVar = index % 3 === 0 ? 65 : index % 3 === 1 ? 50 : 40;

  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        background: `hsl(${hue} ${colorVar}% ${50 + Math.random() * 20}%)`,
        left: "50%",
        top: "50%",
        boxShadow: `0 0 ${size * 2}px hsl(${hue} 60% 50% / 0.6)`,
      }}
      initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
      animate={{
        x: targetX,
        y: targetY,
        opacity: 0,
        scale: 0.2,
      }}
      transition={{ duration: 1.2 + Math.random() * 0.6, delay, ease: "easeOut" }}
    />
  );
}

export default function ConquestCelebration({ guardianName, territoryName, hue, onComplete }: ConquestCelebrationProps) {
  const [phase, setPhase] = useState<"burst" | "text" | "fade">("burst");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("text"), 600);
    const t2 = setTimeout(() => setPhase("fade"), 3200);
    const t3 = setTimeout(onComplete, 3800);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[70] flex items-center justify-center"
        style={{ background: `hsl(${hue} 30% 4% / 0.95)` }}
        initial={{ opacity: 0 }}
        animate={{ opacity: phase === "fade" ? 0 : 1 }}
        transition={{ duration: phase === "fade" ? 0.6 : 0.3 }}
      >
        {/* Particle burst */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <Particle key={i} index={i} hue={hue} />
          ))}
        </div>

        {/* Glow ring */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 200,
            height: 200,
            background: `radial-gradient(circle, hsl(${hue} 60% 50% / 0.3) 0%, transparent 70%)`,
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 3, 2.5], opacity: [0, 0.6, 0] }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />

        {/* Central content */}
        <div className="relative z-10 text-center space-y-4">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: phase === "burst" ? [0, 1.4, 1] : 1, rotate: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, hsl(${hue} 55% 35%), hsl(${hue} 65% 50%))`,
              boxShadow: `0 0 60px hsl(${hue} 60% 45% / 0.6), 0 0 120px hsl(${hue} 60% 40% / 0.3)`,
            }}
          >
            <Crown className="text-white" size={36} />
          </motion.div>

          {/* Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: phase !== "burst" ? 1 : 0, y: phase !== "burst" ? 0 : 20 }}
            transition={{ duration: 0.5 }}
          >
            <motion.p
              className="text-xs uppercase tracking-[0.3em] font-medium mb-2"
              style={{ color: `hsl(${hue} 40% 55%)` }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              Territory Conquered
            </motion.p>
            <h1
              className="text-3xl md:text-4xl font-black tracking-wide"
              style={{ ...cinzel, color: `hsl(${hue} 50% 75%)` }}
            >
              {territoryName}
            </h1>
            <p className="text-sm mt-3" style={{ color: `hsl(${hue} 15% 60%)` }}>
              {guardianName} has been defeated
            </p>
          </motion.div>

          {/* Stars */}
          <motion.div
            className="flex justify-center gap-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: phase !== "burst" ? 1 : 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.8 + i * 0.15, type: "spring", stiffness: 300 }}
              >
                <Star
                  size={24}
                  fill={`hsl(${hue} 55% 55%)`}
                  stroke={`hsl(${hue} 60% 70%)`}
                  strokeWidth={1}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
