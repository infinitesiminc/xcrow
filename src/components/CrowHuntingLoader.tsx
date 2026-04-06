/**
 * CrowHuntingLoader — An animated SVG crow that "hunts" leads.
 * The crow dives, scans, and swoops with a pulsing radar effect.
 * Use as a branded loading indicator across the app.
 */
import { motion } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 0.46, 0.45, 0.94];

interface CrowHuntingLoaderProps {
  /** Optional label below the animation */
  label?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  className?: string;
}

const SIZES = {
  sm: { box: 80, crow: 32, text: "text-xs" },
  md: { box: 140, crow: 52, text: "text-sm" },
  lg: { box: 200, crow: 72, text: "text-base" },
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

        {/* Crow SVG — diving/swooping */}
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            y: [0, -6, 2, -4, 0],
            rotate: [0, -8, 5, -3, 0],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: EASE,
          }}
        >
          <svg
            width={s.crow}
            height={s.crow}
            viewBox="0 0 64 64"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Body */}
            <motion.path
              d="M32 18C22 18 14 24 14 32C14 40 22 48 32 48C42 48 50 40 50 32C50 24 42 18 32 18Z"
              fill="hsl(var(--primary))"
              fillOpacity={0.15}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: EASE }}
            />
            {/* Left wing — swooping */}
            <motion.path
              d="M14 32C14 32 6 22 2 20C6 24 10 28 14 32Z"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              animate={{
                d: [
                  "M14 32C14 32 6 22 2 20C6 24 10 28 14 32Z",
                  "M14 32C14 32 4 18 1 14C5 20 10 26 14 32Z",
                  "M14 32C14 32 6 22 2 20C6 24 10 28 14 32Z",
                ],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: EASE }}
            />
            {/* Right wing — swooping */}
            <motion.path
              d="M50 32C50 32 58 22 62 20C58 24 54 28 50 32Z"
              fill="hsl(var(--primary))"
              fillOpacity={0.3}
              animate={{
                d: [
                  "M50 32C50 32 58 22 62 20C58 24 54 28 50 32Z",
                  "M50 32C50 32 60 18 63 14C59 20 54 26 50 32Z",
                  "M50 32C50 32 58 22 62 20C58 24 54 28 50 32Z",
                ],
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: EASE }}
            />
            {/* Beak */}
            <path
              d="M32 26L35 22L29 22L32 26Z"
              fill="hsl(var(--primary))"
            />
            {/* Eyes */}
            <motion.circle
              cx="27" cy="28" r="2"
              fill="hsl(var(--primary))"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <motion.circle
              cx="37" cy="28" r="2"
              fill="hsl(var(--primary))"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            {/* Tail feathers */}
            <motion.path
              d="M28 48L32 56L36 48"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              animate={{ d: ["M28 48L32 56L36 48", "M28 48L32 54L36 48", "M28 48L32 56L36 48"] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: EASE }}
            />
          </svg>
        </motion.div>

        {/* Target crosshair dots — leads being found */}
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
