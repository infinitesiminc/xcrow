const FRONTIER_RELEASES = [
  { date: "2026-03-14", model: "Claude 4.7 Sonnet" },
  { date: "2026-03-09", model: "GPT-5.4" },
  { date: "2026-03-05", model: "Gemini 3.1 Flash" },
  { date: "2026-02-27", model: "Llama 4 Maverick" },
  { date: "2026-02-19", model: "Gemini 3.1 Pro" },
  { date: "2026-02-14", model: "Mistral Large 3" },
  { date: "2026-02-12", model: "GPT-5.3" },
  { date: "2026-02-05", model: "Claude 4.6" },
  { date: "2026-01-28", model: "Gemini 3 Flash" },
  { date: "2026-01-22", model: "DeepSeek R2 Lite" },
  { date: "2026-01-15", model: "GPT-5.2" },
  { date: "2026-01-08", model: "DeepSeek R2" },
  { date: "2025-12-18", model: "Claude 4.5 Opus" },
  { date: "2025-12-10", model: "Gemini 3 Pro" },
  { date: "2025-12-03", model: "Grok 3.5" },
  { date: "2025-11-19", model: "GPT-5.1" },
  { date: "2025-11-12", model: "Mistral Medium 3" },
  { date: "2025-11-05", model: "Llama 4 Scout" },
];

function daysAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diff === 0) return "today";
  if (diff === 1) return "1d ago";
  return `${diff}d ago`;
}

export default function StickyTicker() {
  return (
    <div className="sticky top-14 z-40 w-full overflow-hidden border-b border-border/40 bg-background/95 backdrop-blur-sm">
      <div className="relative h-[28px] overflow-hidden">
        <div className="flex animate-[ticker_18s_linear_infinite] whitespace-nowrap items-center h-full">
          {[...FRONTIER_RELEASES, ...FRONTIER_RELEASES].map((r, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 px-4 text-[11px] shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-destructive/70 shrink-0" />
              <span className="font-mono text-[10px] text-muted-foreground/60">{daysAgo(r.date)}</span>
              <span className="font-medium text-foreground/70">{r.model}</span>
              <span className="text-muted-foreground/50">released</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
