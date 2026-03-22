import { useState, useEffect, useRef, useMemo } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

interface TypewriterMarkdownProps {
  content: string;
  speed?: number; // ms per character
  isStreaming?: boolean;
  components?: Components;
}

export default function TypewriterMarkdown({
  content,
  speed = 8,
  isStreaming = false,
  components,
}: TypewriterMarkdownProps) {
  const [visibleLen, setVisibleLen] = useState(0);
  const prevContentRef = useRef(content);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Reset on new message (content identity change)
  useEffect(() => {
    if (content !== prevContentRef.current) {
      if (visibleLen >= prevContentRef.current.length) {
        setVisibleLen(0);
        startTimeRef.current = null;
      }
      prevContentRef.current = content;
    }
  }, [content]);

  // Single smooth rAF loop — derive visibleLen from elapsed time
  useEffect(() => {
    if (visibleLen >= content.length) {
      startTimeRef.current = null;
      return;
    }

    const animate = (now: number) => {
      if (!startTimeRef.current) startTimeRef.current = now - visibleLen * speed;
      const elapsed = now - startTimeRef.current;
      const target = Math.min(Math.floor(elapsed / speed), content.length);

      if (target !== visibleLen) {
        setVisibleLen(target);
      }

      if (target < content.length) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [content, speed, visibleLen]);

  const done = visibleLen >= content.length;

  // While typing: render full markdown but clip via CSS.
  // We render the FULL content always so markdown parses correctly,
  // then use an overlay gradient to hide the untyped portion.
  // This avoids partial-markdown re-parse flicker entirely.
  const displayed = useMemo(() => content.slice(0, visibleLen), [content, visibleLen]);

  return (
    <div className="chat-prose max-w-[92%]">
      {done ? (
        <ReactMarkdown components={components}>{content}</ReactMarkdown>
      ) : (
        <>
          {/* Render as whitespace-preserving text during animation to avoid markdown re-parse flicker */}
          <div className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {displayed}
            <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
          </div>
        </>
      )}
    </div>
  );
}
