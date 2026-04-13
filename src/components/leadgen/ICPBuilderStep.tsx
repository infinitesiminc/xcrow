import { useState, useMemo } from "react";
import {
  Crown, ShieldCheck, Briefcase, UserCheck, Sparkles,
  Building2, ChevronRight, Check, Plus, X, Rocket,
  Lightbulb, Target, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { classifySeniority, type SeniorityResult } from "@/lib/seniority-classifier";
import type { ParsedPersona, ParsedReport } from "./ResearchSection";

/* ── Authority visual config ── */
const AUTHORITY_CONFIG: Record<number, { color: string; icon: typeof Crown; label: string; bgClass: string }> = {
  1: { color: "text-purple-400", icon: Crown, label: "C-Suite · Budget Owner", bgClass: "bg-purple-500/10 border-purple-500/20" },
  2: { color: "text-blue-400", icon: ShieldCheck, label: "SVP/EVP · Strategic Authority", bgClass: "bg-blue-500/10 border-blue-500/20" },
  3: { color: "text-sky-400", icon: Briefcase, label: "VP · Evaluator & Budget Holder", bgClass: "bg-sky-500/10 border-sky-500/20" },
  4: { color: "text-emerald-400", icon: UserCheck, label: "Director · Recommender", bgClass: "bg-emerald-500/10 border-emerald-500/20" },
  5: { color: "text-muted-foreground", icon: Users, label: "Other", bgClass: "bg-muted/30 border-border" },
};

export interface ConfirmedPersona extends ParsedPersona {
  confirmed: boolean;
  seniority: SeniorityResult;
}

interface ICPBuilderStepProps {
  report: ParsedReport;
  workspaceKey: string;
  onConfirm: (personas: ConfirmedPersona[]) => void;
  onFindLeads: (persona: ParsedPersona) => void;
}

type UserPath = null | "new_business" | "experienced";

export default function ICPBuilderStep({ report, workspaceKey, onConfirm, onFindLeads }: ICPBuilderStepProps) {
  const [path, setPath] = useState<UserPath>(null);
  const [personas, setPersonas] = useState<ConfirmedPersona[]>(() =>
    report.personas.map((p) => {
      const seniority = classifySeniority(p.titles[0] || p.title);
      return { ...p, confirmed: false, seniority };
    })
  );
  const [customTitle, setCustomTitle] = useState("");
  const [customPainPoint, setCustomPainPoint] = useState("");
  const [addingCustom, setAddingCustom] = useState(false);

  const allConfirmed = personas.length > 0 && personas.every((p) => p.confirmed);
  const confirmedCount = personas.filter((p) => p.confirmed).length;

  const toggleConfirm = (idx: number) => {
    setPersonas((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, confirmed: !p.confirmed } : p))
    );
  };

  const removePersona = (idx: number) => {
    setPersonas((prev) => prev.filter((_, i) => i !== idx));
  };

  const addCustomPersona = () => {
    if (!customTitle.trim()) return;
    const seniority = classifySeniority(customTitle);
    setPersonas((prev) => [
      ...prev,
      {
        title: customTitle.trim(),
        painPoints: customPainPoint.trim() ? [customPainPoint.trim()] : [],
        buyingTriggers: [],
        titles: [customTitle.trim()],
        confirmed: true,
        seniority,
      },
    ]);
    setCustomTitle("");
    setCustomPainPoint("");
    setAddingCustom(false);
  };

  /* ── Path selection screen ── */
  if (path === null) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-4">
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Who buys your product?</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Before we search for leads, let's make sure we're targeting the right decision-makers — people who can actually sign a contract.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => setPath("new_business")}
            className="group rounded-xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-5 h-5 text-amber-400" />
              <span className="text-sm font-semibold text-foreground">I'm just starting out</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              No customers yet — help me discover who the decision-makers are based on my product research.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              <Sparkles className="w-3 h-3" /> AI will guide you <ChevronRight className="w-3 h-3" />
            </div>
          </button>

          <button
            onClick={() => setPath("experienced")}
            className="group rounded-xl border border-border bg-card p-5 text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
          >
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-foreground">I know my buyers</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              I've sold before — let me confirm or add the roles that actually buy.
            </p>
            <div className="mt-3 flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Quick confirm <ChevronRight className="w-3 h-3" />
            </div>
          </button>
        </div>
      </div>
    );
  }

  /* ── Main ICP builder ── */
  return (
    <div className="max-w-2xl mx-auto space-y-5 py-4">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">
            {path === "new_business"
              ? "AI-Discovered Decision Makers"
              : "Confirm Your Buyer Roles"}
          </h2>
          <Badge variant="secondary" className="text-[10px]">{workspaceKey}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {path === "new_business"
            ? "Based on your product research, these are the roles most likely to buy. Review each one — we'll only search for confirmed roles."
            : "Confirm the roles you've sold to before, remove irrelevant ones, and add any we missed."}
        </p>
      </div>

      {/* Authority legend */}
      <div className="flex flex-wrap gap-2">
        {[1, 3, 4].map((rank) => {
          const cfg = AUTHORITY_CONFIG[rank];
          const Icon = cfg.icon;
          return (
            <div key={rank} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <Icon className={`w-3 h-3 ${cfg.color}`} />
              <span>{cfg.label}</span>
            </div>
          );
        })}
      </div>

      {/* Persona cards */}
      <div className="space-y-3">
        {personas.map((persona, idx) => {
          const rank = persona.seniority.rank;
          const cfg = AUTHORITY_CONFIG[rank] || AUTHORITY_CONFIG[5];
          const Icon = cfg.icon;

          return (
            <Card
              key={`${persona.title}-${idx}`}
              className={`border transition-all ${
                persona.confirmed
                  ? "border-primary/30 bg-primary/5"
                  : "border-border/40 hover:border-border"
              }`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {/* Authority icon */}
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={`rounded-lg p-2 border shrink-0 ${cfg.bgClass}`}>
                        <Icon className={`w-4 h-4 ${cfg.color}`} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-xs">
                      <p className="text-xs font-medium">{persona.seniority.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{persona.seniority.decisionRole}</p>
                    </TooltipContent>
                  </Tooltip>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{persona.title}</span>
                      <Badge variant="outline" className={`text-[10px] ${cfg.color} border-current/20`}>
                        {persona.seniority.label}
                      </Badge>
                    </div>

                    {/* Decision role explanation */}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {persona.seniority.decisionRole}
                    </p>

                    {/* Search titles preview */}
                    {persona.titles.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {persona.titles.slice(0, 4).map((t) => (
                          <span key={t} className="inline-flex items-center rounded bg-muted/50 px-1.5 py-0.5 text-[10px] text-muted-foreground font-mono">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pain points for new business path */}
                    {path === "new_business" && persona.painPoints.length > 0 && (
                      <div className="text-[10px] text-muted-foreground">
                        <span className="uppercase tracking-wider">Why they buy:</span>{" "}
                        {persona.painPoints.slice(0, 2).join(" · ")}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant={persona.confirmed ? "default" : "outline"}
                          className="h-8 w-8"
                          onClick={() => toggleConfirm(idx)}
                        >
                          <Check className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        {persona.confirmed ? "Confirmed — click to unconfirm" : "Confirm this role"}
                      </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removePersona(idx)}
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove this role</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add custom persona */}
      {addingCustom ? (
        <Card className="border-dashed border-border">
          <CardContent className="p-4 space-y-3">
            <p className="text-xs font-medium text-foreground">Add a buyer role you know about</p>
            <div className="flex gap-2">
              <Input
                placeholder="Job title (e.g. VP of Operations)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="text-sm h-9"
                onKeyDown={(e) => e.key === "Enter" && addCustomPersona()}
              />
              <Button size="sm" className="h-9 shrink-0" onClick={addCustomPersona} disabled={!customTitle.trim()}>
                Add
              </Button>
              <Button size="sm" variant="ghost" className="h-9 shrink-0" onClick={() => setAddingCustom(false)}>
                Cancel
              </Button>
            </div>
            <Input
              placeholder="What pain point makes them buy? (optional)"
              value={customPainPoint}
              onChange={(e) => setCustomPainPoint(e.target.value)}
              className="text-sm h-9"
            />
            {customTitle.trim() && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                {(() => {
                  const preview = classifySeniority(customTitle);
                  const cfg = AUTHORITY_CONFIG[preview.rank] || AUTHORITY_CONFIG[5];
                  const Icon = cfg.icon;
                  return (
                    <>
                      <Icon className={`w-3 h-3 ${cfg.color}`} />
                      <span>{preview.label} — {preview.decisionRole}</span>
                    </>
                  );
                })()}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <button
          onClick={() => setAddingCustom(true)}
          className="w-full rounded-lg border border-dashed border-border/60 py-3 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-colors"
        >
          <Plus className="w-3.5 h-3.5" /> Add a role I know about
        </button>
      )}

      {/* Confirm & proceed */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => setPath(null)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ← Back
        </button>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">
            {confirmedCount}/{personas.length} confirmed
          </span>
          <Button
            onClick={() => onConfirm(personas.filter((p) => p.confirmed))}
            disabled={confirmedCount === 0}
            className="gap-2"
          >
            <Target className="w-4 h-4" />
            Find {confirmedCount} Decision Maker{confirmedCount !== 1 ? "s" : ""}
          </Button>
        </div>
      </div>
    </div>
  );
}
