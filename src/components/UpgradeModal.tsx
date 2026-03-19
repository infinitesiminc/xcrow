import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, Crown } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "analysis" | "simulation";
  used?: number;
  limit?: number;
}

export default function UpgradeModal({ open, onOpenChange, type, used, limit }: UpgradeModalProps) {
  const navigate = useNavigate();
  const label = type === "analysis" ? "role analyses" : "simulations";
  const usageText = used !== undefined && limit !== undefined
    ? `You've used ${used} of ${limit} free ${label} this month.`
    : `You've reached your free ${label} limit for this month.`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Zap className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-center text-lg">
            Upgrade to keep going
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            {usageText} Upgrade to Pro for unlimited access, or ask your school about institutional licenses.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5 pt-4">
          <Button
            size="lg"
            className="w-full gap-1.5"
            onClick={() => {
              onOpenChange(false);
              navigate("/pricing");
            }}
          >
            <Crown className="h-4 w-4" /> View Pricing Plans
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
