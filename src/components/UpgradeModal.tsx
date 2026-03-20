import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Users, Copy, Check, Gift } from "lucide-react";
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
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [loadingCode, setLoadingCode] = useState(false);

  const label = type === "analysis" ? "role analyses" : "simulations";
  const usageText = used !== undefined && limit !== undefined
    ? `You've used ${used} of ${limit} free ${label} this month.`
    : `You've reached your free ${label} limit for this month.`;

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

  // Load code when modal opens
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
    toast({ title: "Invite link copied!", description: "Share it with friends to earn +2 simulations each." });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Gift className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">
            Want more simulations?
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {usageText}
          </DialogDescription>
        </DialogHeader>

        {/* Invite section */}
        <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Users className="h-4 w-4 text-primary" />
            Invite friends — earn +2 sims each
          </div>
          <p className="text-xs text-muted-foreground">
            Every friend who joins gives you both +2 bonus simulations per month. No limit!
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

        <div className="relative flex items-center gap-3 py-1">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            size="lg"
            className="w-full gap-1.5"
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
          >
            <Crown className="h-4 w-4" /> Upgrade to Pro — Unlimited
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
