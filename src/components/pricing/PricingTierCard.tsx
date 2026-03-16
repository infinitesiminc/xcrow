import { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface PricingTierCardProps {
  icon: ReactNode;
  name: string;
  description: string;
  price: string;
  priceNote: string;
  accentClass: string;
  features: string[];
  cta: ReactNode;
  highlighted?: boolean;
  badge?: string;
}

export default function PricingTierCard({
  icon, name, description, price, priceNote,
  accentClass, features, cta, highlighted, badge,
}: PricingTierCardProps) {
  return (
    <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
      <Card className={`${accentClass} h-full flex flex-col relative overflow-hidden ${highlighted ? "ring-2 ring-brand-mid/30 shadow-lg" : ""}`}>
        {badge && (
          <div className="absolute top-0 right-0 bg-brand-mid text-primary-foreground text-[10px] font-semibold uppercase tracking-wider px-3 py-1 rounded-bl-lg">
            {badge}
          </div>
        )}
        <CardContent className="flex-1 flex flex-col p-5 sm:p-6">
          {/* Header */}
          <div className="flex items-center gap-2 mb-1">
            {icon}
            <h3 className="text-lg font-sans font-bold text-foreground">{name}</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-5">{description}</p>

          {/* Price */}
          <div className="mb-5">
            <span className="text-3xl sm:text-4xl font-bold font-sans text-foreground tracking-tight">{price}</span>
            <span className="text-sm text-muted-foreground ml-1">{priceNote}</span>
          </div>

          {/* Features */}
          <ul className="space-y-2.5 mb-6 flex-1">
            {features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
                <Check className="h-4 w-4 text-brand-human shrink-0 mt-0.5" />
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <div className="mt-auto">{cta}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
