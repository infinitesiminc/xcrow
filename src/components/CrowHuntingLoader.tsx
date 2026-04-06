/**
 * CrowHuntingLoader — Branded crow logo with hunting radar animation.
 */
import { motion } from "framer-motion";
import logoCrow from "@/assets/logo-crow.png";

interface CrowHuntingLoaderProps {
  label?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: 80, crow: 36, text: "text-xs" },
  md: { box: 140, crow: 56, text: "text-sm" },
  lg: { box: 200, crow: 80, text: "text-base" },
};

export default function CrowHuntingLoader({
  label = "Hunting leads…",
  size = "md",
  className = "",
}: CrowHuntingLoaderProps) {
  const s = SIZES[size];

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <div className="relative" style={{ width: s.box, height: s.box }}>
        {/* Radar rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="absolute inset-0 rounded-full border border-primary/20"
            initial={{ scale: 0.3, opacity: 0.6 }}
            animate={{ scale: 1.2, opacity: 0 }}
            transition={{
              duration: 2,
              delay: i * 0.6,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
        ))}

        {/* Scanning line */}
        <motion.div
          className="absolute left-1/2 top-1/2 origin-bottom"
          style={{ width: 2, height: s.box / 2 - 4, marginLeft: -1, marginTop: -(s.box / 2 - 4) }}
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <div className="w-full h-full bg-gradient-to-t from-primary/40 to-transparent rounded-full" />
        </motion.div>

        {/* Actual crow logo */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            y: [0, -6, 2, -4, 0],
            rotate: [0, -5, 3, -2, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: [0.25, 0.46, 0.45, 0.94],
          }}
        >
          <img
            src={logoCrow}
            alt="Xcrow"
            style={{ width: s.crow, height: s.crow }}
            className="object-contain drop-shadow-md"
          />
        </motion.div>

        {/* Target dots — leads being found */}
        {[
          { x: "15%", y: "70%", delay: 0.5 },
          { x: "75%", y: "25%", delay: 1.2 },
          { x: "80%", y: "75%", delay: 2.0 },
        ].map((dot, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 rounded-full bg-primary"
            style={{ left: dot.x, top: dot.y }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: [0, 1.5, 1, 0],
              opacity: [0, 1, 0.8, 0],
            }}
            transition={{
              duration: 1.5,
              delay: dot.delay,
              repeat: Infinity,
              repeatDelay: 1.5,
            }}
          />
        ))}
      </div>

      {label && (
        <motion.p
          className={`${s.text} font-medium text-muted-foreground`}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {label}
        </motion.p>
      )}
    </div>
  );
}
