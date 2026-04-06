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
    <div className={`space-y-3 px-3 py-3 ${vertical ? '' : 'px-4'}`}>
      {/* Products row */}
      {productItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-foreground">Products</span>
            <Badge variant="secondary" className="text-xs h-5 px-2">{productItems.length}</Badge>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {productItems.map(item => {
              const isDropped = droppedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  className={`p-3 rounded-lg border min-w-[200px] max-w-[240px] shrink-0 cursor-grab active:cursor-grabbing transition-all select-none ${
                    isDropped
                      ? "border-primary/40 bg-primary/5 opacity-60"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Package className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Verticals & Buyer Roles row */}
      {verticalItems.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-foreground">Verticals & Buyer Roles</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {verticalItems.map(item => {
              const Icon = item.icon;
              const isDropped = droppedIds.has(item.id);
              return (
                <div
                  key={item.id}
                  draggable
                  onDragStart={e => handleDragStart(e, item)}
                  className={`p-3 rounded-lg border min-w-[200px] max-w-[240px] shrink-0 cursor-grab active:cursor-grabbing transition-all select-none ${
                    isDropped
                      ? "border-primary/40 bg-primary/5 opacity-60"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-sm"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <Icon className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{item.description}</p>
                  {item.meta && (
                    <Badge variant="secondary" className="text-xs h-5 px-2 gap-1 bg-blue-500/15 text-blue-700 border-0">
                      <UserCheck className="w-3 h-3" /> DM: {item.meta}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
