import { useNavigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Zap, MessageSquare } from "lucide-react";

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "analysis" | "simulation";
}

export default function UpgradeModal({ open, onOpenChange, type }: UpgradeModalProps) {
  const navigate = useNavigate();
  const label = type === "analysis" ? "role analysis" : "simulation";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-brand-mid/10">
            <Zap className="h-6 w-6 text-brand-mid" />
          </div>
          <DialogTitle className="text-center text-lg">
            You've used your free {label}
          </DialogTitle>
          <DialogDescription className="text-center text-sm text-muted-foreground">
            The free tier includes 1 analysis and 1 simulation per month.
            Contact us to unlock unlimited access for your team.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-2.5 pt-4">
          <Button
            size="lg"
            className="w-full gap-1.5"
            onClick={() => {
              onOpenChange(false);
              navigate("/contact");
            }}
          >
            <MessageSquare className="h-4 w-4" /> Contact Us to Upgrade
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
