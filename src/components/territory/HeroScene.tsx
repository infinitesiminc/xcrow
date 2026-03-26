/**
 * HeroScene — Reusable cinematic image backdrop with multiple intensity modes.
 *
 * Usage:
 *   <HeroScene imageUrl={url} intensity="full" camera="ken-burns" overlay="letterbox">
 *     <GuardianDialogue />
 *   </HeroScene>
 */
import { forwardRef, type ReactNode } from "react";
import { motion } from "framer-motion";

export type HeroIntensity = "full" | "ambient" | "thumbnail";
export type HeroCamera = "ken-burns" | "parallax" | "static";
export type HeroOverlay = "gradient-bottom" | "letterbox" | "glass" | "vignette" | "none";

interface HeroSceneProps {
  imageUrl: string | null;
  intensity?: HeroIntensity;
  camera?: HeroCamera;
  overlay?: HeroOverlay;
  /** HSL hue for tinting the overlay */
  hue?: number;
  children?: ReactNode;
  className?: string;
}

const CAMERA_STYLES: Record<HeroCamera, React.CSSProperties> = {
  "ken-burns": {},
  "parallax": {},
  "static": {},
};

const CAMERA_CLASSES: Record<HeroCamera, string> = {
  "ken-burns": "animate-[ken-burns_25s_ease-in-out_infinite_alternate]",
  "parallax": "",
  "static": "",
};

const INTENSITY_OPACITY: Record<HeroIntensity, number> = {
  full: 0.55,
  ambient: 0.18,
  thumbnail: 0.3,
};

export default function HeroScene({
  imageUrl,
  intensity = "full",
  camera = "ken-burns",
  overlay = "gradient-bottom",
  hue = 220,
  children,
  className = "",
}: HeroSceneProps) {
  if (!imageUrl) {
    return <div className={`relative ${className}`}>{children}</div>;
  }

  const opacity = INTENSITY_OPACITY[intensity];

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Image layer */}
      <div className="absolute inset-0 z-0">
        <motion.img
          src={imageUrl}
          alt=""
          initial={{ scale: 1, opacity: 0 }}
          animate={{ scale: camera === "ken-burns" ? 1.15 : 1, opacity }}
          transition={{
            scale: { duration: 20, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
            opacity: { duration: 1.2, ease: "easeOut" },
          }}
          className={`w-full h-full object-cover ${camera === "parallax" ? "parallax-layer-back" : ""}`}
          style={{
            willChange: "transform, opacity",
            transformOrigin: "center center",
          }}
          loading="eager"
          draggable={false}
        />
      </div>

      {/* Overlay layer */}
      {overlay !== "none" && (
        <div className="absolute inset-0 z-[1] pointer-events-none">
          {overlay === "gradient-bottom" && (
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg, 
                  hsl(${hue} 20% 6% / 0.4) 0%, 
                  hsl(${hue} 20% 6% / 0.7) 50%, 
                  hsl(${hue} 20% 6% / 0.95) 100%)`,
              }}
            />
          )}

          {overlay === "letterbox" && (
            <>
              <div
                className="absolute top-0 inset-x-0 h-[12%]"
                style={{ background: `linear-gradient(180deg, hsl(${hue} 15% 4%) 0%, transparent 100%)` }}
              />
              <div
                className="absolute bottom-0 inset-x-0 h-[12%]"
                style={{ background: `linear-gradient(0deg, hsl(${hue} 15% 4%) 0%, transparent 100%)` }}
              />
              {/* Side vignette */}
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, transparent 40%, hsl(${hue} 15% 4% / 0.6) 100%)`,
                }}
              />
            </>
          )}

          {overlay === "glass" && (
            <div
              className="absolute inset-0 backdrop-blur-sm"
              style={{
                background: `hsl(${hue} 20% 6% / 0.7)`,
              }}
            />
          )}

          {overlay === "vignette" && (
            <div
              className="absolute inset-0"
              style={{
                background: `radial-gradient(ellipse at center, transparent 30%, hsl(${hue} 15% 4% / 0.8) 100%)`,
              }}
            />
          )}
        </div>
      )}

      {/* Content layer */}
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
