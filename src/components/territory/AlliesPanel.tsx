/**
 * AlliesPanel — Social tab on the Territory Map.
 * Shows friend list with online status, activity feed, pending requests,
 * and friend search. Dark Fantasy RPG themed.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFriends, type Friend } from "@/hooks/use-friends";
import {
  Users, Search, UserPlus, Check, X, Shield,
  MessageCircle, Eye, Swords, Clock, Sparkles,
} from "lucide-react";

import AllyChat from "./AllyChat";
import FriendActivityFeed from "./FriendActivityFeed";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAvatarById } from "@/lib/avatars";

/* ── Sub-tabs ── */
type SubTab = "online" | "all" | "pending" | "search";

const AlliesPanel = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { friends, loading, pendingCount, acceptRequest, removeFriend, sendRequest } = useFriends();
  const [subTab, setSubTab] = useState<SubTab>("online");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; display_name: string; username: string | null; avatar_id: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [chatFriend, setChatFriend] = useState<Friend | null>(null);

  // Search users by display name or username
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim() || !user) return;
    setSearching(true);
    const q = searchQuery.trim().toLowerCase();
    const { data } = await supabase
      .from("profiles")
      .select("id, display_name, username, avatar_id")
      .or(`display_name.ilike.%${q}%,username.ilike.%${q}%`)
      .neq("id", user.id)
      .limit(20);
    setSearchResults(data || []);
    setSearching(false);
  }, [searchQuery, user]);

  useEffect(() => {
    if (subTab === "search" && searchQuery.length >= 2) {
      const timer = setTimeout(handleSearch, 400);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, subTab, handleSearch]);

  const acceptedFriends = friends.filter(f => f.status === "accepted");
  const onlineFriends = acceptedFriends.filter(f => f.isOnline);
  const pendingRequests = friends.filter(f => f.status === "pending" && !f.isRequester);
  const sentRequests = friends.filter(f => f.status === "pending" && f.isRequester);
  const friendIds = new Set(friends.map(f => f.friendId));

  const displayList = subTab === "online" ? onlineFriends
    : subTab === "all" ? acceptedFriends
    : subTab === "pending" ? [...pendingRequests, ...sentRequests]
    : [];

  const formatLastSeen = (dateStr: string | null) => {
    if (!dateStr) return "Unknown";
    const diff = Date.now() - new Date(dateStr).getTime();
    if (diff < 60_000) return "Just now";
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
    return `${Math.floor(diff / 86_400_000)}d ago`;
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center justify-between shrink-0"
        style={{
          borderBottom: "1px solid hsl(var(--filigree) / 0.15)",
          background: "hsl(var(--surface-stone) / 0.5)",
        }}
      >
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4" style={{ color: "hsl(var(--filigree-glow))" }} />
          <h3
            className="text-sm font-bold tracking-wider"
            style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--foreground))" }}
          >
            ALLIES
          </h3>
          {onlineFriends.length > 0 && (
            <span
              className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{
                background: "hsl(142 70% 45% / 0.2)",
                color: "hsl(142 70% 55%)",
              }}
            >
              {onlineFriends.length} online
            </span>
          )}
        </div>
        {pendingCount > 0 && (
          <button
            onClick={() => setSubTab("pending")}
            className="text-[10px] px-2 py-1 rounded-md font-medium animate-pulse"
            style={{
              background: "hsl(var(--filigree) / 0.15)",
              color: "hsl(var(--filigree-glow))",
              fontFamily: "'Cinzel', serif",
            }}
          >
            {pendingCount} request{pendingCount > 1 ? "s" : ""}
          </button>
        )}
      </div>

      {/* Sub-tabs */}
      <div
        className="flex gap-1 px-3 py-2 shrink-0"
        style={{ borderBottom: "1px solid hsl(var(--filigree) / 0.1)" }}
      >
        {([
          { key: "online" as SubTab, label: "Online", icon: Sparkles },
          { key: "all" as SubTab, label: "All", icon: Users },
          { key: "pending" as SubTab, label: "Requests", icon: Shield, badge: pendingCount },
          { key: "search" as SubTab, label: "Find", icon: Search },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all relative"
            style={{
              fontFamily: "'Cinzel', serif",
              ...(subTab === tab.key
                ? { color: "hsl(var(--filigree-glow))", background: "hsl(var(--filigree) / 0.12)" }
                : { color: "hsl(var(--muted-foreground))" }),
            }}
          >
            <tab.icon className="h-3 w-3" />
            {tab.label}
            {tab.badge ? (
              <span
                className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-[8px] flex items-center justify-center font-bold"
                style={{ background: "hsl(var(--filigree-glow))", color: "hsl(var(--background))" }}
              >
                {tab.badge}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {/* Search input */}
      {subTab === "search" && (
        <div className="px-3 py-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by name or username..."
              className="pl-8 h-8 text-xs bg-transparent border-muted/30"
              autoFocus
            />
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="px-3 py-2 space-y-1">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-xs text-muted-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
                Summoning allies...
              </div>
            </div>
          ) : subTab === "search" ? (
            /* Search results */
            searchResults.length === 0 && searchQuery.length >= 2 ? (
              <div className="text-center py-8 text-xs text-muted-foreground">
                {searching ? "Searching..." : "No adventurers found"}
              </div>
            ) : (
              searchResults.map(result => {
                const isFriend = friendIds.has(result.id);
                return (
                  <FriendRow
                    key={result.id}
                    name={result.display_name || "Unknown"}
                    username={result.username}
                    avatarId={result.avatar_id}
                    trailing={
                      isFriend ? (
                        <span className="text-[10px] text-muted-foreground px-2 py-1 rounded-md"
                          style={{ background: "hsl(var(--filigree) / 0.1)", fontFamily: "'Cinzel', serif" }}>
                          Allied
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-[10px]"
                          style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}
                          onClick={() => sendRequest(result.id)}
                        >
                          <UserPlus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      )
                    }
                    onClick={() => result.username && navigate(`/u/${result.username}`)}
                  />
                );
              })
            )
          ) : displayList.length === 0 ? (
            <EmptyState subTab={subTab} onSearch={() => setSubTab("search")} />
          ) : (
            displayList.map(friend => (
              <FriendCard
                key={friend.id}
                friend={friend}
                onAccept={() => acceptRequest(friend.id)}
                onReject={() => removeFriend(friend.id)}
                onView={() => friend.username && navigate(`/u/${friend.username}`)}
                onMessage={() => setChatFriend(friend)}
                formatLastSeen={formatLastSeen}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* DM Chat Drawer */}
      <AnimatePresence>
        {chatFriend && (
          <AllyChat
            key={chatFriend.friendId}
            friend={chatFriend}
            onBack={() => setChatFriend(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Friend Row (search results) ── */
function FriendRow({ name, username, avatarId, trailing, onClick }: {
  name: string; username: string | null; avatarId: string | null;
  trailing: React.ReactNode; onClick?: () => void;
}) {
  const avatar = avatarId ? getAvatarById(avatarId) : null;
  return (
    <div
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg cursor-pointer transition-all hover:bg-white/5"
      onClick={onClick}
    >
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 overflow-hidden"
        style={{ background: "hsl(var(--filigree) / 0.1)" }}
      >
        {avatar ? <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" /> : name[0]?.toUpperCase() || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground truncate">{name}</p>
        {username && <p className="text-[10px] text-muted-foreground">@{username}</p>}
      </div>
      {trailing}
    </div>
  );
}

/* ── Friend Card (full detail) ── */
function FriendCard({ friend, onAccept, onReject, onView, onMessage, formatLastSeen }: {
  friend: Friend; onAccept: () => void; onReject: () => void;
  onView: () => void; onMessage: () => void; formatLastSeen: (d: string | null) => string;
}) {
  const avatar = friend.avatarId ? getAvatarById(friend.avatarId) : null;
  const isPending = friend.status === "pending";

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all hover:bg-white/5 group"
      style={{
        border: friend.isOnline ? "1px solid hsl(142 70% 45% / 0.2)" : "1px solid transparent",
      }}
    >
      {/* Avatar with status dot */}
      <div className="relative shrink-0">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm overflow-hidden"
          style={{ background: "hsl(var(--filigree) / 0.1)" }}
        >
          {avatar ? <img src={avatar.src} alt={avatar.label} className="w-full h-full object-cover" /> : friend.displayName[0]?.toUpperCase() || "?"}
        </div>
        {friend.status === "accepted" && (
          <div
            className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
            style={{
              borderColor: "hsl(var(--surface-stone))",
              background: friend.isOnline ? "hsl(142 70% 50%)" : "hsl(var(--muted-foreground) / 0.3)",
            }}
          />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onView}>
        <div className="flex items-center gap-1.5">
          <p className="text-xs font-medium text-foreground truncate">{friend.displayName}</p>
          {friend.totalXp > 0 && (
            <span className="text-[9px] px-1 py-0.5 rounded font-medium"
              style={{ background: "hsl(var(--filigree) / 0.1)", color: "hsl(var(--filigree-glow))", fontFamily: "'Cinzel', serif" }}>
              {friend.totalXp.toLocaleString()} XP
            </span>
          )}
        </div>
        <p className="text-[10px] text-muted-foreground truncate">
          {isPending
            ? (friend.isRequester ? "Request sent" : "Wants to ally with you")
            : friend.isOnline
              ? (friend.currentActivity || "Online")
              : `Last seen ${formatLastSeen(friend.lastSeenAt)}`
          }
        </p>
      </div>

      {/* Actions */}
      {isPending && !friend.isRequester ? (
        <div className="flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); onAccept(); }}
            className="p-1.5 rounded-md transition-all hover:bg-white/10"
            style={{ color: "hsl(142 70% 55%)" }}
            title="Accept"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onReject(); }}
            className="p-1.5 rounded-md transition-all hover:bg-white/10"
            style={{ color: "hsl(var(--muted-foreground))" }}
            title="Decline"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : isPending && friend.isRequester ? (
        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
          <Clock className="h-3 w-3" /> Pending
        </span>
      ) : (
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onMessage}
            className="p-1.5 rounded-md transition-all hover:bg-white/10"
            style={{ color: "hsl(var(--filigree-glow))" }}
            title="Message"
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onView}
            className="p-1.5 rounded-md transition-all hover:bg-white/10"
            style={{ color: "hsl(var(--filigree-glow))" }}
            title="View map"
          >
            <Eye className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </motion.div>
  );
}

/* ── Empty state ── */
function EmptyState({ subTab, onSearch }: { subTab: SubTab; onSearch: () => void }) {
  const messages: Record<SubTab, { icon: typeof Users; title: string; desc: string }> = {
    online: { icon: Sparkles, title: "No allies online", desc: "Your allies are resting. Check back soon!" },
    all: { icon: Users, title: "No allies yet", desc: "Find adventurers and forge alliances." },
    pending: { icon: Shield, title: "No pending requests", desc: "All caught up!" },
    search: { icon: Search, title: "Search for allies", desc: "Find adventurers by name or username." },
  };
  const msg = messages[subTab];

  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ background: "hsl(var(--filigree) / 0.08)" }}
      >
        <msg.icon className="h-5 w-5" style={{ color: "hsl(var(--filigree-glow) / 0.5)" }} />
      </div>
      <div className="text-center">
        <p className="text-xs font-semibold text-foreground" style={{ fontFamily: "'Cinzel', serif" }}>
          {msg.title}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{msg.desc}</p>
      </div>
      {(subTab === "online" || subTab === "all") && (
        <Button
          size="sm"
          variant="ghost"
          className="text-[10px] h-7 mt-1"
          style={{ fontFamily: "'Cinzel', serif", color: "hsl(var(--filigree-glow))" }}
          onClick={onSearch}
        >
          <UserPlus className="h-3 w-3 mr-1" />
          Find Allies
        </Button>
      )}
    </div>
  );
}

export default AlliesPanel;
