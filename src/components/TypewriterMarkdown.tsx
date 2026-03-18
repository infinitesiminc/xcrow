import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";

interface TypewriterMarkdownProps {
  content: string;
  speed?: number; // ms per character
  isStreaming?: boolean;
}

export default function TypewriterMarkdown({
  content,
  speed = 12,
  isStreaming = false,
}: TypewriterMarkdownProps) {
  const [visibleLen, setVisibleLen] = useState(0);
  const prevContentLen = useRef(0);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef(0);

  // When new content arrives from streaming, we animate from where we left off
  useEffect(() => {
    if (content.length <= visibleLen) return;

    const animate = (now: number) => {
      if (!lastTickRef.current) lastTickRef.current = now;
      const elapsed = now - lastTickRef.current;
      const charsToAdd = Math.max(1, Math.floor(elapsed / speed));

      if (elapsed >= speed) {
        lastTickRef.current = now;
        setVisibleLen((prev) => {
          const next = Math.min(prev + charsToAdd, content.length);
          return next;
        });
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
    if (!isStreaming && visibleLen < content.length) {
      const catchUp = setInterval(() => {
        setVisibleLen((prev) => {
          const next = Math.min(prev + 3, content.length);
          if (next >= content.length) clearInterval(catchUp);
          return next;
        });
      }, 4);
      return () => clearInterval(catchUp);
    }
  }, [isStreaming, content.length, visibleLen]);

  prevContentLen.current = content.length;

  const displayed = content.slice(0, visibleLen);

  return (
    <div className="chat-prose max-w-[92%]">
      <ReactMarkdown>{displayed}</ReactMarkdown>
      {visibleLen < content.length && (
        <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
      )}
    </div>
  );
}
