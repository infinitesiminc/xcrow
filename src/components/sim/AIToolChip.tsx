import { useState, useMemo, type ReactNode } from "react";
import { Bookmark, BookmarkCheck, ExternalLink } from "lucide-react";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  findToolMentions,
  getSavedTools,
  addToolToList,
  removeToolFromList,
  type AIToolInfo,
} from "@/lib/ai-tool-registry";

const CATEGORY_COLORS: Record<string, string> = {
  llm: "hsl(var(--primary))",
  coding: "hsl(142 70% 45%)",
  productivity: "hsl(45 90% 50%)",
  design: "hsl(280 70% 55%)",
  data: "hsl(200 80% 50%)",
  writing: "hsl(20 80% 55%)",
  search: "hsl(170 60% 45%)",
};

const CATEGORY_LABELS: Record<string, string> = {
  llm: "AI Model",
  coding: "Dev Tool",
  productivity: "Productivity",
  design: "Design",
  data: "Analytics",
  writing: "Writing",
  search: "Search",
};

function ToolChip({ tool, matchedText }: { tool: AIToolInfo; matchedText: string }) {
  const [saved, setSaved] = useState(() => isToolSaved(tool.name));
  const color = CATEGORY_COLORS[tool.category] || "hsl(var(--primary))";

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (saved) {
      removeToolFromList(tool.name);
      setSaved(false);
    } else {
      saveToolToList(tool.name);
      setSaved(true);
    }
  };

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <span
          className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md cursor-help text-[inherit] font-semibold transition-all hover:brightness-110"
          style={{
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            borderBottom: `2px solid color-mix(in srgb, ${color} 40%, transparent)`,
          }}
        >
          {matchedText}
        </span>
      </HoverCardTrigger>
      <HoverCardContent
        side="top"
        align="start"
        className="w-72 p-0 overflow-hidden z-[100]"
        style={{
          background: "hsl(var(--surface-stone, var(--card)))",
          border: "1px solid hsl(var(--filigree, var(--border)) / 0.3)",
          boxShadow: "0 8px 30px hsl(0 0% 0% / 0.3)",
        }}
      >
        {/* Header */}
        <div
          className="px-3 py-2 flex items-center justify-between"
          style={{ borderBottom: "1px solid hsl(var(--filigree, var(--border)) / 0.15)" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
              {tool.name}
            </span>
            <span
              className="text-[9px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ color, background: `color-mix(in srgb, ${color} 15%, transparent)` }}
            >
              {CATEGORY_LABELS[tool.category] || tool.category}
            </span>
          </div>
          <button
            onClick={toggleSave}
            className="p-1 rounded-md hover:bg-foreground/10 transition-colors"
            title={saved ? "Remove from saved tools" : "Save tool for later"}
          >
            {saved ? (
              <BookmarkCheck className="h-3.5 w-3.5 text-primary" />
            ) : (
              <Bookmark className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </button>
        </div>

        {/* Description */}
        <div className="px-3 py-2">
          <p className="text-[11px] text-foreground/80 leading-relaxed">{tool.description}</p>
        </div>

        {/* Footer */}
        {tool.url && (
          <div
            className="px-3 py-1.5 flex items-center justify-end"
            style={{ borderTop: "1px solid hsl(var(--filigree, var(--border)) / 0.1)" }}
          >
            <a
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-primary/70 hover:text-primary flex items-center gap-1 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              Visit <ExternalLink className="h-2.5 w-2.5" />
            </a>
          </div>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

/**
 * Parse text and replace AI tool mentions with hoverable chips.
 * Returns an array of ReactNodes (strings + ToolChip elements).
 */
export function parseToolMentions(text: string): ReactNode[] {
  const mentions = findToolMentions(text);
  if (mentions.length === 0) return [text];

  const parts: ReactNode[] = [];
  let lastIndex = 0;

  mentions.forEach((m, i) => {
    if (m.start > lastIndex) {
      parts.push(text.slice(lastIndex, m.start));
    }
    parts.push(
      <ToolChip key={`tool-${i}-${m.start}`} tool={m.tool} matchedText={text.slice(m.start, m.end)} />
    );
    lastIndex = m.end;
  });

  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

/**
 * Custom ReactMarkdown components that inject tool chips into text nodes.
 */
export function useToolMentionComponents() {
  return useMemo(() => ({
    // Override text rendering in paragraphs, list items, strong, em
    p: ({ children, ...props }: any) => <p {...props}>{processChildren(children)}</p>,
    li: ({ children, ...props }: any) => <li {...props}>{processChildren(children)}</li>,
    strong: ({ children, ...props }: any) => <strong {...props}>{processChildren(children)}</strong>,
    em: ({ children, ...props }: any) => <em {...props}>{processChildren(children)}</em>,
  }), []);
}

function processChildren(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    const parsed = parseToolMentions(children);
    return parsed.length === 1 && typeof parsed[0] === "string" ? children : <>{parsed}</>;
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === "string") {
        const parsed = parseToolMentions(child);
        return parsed.length === 1 && typeof parsed[0] === "string"
          ? child
          : <span key={i}>{parsed}</span>;
      }
      return child;
    });
  }
  return children;
}
