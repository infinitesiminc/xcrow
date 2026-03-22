import { useState, useEffect, useRef } from "react";
import ReactMarkdown, { type Components } from "react-markdown";

interface TypewriterMarkdownProps {
  content: string;
  speed?: number; // ms per character
  isStreaming?: boolean;
  components?: Components;
}

export default function TypewriterMarkdown({
  content,
  speed = 12,
  isStreaming = false,
  components,
}: TypewriterMarkdownProps) {
  const [visibleLen, setVisibleLen] = useState(0);
  const contentRef = useRef(content);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  // Reset when content identity changes (new message)
  useEffect(() => {
    if (content !== contentRef.current) {
      // Content changed entirely (new message) — if previous was fully shown, reset
      if (visibleLen >= contentRef.current.length) {
        setVisibleLen(0);
      }
      contentRef.current = content;
    }
  }, [content]);

  // Animate characters
  useEffect(() => {
    if (visibleLen >= content.length) return;

    const animate = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      const charsToAdd = Math.max(1, Math.floor(elapsed / speed));

      if (elapsed >= speed) {
        lastTickRef.current = now;
        setVisibleLen((prev) => Math.min(prev + charsToAdd, content.length));
      }

      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [content, speed, visibleLen]);

  // If streaming is done and we're behind, catch up faster
  useEffect(() => {
    if (!isStreaming && visibleLen < content.length && visibleLen > content.length * 0.8) {
      const catchUp = setInterval(() => {
        setVisibleLen((prev) => {
          const next = Math.min(prev + 5, content.length);
          if (next >= content.length) clearInterval(catchUp);
          return next;
        });
      }, 4);
      return () => clearInterval(catchUp);
    }
  }, [isStreaming, content.length, visibleLen]);

  const displayed = content.slice(0, visibleLen);

  return (
    <div className="chat-prose max-w-[92%]">
      <ReactMarkdown components={components}>{displayed}</ReactMarkdown>
      {visibleLen < content.length && (
        <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
      )}
    </div>
  );
}