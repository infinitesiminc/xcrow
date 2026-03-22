/**
 * XcrowLoader — Brand loading animation using the Xcrow mascot.
 * Floating crow with pulsing glow, wing flap, and rotating ring.
 */
import { motion } from "framer-motion";
import xcrowLogo from "@/assets/xcrow-character.png";

interface XcrowLoaderProps {
  title?: string;
  subtitle?: string;
  size?: "sm" | "md" | "lg";
}

export default function XcrowLoader({
  title = "Loading…",
  subtitle,
  size = "md",
}: XcrowLoaderProps) {
  const imgSize = size === "sm" ? 48 : size === "lg" ? 80 : 64;
  const ringSize = imgSize + 28;
  const r = (ringSize - 6) / 2;
  const circ = 2 * Math.PI * r;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mascot + ring container */}
      <div className="relative" style={{ width: ringSize, height: ringSize }}>
        {/* Rotating arc ring */}
        <motion.svg
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          className="absolute inset-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
        >
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--muted-foreground) / 0.12)"
            strokeWidth="3"
          />
          <circle
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={r}
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
            className="drop-shadow-[0_0_6px_hsl(var(--primary)/0.5)]"
          />
        </motion.svg>

        {/* Pulsing glow behind mascot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div
            className="rounded-full bg-primary/20 blur-xl"
            style={{ width: imgSize * 0.8, height: imgSize * 0.8 }}
          />
        </motion.div>

        {/* Floating mascot */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{ y: [-3, 3, -3] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <img
            src={xcrowLogo}
            alt="Xcrow"
            className="object-contain grayscale opacity-80"
            style={{ width: imgSize, height: imgSize }}
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Text */}
      <div className="text-center">
        <motion.h2
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="text-base font-semibold text-foreground"
        >
          {title}
        </motion.h2>
        {subtitle && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-xs text-muted-foreground mt-1"
          >
            {subtitle}
          </motion.p>
        )}
      </div>
    </div>
  );
}
