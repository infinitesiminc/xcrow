import { useState, useEffect } from "react";
import { Zap, Users } from "lucide-react";

const FRONTIER_RELEASES = [
  { model: "Claude 4.7 Sonnet" },
  { model: "GPT-5.4" },
  { model: "Gemini 3.1 Flash" },
  { model: "Llama 4 Maverick" },
  { model: "Gemini 3.1 Pro" },
  { model: "Mistral Large 3" },
  { model: "GPT-5.3" },
  { model: "Claude 4.6" },
  { model: "Gemini 3 Flash" },
  { model: "DeepSeek R2 Lite" },
  { model: "GPT-5.2" },
  { model: "DeepSeek R2" },
  { model: "Claude 4.5 Opus" },
  { model: "Gemini 3 Pro" },
  { model: "Grok 3.5" },
  { model: "GPT-5.1" },
  { model: "Mistral Medium 3" },
  { model: "Llama 4 Scout" },
];

const WORKFORCE_ITEMS = [
  "Upskilling programs",
  "Hiring freezes",
  "Role redefinition",
  "Training budgets",
  "Change management",
  "Skills assessment",
  "Workforce planning",
  "Team restructuring",
  "Competency mapping",
  "L&D initiatives",
  "Talent retention",
  "Reskilling efforts",
];

export default function StickyTicker() {
  const [activeModel, setActiveModel] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveModel((prev) => (prev + 1) % FRONTIER_RELEASES.length);
    }, 3500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-14 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur-sm">
      {/* Top row — models fly across fast */}
      <div className="relative h-[20px] overflow-hidden border-b border-border/20">
        <div className="absolute inset-y-0 left-0 w-6 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-6 z-10 bg-gradient-to-l from-background to-transparent" />
        <div
          key={activeModel}
          className="absolute inset-0 flex items-center animate-[model-fly_3s_linear_forwards]"
        >
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <Zap className="h-2.5 w-2.5 text-destructive shrink-0" />
            <span className="text-[10px] font-semibold tracking-wide text-destructive/90 uppercase">
              {FRONTIER_RELEASES[activeModel].model}
            </span>
            <span className="text-[9px] text-muted-foreground/50">released</span>
          </span>
        </div>
      </div>

      {/* Bottom row — workforce scrolls steadily */}
      <div className="relative h-[18px] overflow-hidden">
        <div className="absolute inset-y-0 left-0 w-6 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-6 z-10 bg-gradient-to-l from-background to-transparent" />
        <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap items-center h-full">
          {[...WORKFORCE_ITEMS, ...WORKFORCE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-4 text-[10px] shrink-0 text-muted-foreground/50"
            >
              <Users className="h-2 w-2 shrink-0 opacity-40" />
              <span>{item}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
