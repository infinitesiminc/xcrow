import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  MapPin, Target, Upload, Users, Crosshair, Building2,
  FileText, Check, Rocket, Loader2, Package,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipTrigger,
} from "@/components/ui/tooltip";
import type { GTMTreeData } from "./gtm-types";

export interface StrategyCard {
  id: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  needsInput: boolean;
  inputPlaceholder?: string;
  inputType?: "text" | "select" | "file";
  options?: string[];
}

export function buildCards(data: GTMTreeData): StrategyCard[] {
  const verticals = [...new Set(data.mappings.map(m => m.vertical))];
  const competitors = [...new Set(data.products.flatMap(p => p.competitors))];

  return [
    { id: "location", icon: <MapPin className="w-3.5 h-3.5" />, label: "Location", description: "Target a city or region", needsInput: true, inputPlaceholder: "e.g. New York", inputType: "text" },
    { id: "vertical", icon: <Target className="w-3.5 h-3.5" />, label: "Vertical", description: "Focus on an industry", needsInput: true, inputType: "select", options: verticals },
    { id: "competitor", icon: <Crosshair className="w-3.5 h-3.5" />, label: "Competitor", description: "Target their customers", needsInput: true, inputType: "select", options: competitors.length > 0 ? competitors : undefined, inputPlaceholder: "Competitor name" },
    { id: "lookalike", icon: <Building2 className="w-3.5 h-3.5" />, label: "Lookalike", description: "Find similar companies", needsInput: true, inputPlaceholder: "Company to clone", inputType: "text" },
    { id: "upload", icon: <FileText className="w-3.5 h-3.5" />, label: "Brochure", description: "Upload product doc", needsInput: true, inputType: "file" },
    { id: "persona", icon: <Users className="w-3.5 h-3.5" />, label: "Persona", description: "Describe ideal buyer", needsInput: true, inputPlaceholder: "e.g. VP Operations", inputType: "text" },
  ];
}

interface StrategyStripProps {
  treeData: GTMTreeData;
  activeCards: Record<string, string | boolean>;
  cardInputs: Record<string, string>;
  onToggleCard: (id: string) => void;
  onUpdateCardValue: (id: string, value: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGenerate: () => void;
  isGenerating?: boolean;
  selectedProductId: string | null;
  products: GTMTreeData["products"];
  onSelectProduct: (id: string) => void;
  productLeadCounts: Record<string, number>;
}

export default function StrategyStrip({
  treeData, activeCards, cardInputs,
  onToggleCard, onUpdateCardValue, onFileUpload,
  onGenerate, isGenerating,
  selectedProductId, products, onSelectProduct, productLeadCounts,
}: StrategyStripProps) {
  const cards = buildCards(treeData);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCount = Object.keys(activeCards).length;
  const hasLeads = Object.values(productLeadCounts).some(c => c > 0);

  function handleToggle(id: string) {
    const card = cards.find(c => c.id === id);
    if (card?.inputType === "file") {
      fileInputRef.current?.click();
      return;
    }
    onToggleCard(id);
  }

  return (
    <div className="border-b border-border bg-card/50 px-3 py-2">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.pdf,.doc,.docx" onChange={onFileUpload} />
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-thin pb-1">
        {/* Product chips */}
        {products.map(p => (
          <Tooltip key={p.id}>
            <TooltipTrigger asChild>
              <button
                onClick={() => onSelectProduct(p.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
                  selectedProductId === p.id
                    ? "border-primary bg-primary/10 text-primary shadow-sm"
                    : "border-border bg-background text-muted-foreground hover:border-primary/40"
                }`}
              >
                <Package className="w-3 h-3" />
                {p.name}
                {(productLeadCounts[p.id] || 0) > 0 && (
                  <span className="text-[9px] bg-primary/20 text-primary px-1 rounded-full">
                    {productLeadCounts[p.id]}
                  </span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[200px]">
              <p className="text-xs">{p.description}</p>
            </TooltipContent>
          </Tooltip>
        ))}

        {/* Separator */}
        {products.length > 0 && (
          <div className="w-px h-6 bg-border shrink-0 mx-1" />
        )}

        {/* Strategy cards */}
        {cards.map(card => {
          const isActive = activeCards[card.id] !== undefined;
          return (
            <Tooltip key={card.id}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => handleToggle(card.id)}
                  className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium whitespace-nowrap transition-all shrink-0 ${
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {isActive && (
                    <div className="w-3 h-3 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-2 h-2 text-primary-foreground" />
                    </div>
                  )}
                  {!isActive && card.icon}
                  {card.label}
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">{card.description}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}

        {/* Active card inline inputs */}
        {cards.filter(c => activeCards[c.id] !== undefined && c.needsInput && c.inputType !== "file").map(card => (
          <div key={`input-${card.id}`} className="flex items-center gap-1 shrink-0">
            {card.inputType === "select" && card.options ? (
              <select
                className="h-7 text-[11px] rounded-md border border-border bg-background px-2 text-foreground min-w-[100px]"
                value={typeof activeCards[card.id] === "string" ? (activeCards[card.id] as string) : ""}
                onChange={e => onUpdateCardValue(card.id, e.target.value)}
              >
                <option value="">Select {card.label}...</option>
                {card.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            ) : (
              <Input
                className="h-7 text-[11px] w-[120px]"
                placeholder={card.inputPlaceholder}
                value={cardInputs[card.id] || ""}
                onChange={e => onUpdateCardValue(card.id, e.target.value)}
              />
            )}
          </div>
        ))}

        {/* Generate button */}
        <div className="ml-auto shrink-0 pl-2">
          <Button size="sm" className="h-7 text-xs gap-1.5" onClick={onGenerate} disabled={isGenerating || activeCount === 0}>
            {isGenerating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Rocket className="w-3 h-3" />}
            {hasLeads ? "+5 leads" : "Generate 5"}
          </Button>
        </div>
      </div>
    </div>
  );
}
