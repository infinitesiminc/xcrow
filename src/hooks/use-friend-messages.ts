/**
 * useFriendMessages — Hook for real-time DM with a specific friend.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FriendMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export function useFriendMessages(friendId: string | null) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<FriendMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!user || !friendId) { setMessages([]); return; }
    setLoading(true);

    const { data } = await supabase
      .from("friend_messages")
      .select("id, sender_id, recipient_id, content, created_at, read_at")
      .or(
        `and(sender_id.eq.${user.id},recipient_id.eq.${friendId}),and(sender_id.eq.${friendId},recipient_id.eq.${user.id})`
      )
      .order("created_at", { ascending: true })
      .limit(100);

    setMessages(
      (data || []).map(m => ({
        id: m.id,
        senderId: m.sender_id,
        content: m.content,
        createdAt: m.created_at,
        readAt: m.read_at,
      }))
    );
    setLoading(false);

    // Mark unread messages as read
    if (data?.length) {
      const unread = data.filter(m => m.sender_id === friendId && !m.read_at);
      if (unread.length > 0) {
        await supabase
          .from("friend_messages")
          .update({ read_at: new Date().toISOString() })
          .in("id", unread.map(m => m.id));
      }
    }
  }, [user, friendId]);

  // Fetch on mount / friend change
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Real-time subscription
  useEffect(() => {
    if (!user || !friendId) return;

    channelRef.current = supabase
      .channel(`dm-${[user.id, friendId].sort().join("-")}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "friend_messages",
      }, (payload) => {
        const m = payload.new as any;
        // Only add if relevant to this conversation
        if (
          (m.sender_id === user.id && m.recipient_id === friendId) ||
          (m.sender_id === friendId && m.recipient_id === user.id)
        ) {
          setMessages(prev => [
            ...prev,
            {
              id: m.id,
              senderId: m.sender_id,
              content: m.content,
              createdAt: m.created_at,
              readAt: m.read_at,
            },
          ]);
          // Auto-mark as read if we're the recipient
          if (m.sender_id === friendId) {
            supabase
              .from("friend_messages")
              .update({ read_at: new Date().toISOString() })
              .eq("id", m.id)
              .then(() => {});
          }
        }
      })
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [user, friendId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!user || !friendId || !content.trim()) return;
    setSending(true);
    await supabase.from("friend_messages").insert({
      sender_id: user.id,
      recipient_id: friendId,
      content: content.trim(),
    });
    setSending(false);
  }, [user, friendId]);

  return { messages, loading, sending, sendMessage, refetch: fetchMessages };
}
