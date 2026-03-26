/**
 * CreditGate — Wraps an action button and checks if the user has enough credits.
 * If insufficient, shows a prompt to get more credits instead.
 */

import { useState, type ReactNode } from "react";
import { Coins, Zap } from "lucide-react";
import { useCredits } from "@/hooks/use-credits";
import { getCreditCost, CREDIT_ACTIONS } from "@/lib/credit-config";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface CreditGateProps {
  action: string;
  onProceed: () => void;
  children: ReactNode;
  className?: string;
}

export default function CreditGate({ action, onProceed, children, className }: CreditGateProps) {
  const { balance, deduct } = useCredits();
  const { isPro } = useAuth();
  const navigate = useNavigate();
  const [deducting, setDeducting] = useState(false);

  const cost = getCreditCost(action);
  const config = CREDIT_ACTIONS[action];

  // Free actions pass through
  if (cost === 0) {
    return <div className={className} onClick={onProceed}>{children}</div>;
  }

  // Pro users with unlimited credits pass through
  if (isPro) {
    return <div className={className} onClick={onProceed}>{children}</div>;
  }

  const canAfford = balance >= cost;

  const handleClick = async () => {
    if (!canAfford) return;
    setDeducting(true);
    const success = await deduct(cost, action, { label: config?.label });
    setDeducting(false);
    if (success) {
      onProceed();
    }
  };

  if (!canAfford) {
    return (
      <div className={`flex flex-col items-center gap-2 ${className || ""}`}>
        <div className="text-xs text-muted-foreground flex items-center gap-1">
          <Coins size={12} className="text-amber-500" />
          Requires {cost} credit{cost !== 1 ? "s" : ""} — you have {balance}
        </div>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => navigate("/pricing")}>
          <Zap size={12} />
          Get More Credits
        </Button>
      </div>
    );
  }

  return (
    <div className={className} onClick={handleClick} style={{ cursor: deducting ? "wait" : "pointer" }}>
      {children}
    </div>
  );
}
