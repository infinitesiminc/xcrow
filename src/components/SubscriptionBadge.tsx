/**
 * SubscriptionBadge — Compact plan indicator for the navbar.
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
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border bg-primary/10 border-primary/30 text-primary"
      >
        <Crown size={13} />
        <span>Pro</span>
      </button>
    );
  }

  return (
    <button
      onClick={() => window.open("https://xcrow.ai/#pricing", "_blank")}
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border hover:opacity-80 bg-muted/30 border-border/40 text-muted-foreground"
    >
      <Sparkles size={13} />
      <span>Upgrade</span>
    </button>
  );
}
