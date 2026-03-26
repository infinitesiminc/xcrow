/**
 * ToolsPanel — Comprehensive tracker of AI tools from the GTC 2026 keynote.
 * Grouped by company, filterable by category, with search.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { GTC_TOOLS, CATEGORY_CONFIG, type ToolCategory, type GTCTool } from "@/data/gtc-tools-registry";

export default function ToolsPanel() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<ToolCategory | "all">("all");
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let tools = GTC_TOOLS;
    if (activeCategory !== "all") {
      tools = tools.filter(t => t.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.company.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return tools;
  }, [search, activeCategory]);

  // Group by company
  const grouped = useMemo(() => {
    const map = new Map<string, GTCTool[]>();
    for (const t of filtered) {
      const existing = map.get(t.company) || [];
      existing.push(t);
      map.set(t.company, existing);
    }
    return [...map.entries()].sort((a, b) => b[1].length - a[1].length);
  }, [filtered]);

  // Category counts for filter chips
  const categoryCounts = useMemo(() => {
    const base = search.trim()
      ? GTC_TOOLS.filter(t => {
          const q = search.toLowerCase();
          return t.name.toLowerCase().includes(q) || t.company.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
        })
      : GTC_TOOLS;
    const counts = new Map<ToolCategory, number>();
    for (const t of base) counts.set(t.category, (counts.get(t.category) || 0) + 1);
    return counts;
  }, [search]);

  // Top categories by count
  const topCategories = useMemo(() => {
    return [...categoryCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([cat]) => cat);
  }, [categoryCounts]);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-3 pt-3 pb-2 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold uppercase tracking-wider" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
            🛠️ Tool Tracker
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono" style={{ background: "hsl(var(--filigree) / 0.15)", color: "hsl(var(--filigree-glow))" }}>
            {filtered.length} tools
          </span>
        </div>
        <p className="text-[10px] leading-relaxed" style={{ color: "hsl(var(--muted-foreground))" }}>
          Every tool from the GTC 2026 keynote — the agentic world is here.
        </p>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tools, companies..."
            className="w-full h-7 pl-7 pr-2 rounded-md text-xs bg-transparent border focus:outline-none focus:ring-1"
            style={{
              borderColor: "hsl(var(--filigree) / 0.2)",
              color: "hsl(var(--foreground))",
            }}
          />
        </div>

        {/* Category filter chips */}
        <div className="flex gap-1 flex-wrap">
          <button
            onClick={() => setActiveCategory("all")}
            className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
            style={{
              background: activeCategory === "all" ? "hsl(var(--filigree) / 0.2)" : "transparent",
              color: activeCategory === "all" ? "hsl(var(--filigree-glow))" : "hsl(var(--muted-foreground))",
              border: "1px solid hsl(var(--filigree) / 0.15)",
            }}
          >
            All
          </button>
          {topCategories.map(cat => {
            const cfg = CATEGORY_CONFIG[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(isActive ? "all" : cat)}
                className="px-2 py-0.5 rounded-full text-[10px] font-medium transition-all"
                style={{
                  background: isActive ? `${cfg.color}22` : "transparent",
                  color: isActive ? cfg.color : "hsl(var(--muted-foreground))",
                  border: `1px solid ${isActive ? cfg.color + "44" : "hsl(var(--filigree) / 0.15)"}`,
                }}
              >
                {cfg.label} ({categoryCounts.get(cat) || 0})
              </button>
            );
          })}
        </div>
      </div>

      {/* Tool list grouped by company */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
        {grouped.map(([company, tools]) => {
          const isExpanded = expandedCompany === company;
          const displayTools = isExpanded ? tools : tools.slice(0, 3);
          const hasMore = tools.length > 3;

          return (
            <div
              key={company}
              className="rounded-lg overflow-hidden"
              style={{
                background: "hsl(var(--card) / 0.5)",
                border: "1px solid hsl(var(--filigree) / 0.1)",
              }}
            >
              {/* Company header */}
              <button
                onClick={() => setExpandedCompany(isExpanded ? null : company)}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left hover:bg-muted/20 transition-colors"
              >
                <span className="text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>
                  {company}
                </span>
                <span className="text-[10px] px-1 py-0.5 rounded font-mono" style={{ background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--muted-foreground))" }}>
                  {tools.length}
                </span>
                <div className="flex-1" />
                {hasMore && (
                  isExpanded
                    ? <ChevronUp className="h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                    : <ChevronDown className="h-3 w-3" style={{ color: "hsl(var(--muted-foreground))" }} />
                )}
              </button>

              {/* Tools */}
              <div className="px-2 pb-1.5 space-y-1">
                {displayTools.map(tool => (
                  <ToolRow key={tool.name} tool={tool} />
                ))}
                {!isExpanded && hasMore && (
                  <button
                    onClick={() => setExpandedCompany(company)}
                    className="text-[10px] px-2 py-0.5 w-full text-center"
                    style={{ color: "hsl(var(--filigree-glow))" }}
                  >
                    +{tools.length - 3} more
                  </button>
                )}
              </div>
            </div>
          );
        })}

        {grouped.length === 0 && (
          <div className="text-center py-8 text-xs" style={{ color: "hsl(var(--muted-foreground))" }}>
            No tools match your search.
          </div>
        )}
      </div>
    </div>
  );
}

function ToolRow({ tool }: { tool: GTCTool }) {
  const catCfg = CATEGORY_CONFIG[tool.category];

  return (
    <div
      className="flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-muted/20 transition-colors group"
    >
      <span className="text-sm shrink-0 mt-0.5">{tool.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold truncate" style={{ color: "hsl(var(--foreground))" }}>
            {tool.name}
          </span>
          <span
            className="text-[9px] px-1 py-0 rounded shrink-0"
            style={{ background: catCfg.color + "22", color: catCfg.color }}
          >
            {catCfg.label}
          </span>
        </div>
        <p className="text-[10px] leading-tight mt-0.5 line-clamp-2" style={{ color: "hsl(var(--muted-foreground))" }}>
          {tool.description}
        </p>
      </div>
      {tool.url && (
        <a
          href={tool.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity mt-1"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink className="h-3 w-3" style={{ color: "hsl(var(--filigree-glow))" }} />
        </a>
      )}
    </div>
  );
}
