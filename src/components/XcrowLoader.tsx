/**
 * XcrowLoader — Brand loading animation.
 * Stationary crow mascot with a bold "X" letter behind it that breathes/flickers.
 */
import { motion } from "framer-motion";
import xcrowMascot from "@/assets/xcrow-mascot.png";

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
  const xFontSize = size === "sm" ? 52 : size === "lg" ? 88 : 70;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mascot + ring + X container */}
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
            stroke="hsl(var(--primary) / 0.5)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${circ * 0.3} ${circ * 0.7}`}
            className="drop-shadow-[0_0_4px_hsl(var(--primary)/0.3)]"
          />
        </motion.svg>

        {/* Bold "X" letter behind mascot — breathing glow */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          animate={{
            opacity: [1, 0.12, 1],
            scale: [1, 0.92, 1],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span
            className="font-black text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]"
            style={{
              fontSize: xFontSize,
              lineHeight: 1,
              fontFamily: "'Cinzel', 'Inter', serif",
              letterSpacing: "-0.04em",
            }}
          >
            X
          </span>
        </motion.div>

        {/* X glow halo — secondary pulse offset */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center select-none pointer-events-none"
          animate={{
            opacity: [0.5, 0, 0.5],
            scale: [1.1, 1.3, 1.1],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          <span
            className="font-black text-white/20 blur-md"
            style={{
              fontSize: xFontSize * 1.1,
              lineHeight: 1,
              fontFamily: "'Cinzel', 'Inter', serif",
            }}
          >
            X
          </span>
        </motion.div>

        {/* Stationary crow mascot on top */}
        <div className="absolute inset-0 flex items-center justify-center">
          <img
            src={xcrowMascot}
            alt="Xcrow"
            className="object-contain drop-shadow-[0_2px_8px_hsl(var(--primary)/0.2)]"
            style={{ width: imgSize, height: imgSize }}
            draggable={false}
          />
        </div>
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
