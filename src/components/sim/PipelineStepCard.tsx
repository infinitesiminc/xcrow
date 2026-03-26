/**
 * PipelineStepCard — Individual step node in the Agent Pipeline Builder.
 */
import { GripVertical, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const TOOL_OPTIONS = [
  { value: "llm", label: "AI Prompt", icon: "🤖" },
  { value: "code", label: "Code Interpreter", icon: "💻" },
  { value: "search", label: "Web Search", icon: "🔍" },
  { value: "image", label: "Image Generator", icon: "🎨" },
  { value: "data", label: "Data Analyzer", icon: "📊" },
  { value: "email", label: "Email Agent", icon: "📧" },
  { value: "sheet", label: "Spreadsheet Agent", icon: "📑" },
  { value: "api", label: "Custom API", icon: "🔌" },
];

export interface PipelineStep {
  id: string;
  description: string;
  tool: string;
  expectedOutcome: string;
}

interface PipelineStepCardProps {
  step: PipelineStep;
  index: number;
  total: number;
  onUpdate: (id: string, field: keyof PipelineStep, value: string) => void;
  onRemove: (id: string) => void;
  onDragStart: (index: number) => void;
  onDragOver: (index: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isDragOver: boolean;
}

export { TOOL_OPTIONS };

export default function PipelineStepCard({
  step, index, total, onUpdate, onRemove,
  onDragStart, onDragOver, onDragEnd, isDragging, isDragOver,
}: PipelineStepCardProps) {
  const toolMeta = TOOL_OPTIONS.find(t => t.value === step.tool) || TOOL_OPTIONS[0];

  return (
    <div className="relative">
      {/* Connecting line to next step */}
      {index < total - 1 && (
        <div className="absolute left-5 top-full w-px h-3 bg-gradient-to-b from-primary/40 to-primary/10 z-0" />
      )}

      <div
        draggable
        onDragStart={() => onDragStart(index)}
        onDragOver={(e) => { e.preventDefault(); onDragOver(index); }}
        onDragEnd={onDragEnd}
        className={`
          relative rounded-lg p-3 border bg-background/60 backdrop-blur-sm
          transition-all duration-200 cursor-grab active:cursor-grabbing
          ${isDragging ? "opacity-40 scale-95" : ""}
          ${isDragOver ? "border-primary shadow-[0_0_12px_hsl(var(--primary)/0.2)]" : "border-border/50"}
        `}
      >
        <div className="flex items-center gap-2 mb-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
          
          {/* Step number badge */}
          <div className="h-5 w-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-primary">{index + 1}</span>
          </div>

          {/* Tool icon */}
          <span className="text-sm">{toolMeta.icon}</span>

          <Select value={step.tool} onValueChange={v => onUpdate(step.id, "tool", v)}>
            <SelectTrigger className="h-7 text-[11px] w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TOOL_OPTIONS.map(tool => (
                <SelectItem key={tool.value} value={tool.value} className="text-xs">
                  {tool.icon} {tool.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {total > 1 && (
            <Button
              size="sm" variant="ghost"
              onClick={() => onRemove(step.id)}
              className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>

        <Input
          value={step.description}
          onChange={e => onUpdate(step.id, "description", e.target.value)}
          placeholder="What should the agent do at this step?"
          className="text-xs mb-1.5 h-8"
        />
        <Input
          value={step.expectedOutcome}
          onChange={e => onUpdate(step.id, "expectedOutcome", e.target.value)}
          placeholder="Expected output (used for scoring)"
          className="text-xs h-8"
        />
      </div>
    </div>
  );
}
