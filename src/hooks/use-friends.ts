/**
 * useFriends — Hook for managing friendships, presence, and messages.
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface FriendLastSim {
  job_title: string;
  task_name: string;
  completed_at: string;
  company: string | null;
}

export interface Friend {
  id: string; // friendship row id
  friendId: string;
  displayName: string;
  username: string | null;
  avatarId: string | null;
  isOnline: boolean;
  lastSeenAt: string | null;
  currentActivity: string | null;
  totalXp: number;
  status: "pending" | "accepted" | "blocked";
  isRequester: boolean; // did current user send the request?
  lastSim: FriendLastSim | null;
}

export interface FriendMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
  readAt: string | null;
}

export function useFriends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchFriends = useCallback(async () => {
    if (!user) { setFriends([]); setLoading(false); return; }

    const { data: friendships } = await supabase
      .from("friendships")
      .select("id, requester_id, recipient_id, status")
      .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

    if (!friendships || friendships.length === 0) {
      setFriends([]);
      setPendingCount(0);
      setLoading(false);
      return;
    }

    const friendIds = friendships.map(f =>
      f.requester_id === user.id ? f.recipient_id : f.requester_id
    );

    const [profilesRes, presenceRes, xpRes] = await Promise.all([
      supabase.from("profiles").select("id, display_name, username, avatar_id").in("id", friendIds),
      supabase.from("user_presence").select("user_id, is_online, last_seen_at, current_activity").in("user_id", friendIds),
      supabase.from("completed_simulations").select("user_id, skills_earned").in("user_id", friendIds),
    ]);

    const profileMap = new Map((profilesRes.data || []).map(p => [p.id, p]));
    const presenceMap = new Map((presenceRes.data || []).map(p => [p.user_id, p]));

    // Calculate XP per user
    const xpMap = new Map<string, number>();
    for (const sim of xpRes.data || []) {
      const earned = sim.skills_earned as { xp: number }[] | null;
      const xp = Array.isArray(earned)
        ? earned.reduce((sum, e) => sum + (e.xp || 0), 0)
        : 100;
      xpMap.set(sim.user_id, (xpMap.get(sim.user_id) || 0) + xp);
    }

    const result: Friend[] = friendships.map(f => {
      const friendId = f.requester_id === user.id ? f.recipient_id : f.requester_id;
      const profile = profileMap.get(friendId);
      const presence = presenceMap.get(friendId);
      return {
        id: f.id,
        friendId,
        displayName: profile?.display_name || "Unknown",
        username: profile?.username || null,
        avatarId: profile?.avatar_id || null,
        isOnline: presence?.is_online || false,
        lastSeenAt: presence?.last_seen_at || null,
        currentActivity: presence?.current_activity || null,
        totalXp: xpMap.get(friendId) || 0,
        status: f.status as Friend["status"],
        isRequester: f.requester_id === user.id,
      };
    });

    setFriends(result);
    setPendingCount(result.filter(f => f.status === "pending" && !f.isRequester).length);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchFriends(); }, [fetchFriends]);

  // Real-time subscription for friendship changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("friendships-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "friendships" }, () => {
        fetchFriends();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, fetchFriends]);

  const sendRequest = useCallback(async (recipientId: string) => {
    if (!user) return;
    await supabase.from("friendships").insert({
      requester_id: user.id,
      recipient_id: recipientId,
      status: "pending",
    });
  }, [user]);

  const acceptRequest = useCallback(async (friendshipId: string) => {
    await supabase.from("friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", friendshipId);
  }, []);

  const removeFriend = useCallback(async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
  }, []);

  const blockFriend = useCallback(async (friendshipId: string) => {
    await supabase.from("friendships").update({ status: "blocked", updated_at: new Date().toISOString() }).eq("id", friendshipId);
  }, []);

  // Update own presence
  const updatePresence = useCallback(async (activity?: string) => {
    if (!user) return;
    await supabase.from("user_presence").upsert({
      user_id: user.id,
      is_online: true,
      last_seen_at: new Date().toISOString(),
      current_activity: activity || null,
    });
  }, [user]);

  const goOffline = useCallback(async () => {
    if (!user) return;
    await supabase.from("user_presence").upsert({
      user_id: user.id,
      is_online: false,
      last_seen_at: new Date().toISOString(),
    });
  }, [user]);

  return {
    friends,
    loading,
    pendingCount,
    sendRequest,
    acceptRequest,
    removeFriend,
    blockFriend,
    updatePresence,
    goOffline,
    refetch: fetchFriends,
  };
}
