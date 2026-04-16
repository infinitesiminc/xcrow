import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, Users, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface WarmPath {
  rank: number;
  title: string;
  confidence: "high" | "medium" | "low";
  description: string;
  bridge_contacts: string[];
  action_steps: string[];
}

const confidenceStyles: Record<string, string> = {
  high: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-muted text-muted-foreground border-border",
};

interface PathCardProps {
  path: WarmPath;
  onUsePath?: (path: WarmPath) => void;
}

export function PathCard({ path, onUsePath }: PathCardProps) {
  return (
    <div className="group relative rounded-lg border border-border/60 bg-card p-4 transition-all hover:border-primary/40 hover:shadow-[0_0_20px_-5px_hsl(var(--primary)/0.3)]">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
            {path.rank}
          </div>
          <h4 className="text-sm font-semibold truncate">{path.title}</h4>
        </div>
        <Badge variant="outline" className={cn("text-[10px] uppercase tracking-wider shrink-0", confidenceStyles[path.confidence])}>
          {path.confidence}
        </Badge>
      </div>

      <p className="text-xs text-muted-foreground leading-relaxed mb-3">{path.description}</p>

      {path.bridge_contacts?.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5">
            <Users className="w-3 h-3" /> Bridge
          </div>
          <div className="flex flex-wrap gap-1.5">
            {path.bridge_contacts.map((c, i) => (
              <Badge key={i} variant="secondary" className="text-[10px] font-normal">{c}</Badge>
            ))}
          </div>
        </div>
      )}

      {path.action_steps?.length > 0 && (
        <ol className="space-y-1.5 mb-3">
          {path.action_steps.map((step, i) => (
            <li key={i} className="flex gap-2 text-xs text-foreground/80">
              <span className="text-primary font-mono shrink-0">{i + 1}.</span>
              <span className="leading-relaxed">{step}</span>
            </li>
          ))}
        </ol>
      )}

      {onUsePath && (
        <Button
          size="sm"
          variant="ghost"
          className="w-full justify-between text-xs h-7 mt-2 text-primary hover:bg-primary/10"
          onClick={() => onUsePath(path)}
        >
          <span className="flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Use this path</span>
          <ChevronRight className="w-3 h-3" />
        </Button>
      )}
    </div>
  );
}
