/**
 * ToolAtlas — Two-layer tools page:
 * 1. Stack Builder (search, templates, browse, build stack)
 * 2. Atlas Map (visual exploration)
 */
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Map, Package, X, ExternalLink, Sparkles, Plus, Check, Eye } from "lucide-react";
import SEOHead from "@/components/SEOHead";
import StackBuilder from "@/components/tools/StackBuilder";
import ToolAtlasMap from "@/components/territory/ToolAtlasMap";
import { GTC_TOOLS, CATEGORY_CONFIG } from "@/data/gtc-tools-registry";
import { getSkillsForTool } from "@/data/tool-skill-mappings";
import { useMyStack } from "@/hooks/use-my-stack";

type ViewMode = "builder" | "atlas";

export default function ToolAtlas() {
  const [view, setView] = useState<ViewMode>("builder");
  const [selectedToolName, setSelectedToolName] = useState<string | null>(null);
  const { toggleTool, isInStack, stackSize } = useMyStack();

  const selectedTool = selectedToolName ? GTC_TOOLS.find(t => t.name === selectedToolName) : null;

  const handleSelectTool = useCallback((name: string) => {
    setSelectedToolName(name);
  }, []);

  const views: { key: ViewMode; label: string; icon: React.ReactNode }[] = [
    { key: "builder", label: "Stack Builder", icon: <Package className="h-3.5 w-3.5" /> },
    { key: "atlas", label: "Atlas Map", icon: <Map className="h-3.5 w-3.5" /> },
  ];

  return (
    <>
      <SEOHead
        title="AI Tool Atlas — Build Your Stack | Xcrow"
        description="Discover 70+ AI tools, get personalized recommendations for your role, and build your professional AI toolkit."
        path="/tools"
      />

      <div className="flex flex-col h-[calc(100vh-64px)]">
        {/* Tab bar */}
        <div className="shrink-0 px-4 pt-3 pb-2 flex items-center gap-3 border-b" style={{ borderColor: "hsl(var(--border) / 0.2)" }}>
          <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: "hsl(var(--muted) / 0.1)" }}>
            {views.map(v => (
              <button
                key={v.key}
                onClick={() => setView(v.key)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: view === v.key ? "hsl(var(--card))" : "transparent",
                  color: view === v.key ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  boxShadow: view === v.key ? "0 1px 3px hsl(var(--foreground) / 0.1)" : "none",
                }}
              >
                {v.icon}
                {v.label}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full" style={{ background: "hsl(45, 90%, 55%, 0.1)", color: "hsl(45, 90%, 55%)" }}>
              <Package className="inline h-3 w-3 mr-1" />{stackSize} in stack
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden relative">
          {view === "builder" && (
            <div className="h-full overflow-y-auto p-4 sm:p-6 max-w-6xl mx-auto">
              <StackBuilder onSelectTool={handleSelectTool} />
            </div>
          )}

          {view === "atlas" && (
            <ToolAtlasMap />
          )}

          {/* Tool detail slide-over */}
          <AnimatePresence>
            {selectedTool && view !== "atlas" && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-30"
                  style={{ background: "hsl(var(--background) / 0.5)" }}
                  onClick={() => setSelectedToolName(null)}
                />

                <motion.div
                  initial={{ x: 340 }}
                  animate={{ x: 0 }}
                  exit={{ x: 340 }}
                  transition={{ type: "spring", damping: 25, stiffness: 300 }}
                  className="absolute top-0 right-0 h-full w-80 z-40 overflow-y-auto"
                  style={{
                    background: "hsl(var(--card) / 0.97)",
                    borderLeft: "1px solid hsl(var(--border) / 0.3)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div className="p-4 space-y-4">
                    <button onClick={() => setSelectedToolName(null)} className="absolute top-3 right-3">
                      <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedTool.icon}</span>
                      <div>
                        <h3 className="text-sm font-bold" style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}>
                          {selectedTool.name}
                        </h3>
                        <p className="text-[11px]" style={{ color: "hsl(var(--muted-foreground))" }}>{selectedTool.company}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {selectedTool.version && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-mono" style={{ background: "hsl(var(--muted) / 0.3)", color: "hsl(var(--foreground))" }}>
                          v{selectedTool.version}
                        </span>
                      )}
                      <span className="text-[10px] px-2 py-0.5 rounded-full" style={{
                        background: CATEGORY_CONFIG[selectedTool.category].color + "22",
                        color: CATEGORY_CONFIG[selectedTool.category].color
                      }}>
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
                      {selectedTool.pricing && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: "hsl(var(--muted) / 0.2)", color: "hsl(var(--muted-foreground))" }}>
                          {selectedTool.pricing}
                        </span>
                      )}
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: "hsl(var(--foreground) / 0.8)" }}>
                      {selectedTool.description}
                    </p>

                    {/* Skills */}
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

                    {/* Product Suite */}
                    {selectedTool.products && selectedTool.products.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider mb-1.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                          Product Suite · {selectedTool.products.length} products
                        </h4>
                        <div className="space-y-1.5">
                          {selectedTool.products.map(product => (
                            <div key={product.name} className="px-2.5 py-2 rounded-lg"
                              style={{ background: "hsl(var(--muted) / 0.08)", border: "1px solid hsl(var(--border) / 0.15)" }}>
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-semibold" style={{ color: "hsl(var(--foreground))" }}>{product.name}</span>
                                <span className="text-[9px] px-1.5 py-0.5 rounded-full" style={{
                                  background: product.type === "learnable" ? "hsl(140, 60%, 45%, 0.15)" : "hsl(var(--muted) / 0.2)",
                                  color: product.type === "learnable" ? "hsl(140, 60%, 45%)" : "hsl(var(--muted-foreground))",
                                }}>
                                  {product.type === "learnable" ? "Hands-on" : "Reference"}
                                </span>
                              </div>
                              <p className="text-[10px] mt-0.5" style={{ color: "hsl(var(--foreground) / 0.6)" }}>{product.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

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

                    {/* Actions */}
                    <div className="space-y-2 pt-2">
                      <button
                        onClick={() => toggleTool(selectedTool.name)}
                        className="w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
                        style={{
                          background: isInStack(selectedTool.name) ? "hsl(45, 90%, 55%, 0.15)" : "hsl(var(--muted) / 0.15)",
                          border: `1px solid ${isInStack(selectedTool.name) ? "hsl(45, 90%, 55%, 0.4)" : "hsl(var(--border) / 0.2)"}`,
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
                            background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary) / 0.8))",
                            color: "hsl(var(--primary-foreground))",
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
                          style={{ border: "1px solid hsl(var(--border) / 0.3)", color: "hsl(var(--foreground))" }}
                        >
                          <ExternalLink className="h-3 w-3" /> Visit Website
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}
