/**
 * SubscriptionBadge — Compact plan indicator for the navbar.
 * Shows Champion badge for pro users, or "Free" with upgrade CTA.
 */
import { useNavigate } from "react-router-dom";
import { Crown, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function SubscriptionBadge() {
  const { user, isPro, plan } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  if (isPro) {
    return (
      <button
        onClick={() => navigate("/settings?section=subscription")}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border"
        style={{
          background: "hsl(var(--territory-strategic) / 0.12)",
          borderColor: "hsl(var(--territory-strategic) / 0.3)",
          color: "hsl(var(--territory-strategic))",
        }}
      >
        <Crown size={13} />
        <span>Champion</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate("/pricing")}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border hover:opacity-80"
      style={{
        background: "hsl(var(--muted) / 0.3)",
        borderColor: "hsl(var(--border) / 0.4)",
        color: "hsl(var(--muted-foreground))",
      }}
    >
      <Sparkles size={13} />
      <span>Upgrade</span>
    </button>
  );
}
