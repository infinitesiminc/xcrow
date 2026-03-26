/**
 * useMyStack — localStorage-persisted tool stack for the current user.
 */
import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "xcrow-my-stack";

export function useMyStack() {
  const [stack, setStack] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  }, [stack]);

  const addTool = useCallback((name: string) => {
    setStack(prev => prev.includes(name) ? prev : [...prev, name]);
  }, []);

  const removeTool = useCallback((name: string) => {
    setStack(prev => prev.filter(n => n !== name));
  }, []);

  const isInStack = useCallback((name: string) => stack.includes(name), [stack]);

  const toggleTool = useCallback((name: string) => {
    setStack(prev => prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]);
  }, []);

  return { stack, addTool, removeTool, isInStack, toggleTool, stackSize: stack.length };
}
