/**
 * useMyStack — localStorage-persisted tool stack for the current user.
 * Tools can be "equipped" to provide passive score bonuses in sims.
 */
import { useState, useCallback, useEffect, useMemo } from "react";

const STORAGE_KEY = "xcrow-my-stack";
const EQUIPPED_KEY = "xcrow-equipped-tool";

/** Tool category → score bonus mapping */
const TOOL_BONUSES: Record<string, { category: string; bonus: number }> = {
  "ChatGPT": { category: "Communication", bonus: 5 },
  "Gemini": { category: "Analytical", bonus: 5 },
  "Claude": { category: "Strategic", bonus: 5 },
  "Midjourney": { category: "Creative", bonus: 8 },
  "DALL-E": { category: "Creative", bonus: 5 },
  "Canva AI": { category: "Creative", bonus: 5 },
  "GitHub Copilot": { category: "Technical", bonus: 8 },
  "Cursor": { category: "Technical", bonus: 5 },
  "Notion AI": { category: "Leadership", bonus: 5 },
  "Grammarly": { category: "Communication", bonus: 5 },
  "Jasper": { category: "Communication", bonus: 5 },
  "Perplexity": { category: "Analytical", bonus: 5 },
  "Tableau": { category: "Analytical", bonus: 5 },
};

export function useMyStack() {
  const [stack, setStack] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  const [equippedTool, setEquippedTool] = useState<string | null>(() => {
    try { return localStorage.getItem(EQUIPPED_KEY) || null; } catch { return null; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  }, [stack]);

  useEffect(() => {
    if (equippedTool) localStorage.setItem(EQUIPPED_KEY, equippedTool);
    else localStorage.removeItem(EQUIPPED_KEY);
  }, [equippedTool]);

  const addTool = useCallback((name: string) => {
    setStack(prev => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  const removeTool = useCallback((name: string) => {
    setStack(prev => prev.filter(n => n !== name));
    setEquippedTool(prev => prev === name ? null : prev);
  }, []);

  const isInStack = useCallback((name: string) => stack.includes(name), [stack]);

  const toggleTool = useCallback((name: string) => {
    setStack(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }, []);

  const equipTool = useCallback((name: string) => {
    if (!stack.includes(name)) return;
    setEquippedTool(prev => prev === name ? null : name);
  }, [stack]);

  /** Get the bonus for the currently equipped tool, if any */
  const equippedBonus = useMemo(() => {
    if (!equippedTool) return null;
    return TOOL_BONUSES[equippedTool] || null;
  }, [equippedTool]);

  return {
    stack, addTool, removeTool, isInStack, toggleTool,
    stackSize: stack.length,
    equippedTool, equipTool, equippedBonus,
  };
}
