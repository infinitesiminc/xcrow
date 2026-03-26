/**
 * RoleStackHero — "Your AI Stack for [Role]" personalized tool recommendations.
 * Shows 5-8 core tools as large interactive cards with add-to-stack functionality.
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Check, ExternalLink, ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import { GTC_TOOLS, CATEGORY_CONFIG } from "@/data/gtc-tools-registry";
import { ROLE_RECOMMENDATIONS, matchRole, type RoleRecommendation } from "@/data/role-tool-recommendations";
import { getSkillsForTool } from "@/data/tool-skill-mappings";
import { useMyStack } from "@/hooks/use-my-stack";
import JobTitleSearch from "./JobTitleSearch";

interface Props {
  userRole?: string;
  onSelectTool?: (toolName: string) => void;
}

export default function RoleStackHero({ userRole, onSelectTool }: Props) {
  const recommendation = matchRole(userRole || "student");
  const [selectedRole, setSelectedRole] = useState<RoleRecommendation>(recommendation);
  const [showExpanded, setShowExpanded] = useState(false);
  const [showRolePicker, setShowRolePicker] = useState(false);
  const { toggleTool, isInStack, addTool } = useMyStack();

  const handleApplyStack = useCallback((toolNames: string[]) => {
    toolNames.forEach(name => addTool(name));
  }, [addTool]);

  const handleSelectRole = useCallback((roleName: string) => {
    const match = ROLE_RECOMMENDATIONS.find(r => r.role === roleName);
    if (match) {
      setSelectedRole(match);
      setShowRolePicker(false);
    }
  }, []);

  const coreTools = selectedRole.coreTools
    .map(name => GTC_TOOLS.find(t => t.name === name))
    .filter(Boolean) as typeof GTC_TOOLS;

  const expandedTools = selectedRole.expandedTools
    .map(name => GTC_TOOLS.find(t => t.name === name))
    .filter(Boolean) as typeof GTC_TOOLS;

  return (
    <div className="space-y-6">
      {/* Job title search */}
      <JobTitleSearch onSelectTool={onSelectTool} />

      {/* Role selector */}
      <div className="flex flex-col sm:flex-row sm:items-end gap-3">
        <div className="flex-1">
          <p className="text-xs uppercase tracking-wider mb-1" style={{ color: "hsl(var(--muted-foreground))", fontFamily: "'Cinzel', serif" }}>
            Your AI Toolkit
          </p>
          <div className="flex items-center gap-2">
            <h2
              className="text-2xl font-bold cursor-pointer hover:opacity-80 transition-opacity"
              style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}
              onClick={() => setShowRolePicker(!showRolePicker)}
            >
              {selectedRole.role}
              <ChevronDown className="inline h-5 w-5 ml-1 opacity-50" />
            </h2>
          </div>
          <p className="text-sm mt-1" style={{ color: "hsl(var(--muted-foreground))" }}>
            {selectedRole.description}
          </p>
        </div>
        <div className="text-xs px-3 py-1.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
          {coreTools.length} core tools · {expandedTools.length} advanced
        </div>
      </div>

      {/* Role picker dropdown */}
      {showRolePicker && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        >
          {ROLE_RECOMMENDATIONS.map(r => (
            <button
              key={r.role}
              onClick={() => { setSelectedRole(r); setShowRolePicker(false); }}
              className="text-left px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: r.role === selectedRole.role ? "hsl(var(--primary) / 0.15)" : "hsl(var(--muted) / 0.1)",
                border: `1px solid ${r.role === selectedRole.role ? "hsl(var(--primary) / 0.4)" : "hsl(var(--border) / 0.3)"}`,
                color: r.role === selectedRole.role ? "hsl(var(--primary))" : "hsl(var(--foreground))",
              }}
            >
              {r.role}
            </button>
          ))}
        </motion.div>
      )}

      {/* Core tools grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {coreTools.map((tool, i) => {
          const cfg = CATEGORY_CONFIG[tool.category];
          const inStack = isInStack(tool.name);
          const skills = getSkillsForTool(tool.name);

          return (
            <motion.div
              key={tool.name}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="relative rounded-xl p-4 cursor-pointer group transition-all"
              style={{
                background: "hsl(var(--card))",
                border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.4)" : "hsl(var(--border) / 0.3)"}`,
              }}
              onClick={() => onSelectTool?.(tool.name)}
            >
              {/* Priority badge */}
              <div
                className="absolute -top-2 -left-2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{ background: cfg.color, color: "#fff" }}
              >
                {i + 1}
              </div>

              <div className="flex items-start gap-3">
                <span className="text-2xl mt-0.5">{tool.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold truncate" style={{ color: "hsl(var(--foreground))" }}>
                      {tool.name}
                    </h3>
                    {tool.version && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0" style={{ background: "hsl(var(--muted) / 0.2)", color: "hsl(var(--muted-foreground))" }}>
                        {tool.version}
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                    {tool.company}
                  </p>
                  <p className="text-[11px] mt-1.5 line-clamp-2" style={{ color: "hsl(var(--foreground) / 0.7)" }}>
                    {tool.description}
                  </p>

                  {/* Skills chips */}
                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {skills.slice(0, 3).map(s => (
                        <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full" style={{ background: "hsl(var(--primary) / 0.1)", color: "hsl(var(--primary))" }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={(e) => { e.stopPropagation(); toggleTool(tool.name); }}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1 transition-all"
                  style={{
                    background: inStack ? "hsl(45, 90%, 55%, 0.15)" : "hsl(var(--muted) / 0.1)",
                    border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.3)" : "hsl(var(--border) / 0.2)"}`,
                    color: inStack ? "hsl(45, 90%, 55%)" : "hsl(var(--foreground) / 0.7)",
                  }}
                >
                  {inStack ? <Check className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                  {inStack ? "In Stack" : "Add"}
                </button>
                {tool.type === "learnable" && (
                  <button
                    className="py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider flex items-center gap-1"
                    style={{
                      background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                      color: "hsl(var(--primary-foreground))",
                    }}
                  >
                    <Sparkles className="h-3 w-3" /> Practice
                  </button>
                )}
                {tool.url && (
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 rounded-lg transition-colors"
                    style={{ color: "hsl(var(--muted-foreground))" }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Expand to see more */}
      {expandedTools.length > 0 && (
        <div>
          <button
            onClick={() => setShowExpanded(!showExpanded)}
            className="flex items-center gap-2 text-xs font-medium px-3 py-1.5 rounded-lg transition-all mx-auto"
            style={{ color: "hsl(var(--muted-foreground))", background: "hsl(var(--muted) / 0.1)" }}
          >
            {showExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            {showExpanded ? "Hide" : "Show"} {expandedTools.length} advanced tools
          </button>

          {showExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 mt-3"
            >
              {expandedTools.map(tool => {
                const inStack = isInStack(tool.name);
                return (
                  <div
                    key={tool.name}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all"
                    style={{
                      background: "hsl(var(--card))",
                      border: `1px solid ${inStack ? "hsl(45, 90%, 55%, 0.3)" : "hsl(var(--border) / 0.2)"}`,
                    }}
                    onClick={() => onSelectTool?.(tool.name)}
                  >
                    <span className="text-lg">{tool.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "hsl(var(--foreground))" }}>{tool.name}</p>
                      <p className="text-[9px]" style={{ color: "hsl(var(--muted-foreground))" }}>{tool.company}</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); toggleTool(tool.name); }}
                      className="shrink-0"
                    >
                      {inStack
                        ? <Check className="h-3.5 w-3.5" style={{ color: "hsl(45, 90%, 55%)" }} />
                        : <Plus className="h-3.5 w-3.5" style={{ color: "hsl(var(--muted-foreground))" }} />}
                    </button>
                  </div>
                );
              })}
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
}
