import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2, Circle, AlertCircle, ChevronDown, ChevronRight,
  Layers, CreditCard, Building2, Users, Upload, Plug, Shield,
  BarChart3, Zap, FileText, Globe, BookOpen, Target, Settings2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type ItemStatus = "done" | "partial" | "not_started";

interface ChecklistItem {
  id: string;
  label: string;
  status: ItemStatus;
  detail?: string;
}

interface ChecklistSection {
  id: string;
  title: string;
  icon: React.ElementType;
  items: ChecklistItem[];
}

const INITIAL_SECTIONS: ChecklistSection[] = [
  {
    id: "public",
    title: "Public Pages",
    icon: Globe,
    items: [
      { id: "p1", label: "Enterprise homepage (/)", status: "done", detail: "Hero, phases, marquee, CTAs" },
      { id: "p2", label: "Simulation Builder page", status: "done", detail: "Templates, scoring, calibration, timeline" },
      { id: "p3", label: "Pricing page", status: "partial", detail: "UI done — Stripe not connected" },
      { id: "p4", label: "Contact page", status: "done", detail: "Form + email edge function" },
      { id: "p5", label: "Role analysis tool (/analyze)", status: "done", detail: "JD paste/upload/URL, file parsing" },
      { id: "p6", label: "Tools marketplace", status: "done", detail: "Curated directory with filters" },
    ],
  },
  {
    id: "products",
    title: "Product Vertical Pages",
    icon: Layers,
    items: [
      { id: "pv1", label: "Upskilling product page", status: "not_started", detail: "Currently routes to SimulationBuilder" },
      { id: "pv2", label: "Candidate Assessment page", status: "not_started", detail: "Currently routes to SimulationBuilder" },
      { id: "pv3", label: "Workforce Planning page", status: "not_started", detail: "Currently routes to SimulationBuilder" },
      { id: "pv4", label: "Career Transition page", status: "not_started", detail: "Currently routes to SimulationBuilder" },
      { id: "pv5", label: "L&D Content Engine page", status: "not_started", detail: "Currently routes to SimulationBuilder" },
    ],
  },
  {
    id: "auth",
    title: "Auth & User Features",
    icon: Shield,
    items: [
      { id: "a1", label: "Email/password auth", status: "done", detail: "Signup, login, profiles, modal" },
      { id: "a2", label: "User dashboard", status: "done", detail: "History, bookmarks, upskill stats" },
      { id: "a3", label: "Settings page", status: "done", detail: "Profile editing" },
      { id: "a4", label: "Onboarding modal", status: "done", detail: "Job title + company capture" },
    ],
  },
  {
    id: "analysis",
    title: "Analysis Engine",
    icon: BarChart3,
    items: [
      { id: "an1", label: "AI job analysis (analyze-job)", status: "done", detail: "Task breakdown, risk scoring, caching" },
      { id: "an2", label: "Analysis results page", status: "done", detail: "Tasks, risk gauge, pathways, action plan" },
      { id: "an3", label: "Simulator / Upskill (sim-chat)", status: "done", detail: "Compile, chat, score, history" },
      { id: "an4", label: "Career pathways (generate-pathways)", status: "done", detail: "AI + local fallback" },
      { id: "an5", label: "JD parsing (parse-jd)", status: "done", detail: "PDF/DOCX text extraction" },
      { id: "an6", label: "Company scraping (scrape-company)", status: "done", detail: "Firecrawl + AI extraction" },
      { id: "an7", label: "News ticker (refresh-ticker)", status: "done", detail: "AI headlines stored in DB" },
    ],
  },
  {
    id: "enterprise",
    title: "Enterprise Features",
    icon: Building2,
    items: [
      { id: "e1", label: "Company dashboard", status: "partial", detail: "UI exists — uses mock scores" },
      { id: "e2", label: "Team analysis", status: "partial", detail: "Multi-role input — no dedicated report view" },
      { id: "e3", label: "Project staffing", status: "not_started", detail: "Full mock data, no real backend" },
      { id: "e4", label: "Org-wide heatmap", status: "partial", detail: "Works with prebuilt roles only" },
      { id: "e5", label: "Contact org form", status: "partial", detail: "Exists but overlaps with /contact" },
    ],
  },
  {
    id: "billing",
    title: "Billing & Monetization",
    icon: CreditCard,
    items: [
      { id: "b1", label: "Connect Stripe", status: "not_started", detail: "Edge functions exist, no active key" },
      { id: "b2", label: "Create Stripe products/prices", status: "not_started", detail: "Individual Pro + Org tiers" },
      { id: "b3", label: "Checkout flow", status: "not_started", detail: "create-checkout function ready" },
      { id: "b4", label: "Customer portal", status: "not_started", detail: "customer-portal function ready" },
      { id: "b5", label: "Usage limits enforcement", status: "not_started", detail: "Free tier caps on analyses/sims" },
    ],
  },
  {
    id: "data",
    title: "Data & Infrastructure",
    icon: Settings2,
    items: [
      { id: "d1", label: "ATS company/job sync pipeline", status: "done", detail: "217 companies, 400+ Anthropic jobs synced via sim-api" },
      { id: "d2", label: "Org data model (companies → teams → employees)", status: "partial", detail: "Companies + jobs done, teams/employees pending" },
      { id: "d3", label: "RBAC / user roles", status: "not_started", detail: "Admin, manager, employee roles" },
      { id: "d4", label: "Bulk CSV/HRIS import UI", status: "not_started", detail: "import-dataset function exists, no UI" },
      { id: "d5", label: "Employee-level progress tracking", status: "not_started", detail: "Per-employee simulation/analysis data" },
      { id: "d6", label: "API access for integrations", status: "not_started", detail: "External API endpoints" },
    ],
  },
  {
    id: "cleanup",
    title: "Cleanup & Polish",
    icon: Target,
    items: [
      { id: "c1", label: "Consolidate /contact-org into /contact", status: "not_started", detail: "Remove redundant route" },
      { id: "c2", label: "Deduplicate product vertical routes", status: "not_started", detail: "5 routes all point to SimulationBuilder" },
      { id: "c3", label: "Mobile responsiveness audit", status: "not_started", detail: "Test all pages on mobile viewports" },
      { id: "c4", label: "SEO meta tags on all pages", status: "not_started", detail: "Title, description, OG images" },
      { id: "c5", label: "Error boundaries & loading states", status: "not_started", detail: "Graceful fallbacks everywhere" },
    ],
  },
];

const STORAGE_KEY = "infinite-sim-roadmap";

const statusConfig: Record<ItemStatus, { icon: React.ElementType; color: string; label: string; badge: string }> = {
  done: { icon: CheckCircle2, color: "text-emerald-500", label: "Done", badge: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  partial: { icon: AlertCircle, color: "text-amber-500", label: "Partial", badge: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  not_started: { icon: Circle, color: "text-muted-foreground/40", label: "Not Started", badge: "bg-muted text-muted-foreground border-border" },
};

export default function Roadmap() {
  const [sections, setSections] = useState<ChecklistSection[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SECTIONS;
    } catch {
      return INITIAL_SECTIONS;
    }
  });
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(INITIAL_SECTIONS.map((s) => s.id)));

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }, [sections]);

  const toggleSection = (id: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const cycleStatus = (sectionId: string, itemId: string) => {
    const order: ItemStatus[] = ["not_started", "partial", "done"];
    setSections((prev) =>
      prev.map((s) =>
        s.id === sectionId
          ? {
              ...s,
              items: s.items.map((item) =>
                item.id === itemId
                  ? { ...item, status: order[(order.indexOf(item.status) + 1) % 3] }
                  : item
              ),
            }
          : s
      )
    );
  };

  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const doneItems = sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === "done").length, 0);
  const partialItems = sections.reduce((sum, s) => sum + s.items.filter((i) => i.status === "partial").length, 0);
  const overallPercent = Math.round(((doneItems + partialItems * 0.5) / totalItems) * 100);

  const resetToDefaults = () => {
    setSections(INITIAL_SECTIONS);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Build Checklist
          </h1>
          <p className="mt-2 text-muted-foreground">
            Track what's built, what's in progress, and what's next. Click any item to cycle its status.
          </p>

          {/* Overall progress */}
          <Card className="mt-6 border-border">
            <CardContent className="py-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Overall Progress</span>
                <span className="text-2xl font-bold text-foreground">{overallPercent}%</span>
              </div>
              <Progress value={overallPercent} className="h-2.5" />
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> {doneItems} done
                </span>
                <span className="flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 text-amber-500" /> {partialItems} partial
                </span>
                <span className="flex items-center gap-1.5">
                  <Circle className="h-3.5 w-3.5 text-muted-foreground/40" /> {totalItems - doneItems - partialItems} remaining
                </span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Sections */}
        <div className="space-y-4">
          {sections.map((section, si) => {
            const sectionDone = section.items.filter((i) => i.status === "done").length;
            const sectionTotal = section.items.length;
            const isExpanded = expandedSections.has(section.id);
            const Icon = section.icon;

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: si * 0.04 }}
              >
                <Card className="border-border overflow-hidden">
                  {/* Section header */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-foreground">{section.title}</span>
                      <Badge variant="outline" className="text-xs font-normal">
                        {sectionDone}/{sectionTotal}
                      </Badge>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>

                  {/* Items */}
                  {isExpanded && (
                    <div className="border-t border-border">
                      {section.items.map((item) => {
                        const cfg = statusConfig[item.status];
                        const StatusIcon = cfg.icon;

                        return (
                          <button
                            key={item.id}
                            onClick={() => cycleStatus(section.id, item.id)}
                            className="w-full flex items-start gap-3 px-5 py-3 hover:bg-muted/20 transition-colors text-left border-b border-border last:border-b-0"
                          >
                            <StatusIcon className={cn("h-5 w-5 mt-0.5 shrink-0", cfg.color)} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={cn(
                                  "text-sm font-medium",
                                  item.status === "done" ? "text-muted-foreground line-through" : "text-foreground"
                                )}>
                                  {item.label}
                                </span>
                                <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", cfg.badge)}>
                                  {cfg.label}
                                </Badge>
                              </div>
                              {item.detail && (
                                <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Reset */}
        <div className="mt-8 text-center">
          <button
            onClick={resetToDefaults}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Reset to defaults
          </button>
        </div>
      </div>
    </div>
  );
}
