import { useMemo } from "react";
import { Package, Target, UserCheck, Building2, Landmark, Heart, Cpu, ShoppingCart, GraduationCap, Home, Shield, Briefcase, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { GTMTreeData, GTMProduct, GTMBuyerMapping } from "@/components/academy/gtm-types";

/* ── Vertical icon picker ── */
const VERTICAL_ICONS: Record<string, React.ElementType> = {
  financial: Landmark, banking: Landmark, mortgage: Landmark, insurance: Shield,
  real: Home, estate: Home, title: Home,
  legal: Briefcase, law: Briefcase, corporate: Briefcase,
  health: Heart, medical: Heart, pharma: Heart,
  tech: Cpu, saas: Cpu, software: Cpu, ai: Cpu, developer: Cpu,
  commerce: ShoppingCart, retail: ShoppingCart, ecommerce: ShoppingCart,
  education: GraduationCap, school: GraduationCap,
  security: Shield,
  small: Building2, business: Building2, professional: Building2,
};

function getVerticalIcon(vertical: string): React.ElementType {
  const lower = vertical.toLowerCase();
  for (const [key, Icon] of Object.entries(VERTICAL_ICONS)) {
    if (lower.includes(key)) return Icon;
  }
  return Target;
}

export interface TargetItem {
  type: "product" | "vertical";
  id: string;
  label: string;
  description: string;
  meta?: string; // DM title for verticals, pricing for products
  icon: React.ElementType;
  raw: GTMProduct | GTMBuyerMapping;
}

interface TargetingCardsProps {
  treeData: GTMTreeData;
  droppedIds: Set<string>;
  vertical?: boolean;
}

export default function TargetingCards({ treeData, droppedIds, vertical }: TargetingCardsProps) {
  const productItems: TargetItem[] = useMemo(() =>
    treeData.products.map(p => ({
      type: "product" as const,
      id: `product-${p.id}`,
      label: p.name,
      description: p.description,
      meta: p.pricing_model,
      icon: Package,
      raw: p,
    })),
    [treeData.products]
  );

  const verticalItems: TargetItem[] = useMemo(() =>
    treeData.mappings.map((m, i) => ({
      type: "vertical" as const,
      id: `vertical-${i}-${m.vertical}`,
      label: m.vertical,
      description: m.segment,
      meta: m.dm.title,
      icon: getVerticalIcon(m.vertical),
      raw: m,
    })),
    [treeData.mappings]
  );

  function handleDragStart(e: React.DragEvent, item: TargetItem) {
    e.dataTransfer.setData("application/json", JSON.stringify({
      id: item.id,
      type: item.type,
      label: item.label,
      description: item.description,
      meta: item.meta,
    }));
    e.dataTransfer.effectAllowed = "copy";
  }

  return (
    <div className="flex flex-1 min-h-0 overflow-hidden">
      {/* Products column */}
      <div className="flex-1 border-r border-border/30 overflow-y-auto px-2 py-2">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <Package className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Products</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">{productItems.length}</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          {productItems.map(item => {
            const isDropped = droppedIds.has(item.id);
            return (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item)}
                className={`px-2.5 py-2 rounded-md border text-xs font-medium cursor-grab active:cursor-grabbing transition-all select-none ${
                  isDropped
                    ? "border-primary/40 bg-primary/5 opacity-50"
                    : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
                }`}
              >
                <span className="text-foreground">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personas column */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        <div className="flex items-center gap-1.5 mb-2 px-1">
          <UserCheck className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs font-semibold text-foreground uppercase tracking-wide">Personas</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5 ml-auto">{verticalItems.length}</Badge>
        </div>
        <div className="flex flex-col gap-1.5">
          {verticalItems.map(item => {
            const Icon = item.icon;
            const isDropped = droppedIds.has(item.id);
            return (
              <div
                key={item.id}
                draggable
                onDragStart={e => handleDragStart(e, item)}
                className={`px-2.5 py-2 rounded-md border text-xs cursor-grab active:cursor-grabbing transition-all select-none ${
                  isDropped
                    ? "border-primary/40 bg-primary/5 opacity-50"
                    : "border-border bg-card hover:border-primary/30 hover:bg-accent/30"
                }`}
              >
                <span className="font-medium text-foreground">{item.label}</span>
                {item.meta && (
                  <span className="text-muted-foreground ml-1">· {item.meta}</span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
