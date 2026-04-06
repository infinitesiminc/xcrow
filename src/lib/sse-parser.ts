/**
 * Shared SSE stream parser for leadgen edge functions.
 * Eliminates duplicated parsing logic across Leadgen.tsx handlers.
 */

export interface SSECallbacks {
  onLeads?: (leads: any[]) => void;
  onNiches?: (niches: Array<{ label: string; description?: string }>) => void;
  onTextDelta?: (chunk: string) => void;
  onDone?: () => void;
}

/**
 * Parse an SSE ReadableStream from the leadgen-chat edge function.
 * Handles `data: {...}` lines and calls the appropriate callback.
 */
export async function parseSSEStream(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  callbacks: SSECallbacks,
  signal?: AbortSignal
): Promise<void> {
  const decoder = new TextDecoder();
  let buf = "";

  while (true) {
    if (signal?.aborted) break;
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);

      // Skip SSE comments and empty lines
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;

      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") {
        callbacks.onDone?.();
        continue;
      }

      try {
        const parsed = JSON.parse(jsonStr);

        if (parsed.type === "leads" && parsed.leads) {
          callbacks.onLeads?.(parsed.leads);
          continue;
        }

        if (parsed.type === "niches" && parsed.niches) {
          callbacks.onNiches?.(parsed.niches);
          continue;
        }

        // Standard OpenAI-style delta
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) {
          callbacks.onTextDelta?.(content);
        }
      } catch {
        // Incomplete JSON — push line back to buffer and wait for more data
        buf = line + "\n" + buf;
        break;
      }
    }
  }

  // Process any remaining buffer
  if (buf.trim()) {
    for (const raw of buf.split("\n")) {
      const line = raw.replace(/\r$/, "");
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.type === "leads" && parsed.leads) {
          callbacks.onLeads?.(parsed.leads);
        } else if (parsed.type === "niches" && parsed.niches) {
          callbacks.onNiches?.(parsed.niches);
        } else {
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) callbacks.onTextDelta?.(content);
        }
      } catch {}
    }
  }
}
