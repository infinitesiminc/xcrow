import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Rocket } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import type { StageId, StageData } from "./FactoryPipeline";
import { STAGE_META } from "./FactoryPipeline";

interface LaunchpadGridProps {
  stages: Record<StageId, StageData>;
  idea: string;
  onRestart: () => void;
}

export default function LaunchpadGrid({ stages, idea, onRestart }: LaunchpadGridProps) {
  const copy = (content: string, label: string) => {
    navigator.clipboard.writeText(content);
    toast.success(`${label} copied`);
  };

  const exportAll = () => {
    const full = STAGE_META.map(m => {
      const s = stages[m.id];
      return `# ${m.emoji} ${m.label}\n\n${s?.content || "Not generated"}`;
    }).join("\n\n---\n\n");
    const blob = new Blob([`# Software Factory — Startup Blueprint\n\n**Idea:** ${idea}\n\n---\n\n${full}`], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "startup-blueprint.md"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Blueprint exported as Markdown");
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold font-cinzel text-foreground mb-2">🚀 Your Startup Blueprint</h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">AI has generated your complete startup framework. Review, refine, and launch.</p>
        <div className="flex justify-center gap-3 mt-4">
          <Button onClick={exportAll} variant="outline" size="sm" className="gap-1.5">
            <Download className="w-3.5 h-3.5" /> Export All
          </Button>
          <Button onClick={onRestart} variant="ghost" size="sm">Start New Project</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STAGE_META.map(meta => {
          const stage = stages[meta.id];
          if (!stage?.content) return null;
          return (
            <Card key={meta.id} className="bg-card/80 border-border/50 hover:border-primary/30 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <span>{meta.emoji}</span> {meta.label}
                  </CardTitle>
                  <Badge variant="outline" className="text-[9px]">Complete</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm prose-invert max-w-none text-xs leading-relaxed max-h-48 overflow-y-auto mb-3">
                  <ReactMarkdown>{stage.content.slice(0, 600) + (stage.content.length > 600 ? "..." : "")}</ReactMarkdown>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] w-full gap-1" onClick={() => copy(stage.content, meta.label)}>
                  <Copy className="w-3 h-3" /> Copy Full Content
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
