/**
 * XcrowLoader — Brand loading animation.
 * Stationary crow mascot with the brand "X" image behind it that breathes/flickers.
 */
import { motion } from "framer-motion";
import xcrowMascot from "@/assets/xcrow-mascot.png";
import xcrowXLetter from "@/assets/xcrow-x-letter.png";

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
  const xSize = size === "sm" ? 64 : size === "lg" ? 100 : 82;
  const containerSize = xSize + 20;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mascot + X container */}
      <div className="relative" style={{ width: containerSize, height: containerSize }}>
        {/* Brand "X" image behind mascot — breathing glow */}
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
          <img
            src={xcrowXLetter}
            alt=""
            className="drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]"
            style={{ width: xSize, height: xSize }}
            draggable={false}
          />
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
          <img
            src={xcrowXLetter}
            alt=""
            className="blur-md opacity-20"
            style={{ width: xSize * 1.1, height: xSize * 1.1 }}
            draggable={false}
          />
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