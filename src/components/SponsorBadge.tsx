/**
 * SponsorBadge — Shows when a user has employer-sponsored credits.
 * Displays the sponsor company name with a branded badge.
 */

import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Gift } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SponsorInfo {
  sponsorName: string;
  creditsGranted: number;
}

export default function SponsorBadge() {
  const { user } = useAuth();
  const [sponsor, setSponsor] = useState<SponsorInfo | null>(null);

  useEffect(() => {
    if (!user) return;
    let active = true;

    (async () => {
      const { data } = await supabase
        .from("sponsored_credits")
        .select("credits_granted, sponsorship_id")
        .eq("user_id", user.id)
        .order("granted_at", { ascending: false })
        .limit(1);

      if (!active || !data?.length) return;

      const row = data[0] as any;
      // Fetch sponsor name from sponsorship
      const { data: spData } = await supabase
        .from("employer_sponsorships")
        .select("sponsor_name")
        .eq("id", row.sponsorship_id)
        .single();

      if (active && spData) {
        setSponsor({
          sponsorName: (spData as any).sponsor_name,
          creditsGranted: row.credits_granted,
        });
      }
    })();

    return () => { active = false; };
  }, [user]);

  if (!sponsor) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 text-[10px] font-semibold rounded-full px-2 py-0.5 bg-primary/10 text-primary border border-primary/20">
          <Building2 size={10} />
          <span>Sponsored</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">
          <Gift size={12} className="inline mr-1" />
          {sponsor.creditsGranted} credits sponsored by <strong>{sponsor.sponsorName}</strong>
        </p>
      </TooltipContent>
    </Tooltip>
  );
}
