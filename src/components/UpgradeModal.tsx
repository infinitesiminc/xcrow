import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Users, Copy, Check, Gift, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "analysis" | "simulation";
  used?: number;
  limit?: number;
}

export default function UpgradeModal({ open, onOpenChange, type, used, limit }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  const label = type === "analysis" ? "role analyses" : "quests";
  const usageText = used !== undefined && limit !== undefined
    ? `You've used ${used} of ${limit} free ${label} this moon.`
    : `You've reached your free ${label} limit for this moon.`;

  const loadReferralCode = async () => {
    if (referralCode || !user) return;
    setLoadingCode(true);
    const { data } = await supabase
      .from("profiles")
      .select("referral_code")
      .eq("id", user.id)
      .single();
    if (data?.referral_code) setReferralCode(data.referral_code);
    setLoadingCode(false);
  };

  if (open && !referralCode && !loadingCode && user) {
    loadReferralCode();
  }

  const inviteLink = referralCode
    ? `${window.location.origin}/auth?ref=${referralCode}`
    : "";

  const copyLink = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    toast({ title: "Invite link copied!", description: "Share it with friends — you both earn a free month." });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpgrade = async () => {
    if (!user) return;
    setLoadingCheckout(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout");
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err) {
      console.error("Checkout error:", err);
    } finally {
      setLoadingCheckout(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ background: "hsl(var(--territory-strategic) / 0.12)" }}>
            <Crown className="h-6 w-6" style={{ color: "hsl(var(--territory-strategic))" }} />
          </div>
          <DialogTitle className="text-center text-lg" style={{ fontFamily: "'Cinzel', serif" }}>
            Ascend to Champion
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {usageText}
          </DialogDescription>
        </DialogHeader>

        {/* Champion benefits */}
        <div className="rounded-lg border p-4 space-y-2" style={{ borderColor: "hsl(var(--territory-strategic) / 0.2)", background: "hsl(var(--territory-strategic) / 0.04)" }}>
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Sparkles className="h-4 w-4" style={{ color: "hsl(var(--territory-strategic))" }} />
            Champion Pass — $12/month
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            {["Unlimited quests & boss battles", "Full territory with 3-ring growth", "AI Career Scout", "Exportable skill profile"].map(f => (
              <li key={f} className="flex items-center gap-2">
                <Check className="h-3 w-3 shrink-0" style={{ color: "hsl(var(--territory-strategic))" }} />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Upgrade CTA */}
        <Button
          size="lg"
          className="w-full gap-1.5"
          disabled={loadingCheckout}
          onClick={handleUpgrade}
          style={{ boxShadow: "0 0 20px hsl(var(--territory-strategic) / 0.25)" }}
        >
          <Crown className="h-4 w-4" /> {loadingCheckout ? "Loading..." : "Upgrade Now"}
        </Button>

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or share & earn</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Invite section */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Gift className="h-4 w-4 text-primary" />
            Recruit friends — earn free months
          </div>
          <p className="text-xs text-muted-foreground">
            Every friend who subscribes to Champion gives you both a free month. No limit!
          </p>
          {referralCode && (
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={copyLink}
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy invite link"}
            </Button>
          )}
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="w-full text-muted-foreground"
          onClick={() => onOpenChange(false)}
        >
          Maybe later
        </Button>
      </DialogContent>
    </Dialog>
  );
}
