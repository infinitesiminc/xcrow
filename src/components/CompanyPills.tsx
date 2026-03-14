import { useRef, useEffect } from "react";

const ALL_COMPANIES = [
  "Anthropic", "OpenAI", "Anduril", "Databricks", "Ramp",
  "Cohere", "AbbVie", "Gong", "Helion Energy", "Ajax",
];

interface Props {
  visible: boolean;
  onSelect: (company: string) => void;
}

export function CompanyPills({ visible, onSelect }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<number>();

  useEffect(() => {
    if (!visible || !scrollRef.current) return;
    const el = scrollRef.current;
    let pos = 0;
    const speed = 0.3; // px per frame

    const tick = () => {
      pos += speed;
      // Reset seamlessly when first set scrolls out
      if (pos >= el.scrollWidth / 2) pos = 0;
      el.scrollLeft = pos;
      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [visible]);

  if (!visible) return null;

  // Duplicate list for seamless loop
  const items = [...ALL_COMPANIES, ...ALL_COMPANIES];

  return (
    <div className="mt-2 overflow-hidden max-w-2xl mx-auto [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
      <div ref={scrollRef} className="flex gap-1.5 overflow-hidden whitespace-nowrap">
        {items.map((company, i) => (
          <button
            key={`${company}-${i}`}
            type="button"
            onClick={() => onSelect(company)}
            className="px-2.5 py-1 text-xs font-medium rounded-full border border-border bg-secondary/50 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          >
            {company}
          </button>
        ))}
      </div>
    </div>
  );
}
