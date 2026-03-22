/**
 * XcrowLoader — Brand loading animation.
 * Simple fade in/out pulse of the logo.
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
      <motion.img
        src={xcrowLogo}
        alt="Xcrow"
        className="object-contain drop-shadow-[0_0_24px_hsl(var(--primary)/0.35)]"
        style={{ width: imgSize, height: imgSize }}
        draggable={false}
        animate={{ opacity: [1, 0.3, 1] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />

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
