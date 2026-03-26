import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, Share2, MessageCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/** Reusable referral share widget — copy link + social share buttons */
export function useReferralLink() {
  const { user } = useAuth();
  const [referralCode, setReferralCode] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.referral_code) setReferralCode(data.referral_code);
      });
  }, [user]);

  // Use the edge function URL so link previews get proper OG meta tags
  const edgeFnBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/invite-og`;
  const inviteLink = referralCode
    ? `${edgeFnBase}?ref=${referralCode}`
    : "";

  return { referralCode, inviteLink };
}

interface InviteShareWidgetProps {
  /** Compact mode for inline buttons (map HUD) */
  compact?: boolean;
  /** Context message for share text */
  context?: string;
}

const XIcon = () => (
  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export default function InviteShareWidget({ compact = false, context }: InviteShareWidgetProps) {
  const { inviteLink } = useReferralLink();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!inviteLink) return null;

  // Append context to the edge function URL for richer OG previews
  const linkWithCtx = context
    ? `${inviteLink}&ctx=${encodeURIComponent(context)}`
    : inviteLink;

  const shareText = context
    ? `I just ${context} on Xcrow.ai — the AI career game. Join me! 🏰`
    : "Join me on Xcrow.ai — the AI career game that levels up your future skills! 🏰";

  const encodedText = encodeURIComponent(shareText);
  const encodedLink = encodeURIComponent(linkWithCtx);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Invite link copied!", description: "Share it — you both earn a free month." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Xcrow.ai", text: shareText, url: inviteLink });
      } catch {}
    } else {
      handleCopy();
    }
  };

  const whatsappUrl = `https://wa.me/?text=${encodedText}%20${encodedLink}`;
  const xUrl = `https://x.com/intent/tweet?text=${encodedText}&url=${encodedLink}`;

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={handleCopy}
          className="h-7 w-7 rounded-md flex items-center justify-center transition-all hover:bg-muted/30"
          style={{ color: copied ? "hsl(142 71% 45%)" : "hsl(var(--muted-foreground))" }}
          title="Copy invite link"
        >
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-7 w-7 rounded-md flex items-center justify-center transition-all hover:bg-muted/30 text-muted-foreground hover:text-green-500"
          title="Share via WhatsApp"
        >
          <MessageCircle className="h-3.5 w-3.5" />
        </a>
        <a
          href={xUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="h-7 w-7 rounded-md flex items-center justify-center transition-all hover:bg-muted/30 text-muted-foreground hover:text-foreground"
          title="Share on X"
        >
          <XIcon />
        </a>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 rounded-xl">
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy Link"}
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" asChild>
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </Button>
      <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" asChild>
        <a href={xUrl} target="_blank" rel="noopener noreferrer">
          <XIcon /> Post
        </a>
      </Button>
      {typeof navigator.share === "function" && (
        <Button size="sm" variant="outline" onClick={handleNativeShare} className="gap-1.5 rounded-xl">
          <Share2 className="h-3.5 w-3.5" /> Share
        </Button>
      )}
    </div>
  );
}
