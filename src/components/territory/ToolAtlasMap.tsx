/**
 * ToolAtlasMap — Interactive node-based visualization of the AI tool ecosystem.
 * Tools are clustered by category in a force-directed-style layout.
 * Click a node to see details; drag to pan; scroll to zoom.
 */
import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, X, Sparkles, Eye, ZoomIn, ZoomOut, Maximize2, Plus, Check, Package } from "lucide-react";
import { GTC_TOOLS, CATEGORY_CONFIG, type ToolCategory, type GTCTool } from "@/data/gtc-tools-registry";
import { getSkillsForTool } from "@/data/tool-skill-mappings";
import { useMyStack } from "@/hooks/use-my-stack";

/* ── Layout constants ── */
const NODE_RADIUS = 22;
const CLUSTER_PADDING = 60;

/** Pre-compute node positions in a cluster layout */
function computeLayout(tools: GTCTool[], width: number, height: number) {
  // Group by category
  const groups = new Map<ToolCategory, GTCTool[]>();
  for (const t of tools) {
    const arr = groups.get(t.category) || [];
    arr.push(t);
    groups.set(t.category, arr);
  }

  const categories = [...groups.keys()];
  const catCount = categories.length;

  // Place category clusters in a grid
  const cols = Math.ceil(Math.sqrt(catCount * (width / height)));
  const rows = Math.ceil(catCount / cols);
  const cellW = width / cols;
  const cellH = height / rows;

  const nodes: { tool: GTCTool; x: number; y: number; category: ToolCategory }[] = [];
  const clusters: { category: ToolCategory; cx: number; cy: number; label: string; color: string; count: number }[] = [];

  let idx = 0;
  for (const cat of categories) {
    const catTools = groups.get(cat)!;
    const col = idx % cols;
    const row = Math.floor(idx / cols);
    const cx = cellW * col + cellW / 2;
    const cy = cellH * row + cellH / 2;

    const cfg = CATEGORY_CONFIG[cat];
    clusters.push({ category: cat, cx, cy, label: cfg.label, color: cfg.color, count: catTools.length });

    // Place tools in a spiral around cluster center
    const spiralStep = (NODE_RADIUS * 2.5);
    for (let i = 0; i < catTools.length; i++) {
      const angle = (i / catTools.length) * Math.PI * 2 + (idx * 0.7);
      const rings = Math.floor(i / 8) + 1;
      const ringAngle = (i % 8) / 8 * Math.PI * 2 + (idx * 0.3);
      const r = spiralStep * rings;
      const x = cx + Math.cos(ringAngle) * r;
      const y = cy + Math.sin(ringAngle) * r;
      nodes.push({ tool: catTools[i], x, y, category: cat });
    }
    idx++;
  }

  return { nodes, clusters };
}

export default function ToolAtlasMap() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 2400, height: 1600 });
  const [selectedTool, setSelectedTool] = useState<GTCTool | null>(null);
  const [hoveredTool, setHoveredTool] = useState<string | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(0.6);
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, panX: 0, panY: 0 });
  const { stack, toggleTool, isInStack, stackSize } = useMyStack();

  const { nodes, clusters } = useMemo(
    () => computeLayout(GTC_TOOLS, dimensions.width, dimensions.height),
    [dimensions]
  );

  // Center on load
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: (rect.width - dimensions.width * zoom) / 2,
        y: (rect.height - dimensions.height * zoom) / 2,
      });
    }
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(2, Math.max(0.2, z * delta)));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsPanning(true);
    panStart.current = { x: e.clientX, y: e.clientY, panX: pan.x, panY: pan.y };
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanning) return;
    setPan({
      x: panStart.current.panX + (e.clientX - panStart.current.x),
      y: panStart.current.panY + (e.clientY - panStart.current.y),
    });
  }, [isPanning]);

  const handleMouseUp = useCallback(() => setIsPanning(false), []);

  const handleReset = useCallback(() => {
    setZoom(0.6);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setPan({
        x: (rect.width - dimensions.width * 0.6) / 2,
        y: (rect.height - dimensions.height * 0.6) / 2,
      });
    }
  }, [dimensions]);

  return (
    <div className="relative w-full h-full overflow-hidden" style={{ background: "hsl(var(--background))" }}>
      {/* Canvas */}
      <div
        ref={containerRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <svg
          width={dimensions.width}
          height={dimensions.height}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Cluster backgrounds */}
          {clusters.map(c => (
            <g key={c.category}>
              <circle
                cx={c.cx}
                cy={c.cy}
                r={Math.max(80, c.count * 18) + CLUSTER_PADDING}
                fill={c.color + "08"}
                stroke={c.color + "25"}
                strokeWidth={1.5}
                strokeDasharray="6 4"
              />
              <text
                x={c.cx}
                y={c.cy - Math.max(80, c.count * 18) - CLUSTER_PADDING + 16}
                textAnchor="middle"
                fill={c.color}
                fontSize={14}
                fontWeight={700}
                fontFamily="'Cinzel', serif"
                style={{ textTransform: "uppercase", letterSpacing: "0.1em" }}
              >
                {c.label}
              </text>
              <text
                x={c.cx}
                y={c.cy - Math.max(80, c.count * 18) - CLUSTER_PADDING + 32}
                textAnchor="middle"
                fill={c.color + "99"}
                fontSize={10}
              >
                {c.count} tools
              </text>
            </g>
          ))}

          {/* Connection lines between same-company tools */}
          {nodes.map((n, i) =>
            nodes.slice(i + 1).map((m, j) => {
              if (n.tool.company !== m.tool.company || n.category === m.category) return null;
              return (
                <line
                  key={`${i}-${i + j + 1}`}
                  x1={n.x} y1={n.y} x2={m.x} y2={m.y}
                  stroke="hsl(var(--filigree) / 0.06)"
                  strokeWidth={0.5}
                />
              );
            })
          )}

          {/* Tool nodes */}
          {nodes.map(({ tool, x, y, category }) => {
            const cfg = CATEGORY_CONFIG[category];
            const isHovered = hoveredTool === tool.name;
            const isSelected = selectedTool?.name === tool.name;
            const isLearnable = tool.type === "learnable";
            const inStack = isInStack(tool.name);
            const r = isHovered || isSelected ? NODE_RADIUS + 4 : NODE_RADIUS;

            return (
              <g
                key={tool.name}
                className="cursor-pointer"
                onClick={(e) => { e.stopPropagation(); setSelectedTool(tool); }}
                onMouseEnter={() => setHoveredTool(tool.name)}
                onMouseLeave={() => setHoveredTool(null)}
              >
                {/* Glow for learnable */}
                {isLearnable && (
                  <circle cx={x} cy={y} r={r + 6} fill={cfg.color + "15"} />
                )}
                {/* Stack highlight ring */}
                {inStack && (
                  <circle cx={x} cy={y} r={r + 8} fill="none" stroke="hsl(45, 90%, 55%)" strokeWidth={2} strokeDasharray="4 2" opacity={0.7} />
                )}
                {/* Outer ring */}
                <circle
                  cx={x} cy={y} r={r}
                  fill="hsl(var(--card))"
                  stroke={isSelected ? "hsl(var(--filigree-glow))" : inStack ? "hsl(45, 90%, 55%)" : cfg.color}
                  strokeWidth={isSelected ? 2.5 : isHovered ? 2 : 1.2}
                  style={{ transition: "all 0.15s ease" }}
                />
                {/* Icon */}
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={16}>
                  {tool.icon}
                </text>
                {/* Label */}
                {(isHovered || isSelected || zoom > 0.8) && (
                  <text x={x} y={y + r + 14} textAnchor="middle" fill="hsl(var(--foreground))" fontSize={10} fontWeight={600}>
                    {tool.name}
                  </text>
                )}
                {/* Version badge */}
                {(isHovered || isSelected) && tool.version && (
                  <text x={x} y={y + r + 26} textAnchor="middle" fill="hsl(var(--muted-foreground))" fontSize={8}>
                    {tool.version}
                  </text>
                )}
                {/* Practice dot */}
                {isLearnable && !inStack && (
                  <circle cx={x + r * 0.7} cy={y - r * 0.7} r={4} fill="hsl(140, 60%, 45%)" stroke="hsl(var(--card))" strokeWidth={1.5} />
                )}
                {/* Stack checkmark */}
                {inStack && (
                  <circle cx={x + r * 0.7} cy={y - r * 0.7} r={5} fill="hsl(45, 90%, 55%)" stroke="hsl(var(--card))" strokeWidth={1.5} />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Zoom controls */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-1">
        <button
          onClick={() => setZoom(z => Math.min(2, z * 1.2))}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--filigree) / 0.2)" }}
        >
          <ZoomIn className="h-4 w-4" style={{ color: "hsl(var(--foreground))" }} />
        </button>
        <button
          onClick={() => setZoom(z => Math.max(0.2, z * 0.8))}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--filigree) / 0.2)" }}
        >
          <ZoomOut className="h-4 w-4" style={{ color: "hsl(var(--foreground))" }} />
        </button>
        <button
          onClick={handleReset}
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--filigree) / 0.2)" }}
        >
          <Maximize2 className="h-4 w-4" style={{ color: "hsl(var(--foreground))" }} />
        </button>
      </div>

      {/* Legend */}
      <div
        className="absolute top-4 left-4 px-3 py-2 rounded-lg space-y-1"
        style={{ background: "hsl(var(--card) / 0.9)", border: "1px solid hsl(var(--filigree) / 0.15)", backdropFilter: "blur(8px)" }}
      >
        <p className="text-xs font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
          🛠️ Tool Atlas
        </p>
        <p className="text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
          {GTC_TOOLS.length} tools · {clusters.length} categories
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "hsl(140, 60%, 45%)" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(140, 60%, 45%)" }} />
            Hands-on
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "hsl(var(--muted-foreground))" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(var(--muted-foreground))" }} />
            Infrastructure
          </span>
          <span className="flex items-center gap-1 text-[10px]" style={{ color: "hsl(45, 90%, 55%)" }}>
            <span className="w-2 h-2 rounded-full inline-block" style={{ background: "hsl(45, 90%, 55%)" }} />
            My Stack ({stackSize})
          </span>
        </div>
      </div>

      {/* Detail drawer */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="absolute top-0 right-0 h-full w-80 overflow-y-auto"
            style={{
              background: "hsl(var(--card) / 0.95)",
              borderLeft: "1px solid hsl(var(--filigree) / 0.2)",
              backdropFilter: "blur(12px)",
            }}
          >
            <div className="p-4 space-y-4">
              {/* Close */}
              <button onClick={() => setSelectedTool(null)} className="absolute top-3 right-3">
                <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTool.icon}</span>
                <div>
                  <h3 className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
                    {selectedTool.name}
                  </h3>
                  <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {selectedTool.company}
                  </p>
                </div>
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5">
                {selectedTool.version && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
                    v{selectedTool.version}
                  </span>
                )}
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full"
                  style={{ background: CATEGORY_CONFIG[selectedTool.category].color + "22", color: CATEGORY_CONFIG[selectedTool.category].color }}
                >
                  {CATEGORY_CONFIG[selectedTool.category].label}
                </span>
                {selectedTool.type === "learnable" ? (
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "hsl(140, 60%, 45%, 0.15)", color: "hsl(140, 60%, 45%)" }}>
                    <Sparkles className="h-2.5 w-2.5" /> Hands-on
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: "hsl(var(--muted) / 0.2)", color: "hsl(var(--muted-foreground))" }}>
                    <Eye className="h-2.5 w-2.5" /> Infrastructure
                  </span>
                )}
                {selectedTool.maturity && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full uppercase font-medium" style={{
                    background: selectedTool.maturity === "ga" ? "hsl(140, 60%, 45%, 0.15)" : "hsl(45, 80%, 50%, 0.15)",
                    color: selectedTool.maturity === "ga" ? "hsl(140, 60%, 45%)" : "hsl(45, 80%, 50%)"
                  }}>
                    {selectedTool.maturity}
                  </span>
                )}
                {selectedTool.pricing && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted) / 0.2)", color: "hsl(var(--muted-foreground))" }}>
                    {selectedTool.pricing}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
                {selectedTool.description}
              </p>

              {/* Use cases */}
              {selectedTool.useCases && selectedTool.useCases.length > 0 && (
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    Use Cases
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {selectedTool.useCases.map(uc => (
                      <span key={uc} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted) / 0.15)", color: "hsl(var(--foreground) / 0.7)" }}>
                        {uc.replace(/-/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills this tool trains */}
              {(() => {
                const skills = getSkillsForTool(selectedTool.name);
                if (!skills.length) return null;
                return (
                  <div>
                    <h4 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                      Skills You'll Build
                    </h4>
                    <div className="space-y-1">
                      {skills.map(skill => (
                        <div key={skill} className="flex items-center gap-2 px-2 py-1 rounded-md" style={{ background: "hsl(var(--muted) / 0.1)" }}>
                          <span className="text-[10px]">🎯</span>
                          <span className="text-[11px] font-medium" style={{ color: "hsl(var(--foreground) / 0.85)" }}>{skill}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* CTA */}
              <div className="space-y-2 pt-2">
                {/* Add to Stack */}
                <button
                  onClick={() => toggleTool(selectedTool.name)}
                  className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                  style={{
                    background: isInStack(selectedTool.name) ? "hsl(45, 90%, 55%, 0.15)" : "hsl(var(--muted) / 0.15)",
                    border: `1px solid ${isInStack(selectedTool.name) ? "hsl(45, 90%, 55%, 0.4)" : "hsl(var(--filigree) / 0.2)"}`,
                    color: isInStack(selectedTool.name) ? "hsl(45, 90%, 55%)" : "hsl(var(--foreground))",
                    fontFamily: "'Cinzel', serif",
                  }}
                >
                  {isInStack(selectedTool.name) ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                  {isInStack(selectedTool.name) ? "In My Stack" : "Add to Stack"}
                </button>

                {selectedTool.type === "learnable" && (
                  <button
                    className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--filigree)), hsl(var(--filigree-glow)))",
                      color: "hsl(var(--background))",
                      fontFamily: "'Cinzel', serif",
                    }}
                  >
                    ⚔️ Start Practicing
                  </button>
                )}
                {selectedTool.url && (
                  <a
                    href={selectedTool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5"
                    style={{
                      background: "transparent",
                      border: "1px solid hsl(var(--filigree) / 0.3)",
                      color: "hsl(var(--foreground))",
                    }}
                  >
                    <ExternalLink className="h-3 w-3" /> Visit Website
                  </a>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
