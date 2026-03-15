import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const TICKER_HEADLINES = [
  { date: "Mar 14", text: "Software sector meltdown: ~$2T erased as AI tools threaten legacy subscriptions" },
  { date: "Mar 12", text: "CrowdStrike, Zscaler, Cloudflare slide after Anthropic's Claude Code security tool launch" },
  { date: "Mar 11", text: "Salesforce, Intuit, ServiceNow down 20%+ on AI replacement fears" },
  { date: "Mar 10", text: "Thomson Reuters plunges in record one-day drop over Claude legal plugin threat" },
  { date: "Mar 7", text: "Block Inc. plans to lay off nearly half its workforce as AI automates operations" },
  { date: "Mar 5", text: "Atlassian cuts ~10% of staff to redirect resources toward AI" },
  { date: "Mar 3", text: "ServiceNow using AI to eliminate 90% of human customer service use cases" },
  { date: "Feb 28", text: "AI-driven tax tools pressure Raymond James & LPL Financial share prices" },
  { date: "Feb 26", text: "CBRE & JLL fall ~12% on commercial real estate AI automation concerns" },
  { date: "Feb 24", text: "Nvidia slides as hyperscaler CapEx scrutiny intensifies amid uncertain AI ROI" },
  { date: "Feb 21", text: "IBM drops on fears AI adoption disrupts its traditional enterprise business" },
  { date: "Feb 19", text: "Agentic AI shift fuels 'sell first, ask later' panic across tech sector" },
  { date: "Feb 17", text: "White-collar roles in coding, marketing & support eroding faster than expected" },
];

export default function NewsTicker() {
  const [headlines, setHeadlines] = useState(TICKER_HEADLINES);

  useEffect(() => {
    supabase
      .from("ticker_headlines")
      .select("date, text")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data && data.length > 0) setHeadlines(data);
      });
  }, []);

  return (
    <div className="mt-4 rounded-lg border border-border/50 bg-muted/30 overflow-hidden">
      <div className="flex items-center gap-3 px-3 py-1.5 border-b border-border/30 bg-muted/40">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-destructive">
          Last 30 Days — AI Disruption Signal
        </span>
      </div>
      <div className="h-[22px] overflow-hidden relative">
        <div className="animate-[ticker-vertical_20s_linear_infinite] flex flex-col">
          {[...headlines, ...headlines].map((h, i) => (
            <span key={i} className="text-[11px] text-foreground/70 flex items-center gap-2 px-4 h-[22px] shrink-0 whitespace-nowrap">
              <span className="text-destructive/60">▸</span>
              <span className="text-muted-foreground/60 font-mono text-[10px]">{h.date}</span>
              {h.text}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
