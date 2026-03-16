import { Users } from "lucide-react";

const tiers = [
  { roles: "1–10", price: "$29" },
  { roles: "11–50", price: "$19" },
  { roles: "51–200", price: "$12" },
  { roles: "200+", price: "Custom" },
];

export default function GrowthPricingTable() {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <div className="grid grid-cols-2 text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-widest bg-muted/50 px-5 py-3">
        <span>Roles mapped</span>
        <span className="text-right">Price / role / mo</span>
      </div>
      {tiers.map((t) => (
        <div key={t.roles} className="grid grid-cols-2 px-5 py-3.5 border-t border-border items-center">
          <span className="text-sm text-foreground flex items-center gap-2">
            <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> {t.roles} roles
          </span>
          <span className="text-xl sm:text-2xl font-bold text-foreground text-right font-sans">{t.price}</span>
        </div>
      ))}
    </div>
  );
}
