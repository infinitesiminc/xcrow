/**
 * XcrowLoader — Brand loading animation.
 * Crow logo with smooth fade in/out pulse effect.
 */
import { motion } from "framer-motion";
import xcrowLogo from "@/assets/xcrow-logo.png";

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
  const imgSize = size === "sm" ? 56 : size === "lg" ? 96 : 72;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Logo with fade pulse */}
      <motion.div
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        <img
          src={xcrowLogo}
          alt="Xcrow"
          className="object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
          style={{ width: imgSize, height: imgSize }}
          draggable={false}
        />
      </motion.div>

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
