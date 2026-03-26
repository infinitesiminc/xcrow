/**
 * WorkflowLanes — Horizontal swim lanes grouping tools by workflow stage.
 * Research → Create → Build → Analyze → Automate → Deploy → Secure → Design
 */
import { motion } from "framer-motion";
import { Plus, Check } from "lucide-react";
import { GTC_TOOLS, CATEGORY_CONFIG } from "@/data/gtc-tools-registry";
import { WORKFLOW_STAGES, TOOL_WORKFLOW_MAP, type WorkflowStage } from "@/data/role-tool-recommendations";
import { useMyStack } from "@/hooks/use-my-stack";

interface Props {
  onSelectTool?: (toolName: string) => void;
  filterLearnable?: boolean;
}

export default function WorkflowLanes({ onSelectTool, filterLearnable = false }: Props) {
  const { toggleTool, isInStack } = useMyStack();

  // Build grouped data
  const lanes: { stage: WorkflowStage; tools: typeof GTC_TOOLS }[] = [];
  const stageOrder: WorkflowStage[] = ["research", "create", "build", "analyze", "automate", "deploy", "design", "secure"];

  for (const stage of stageOrder) {
    const tools = GTC_TOOLS.filter(t => {
      if (TOOL_WORKFLOW_MAP[t.name] !== stage) return false;
      if (filterLearnable && t.type !== "learnable") return false;
      return true;
    });
    if (tools.length > 0) lanes.push({ stage, tools });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
          Browse by Workflow
        </h2>
        <p className="text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
          {GTC_TOOLS.length} tools across {lanes.length} stages
        </p>
      </div>

      {lanes.map(({ stage, tools }) => {
        const cfg = WORKFLOW_STAGES[stage];
        return (
          <div key={stage}>
            {/* Lane header */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-base">{cfg.icon}</span>
              <h3 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>
                {cfg.label}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted) / 0.15)", color: "hsl(var(--muted-foreground))" }}>
                {tools.length}
              </span>
              <p className="text-[10px] hidden sm:block" style={{ color: "hsl(var(--muted-foreground))" }}>
                — {cfg.description}
              </p>
            </div>

            {/* Horizontal scroll of tool chips */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
              {tools.map(tool => {
                const catCfg = CATEGORY_CONFIG[tool.category];
                const inStack = isInStack(tool.name);

                return (
                  <motion.button
                    key={tool.name}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl transition-all group"
                    style={{
                      background: "hsl(var(--card))",
                      border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.4)" : "hsl(var(--border) / 0.25)"}`,
                      minWidth: 160,
                    }}
                    onClick={() => onSelectTool?.(tool.name)}
                  >
                    <span className="text-lg">{tool.icon}</span>
                    <div className="text-left flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>{tool.name}</p>
                      <p className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{tool.company}</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tool.type === "learnable" && (
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: "hsl(140, 60%, 45%)" }} title="Hands-on" />
                      )}
                      <button
                        onClick={e => { e.stopPropagation(); toggleTool(tool.name); }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        {inStack
                          ? <Check className="h-3.5 w-3.5" style={{ color: "hsl(45, 90%, 55%)" }} />
                          : <Plus className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />}
                      </button>
                    </div>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
