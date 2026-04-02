import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

// Minimal chat context kept for compatibility
export interface ViewContext {
  page: string;
}

export type ChatItem =
  | { type: "user"; content: string }
  | { type: "assistant"; content: string };

interface ChatContextValue {
  items: ChatItem[];
  isStreaming: boolean;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  sendMessage: (text: string) => Promise<void>;
  clearChat: () => void;
  setViewContext: (ctx: Partial<ViewContext>) => void;
  viewContext: ViewContext;
  hasInteracted: boolean;
  simActive: boolean;
  setSimActive: (active: boolean) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used inside ChatProvider");
  return ctx;
}

export function useChatViewContext(_ctx: Partial<ViewContext>, _deps: any[] = []) {
  // no-op
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [items] = useState<ChatItem[]>([]);
  const [isStreaming] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [viewCtx, setViewCtx] = useState<ViewContext>({ page: "home" });

  const setViewContext = useCallback((ctx: Partial<ViewContext>) => {
    setViewCtx(prev => ({ ...prev, ...ctx }));
  }, []);

  const sendMessage = useCallback(async (_text: string) => {}, []);
  const clearChat = useCallback(() => {}, []);

  return (
    <ChatContext.Provider
      value={{
        items,
        isStreaming,
        isOpen,
        setIsOpen,
        sendMessage,
        clearChat,
        setViewContext,
        viewContext: viewCtx,
        hasInteracted,
        simActive,
        setSimActive,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
