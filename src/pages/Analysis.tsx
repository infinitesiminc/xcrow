import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, TrendingUp, Minus, AlertTriangle, CheckCircle, Zap, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { JobAnalysisResult, TaskState, TrendDirection, AIImpactLevel } from "@/types/analysis";
import { findPrebuiltRole } from "@/data/prebuilt-roles";
import { analyzeJobWithAI } from "@/lib/ai-analysis";

const stateLabels: Record<TaskState, { label: string; className: string }> = {
  mostly_human: { label: "Mostly Human", className: "bg-success/10 text-success border-success/20" },
  human_ai: { label: "Human + AI", className: "bg-warning/10 text-warning border-warning/20" },
  mostly_ai: { label: "Mostly AI", className: "bg-primary/10 text-primary border-primary/20" },
};

const trendIcons: Record<TrendDirection, { icon: typeof Minus; label: string }> = {
  stable: { icon: Minus, label: "Stable" },
  increasing_ai: { icon: TrendingUp, label: "More AI" },
  fully_ai_soon: { icon: Bot, label: "Fully AI Soon" },
};

const impactColors: Record<AIImpactLevel, string> = {
  low: "text-success",
  medium: "text-warning",
  high: "text-destructive",
};

const Analysis = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const company = searchParams.get("company") || "";
  const jobTitle = searchParams.get("title") || "";
  const [result, setResult] = useState<JobAnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobTitle) {
      navigate("/");
      return;
    }

    const analyze = async () => {
      setLoading(true);
      setError(null);

      // Check prebuilt first
      const prebuilt = findPrebuiltRole(jobTitle);
      if (prebuilt) {
        await new Promise((r) => setTimeout(r, 1200)); // Simulate brief loading
        setResult({ ...prebuilt, company });
        setLoading(false);
        return;
      }

      // Use AI for niche roles
      try {
        const aiResult = await analyzeJobWithAI(jobTitle, company);
        setResult(aiResult);
      } catch (err) {
        setError("Unable to analyze this role right now. Please try again.");
        console.error(err);
      }
      setLoading(false);
    };

    analyze();
  }, [jobTitle, company, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent">
              <Zap className="h-6 w-6 text-primary animate-pulse" />
            </div>
            <h1 className="text-2xl font-display font-bold text-foreground">Analyzing {jobTitle}...</h1>
            <p className="mt-2 text-muted-foreground">Evaluating how AI impacts each task in your role</p>
          </motion.div>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <AlertTriangle className="mx-auto h-10 w-10 text-warning mb-4" />
          <h1 className="text-xl font-display font-bold text-foreground mb-2">Analysis Failed</h1>
          <p className="text-muted-foreground mb-6">{error || "Something went wrong."}</p>
          <Button onClick={() => navigate("/")} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
          <Button variant="ghost" size="sm" onClick={() => navigate("/")} className="mb-6 -ml-2 text-muted-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> New analysis
          </Button>
          <h1 className="text-3xl font-display font-bold text-foreground">{result.jobTitle}</h1>
          {result.company && <p className="mt-1 text-muted-foreground">at {result.company}</p>}
        </motion.div>

        {/* Summary Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-10"
        >
          {[
            { label: "Tasks augmented by AI", value: result.summary.augmentedPercent, color: "primary" },
            { label: "At risk of full automation", value: result.summary.automationRiskPercent, color: "destructive" },
            { label: "Requiring new skills", value: result.summary.newSkillsPercent, color: "warning" },
          ].map((stat) => (
            <Card key={stat.label} className="border-border">
              <CardContent className="p-4 text-center">
                <div className={`text-2xl font-display font-bold text-${stat.color}`}>{stat.value}%</div>
                <p className="mt-1 text-xs text-muted-foreground leading-tight">{stat.label}</p>
              </CardContent>
            </Card>
          ))}
        </motion.div>

        {/* AI Distribution Bar */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-3">
            Human vs AI Task Distribution
          </h2>
          <div className="flex rounded-lg overflow-hidden h-3">
            <div
              className="bg-success transition-all"
              style={{ width: `${100 - result.summary.augmentedPercent}%` }}
            />
            <div
              className="bg-warning transition-all"
              style={{ width: `${result.summary.augmentedPercent - result.summary.automationRiskPercent}%` }}
            />
            <div
              className="bg-primary transition-all"
              style={{ width: `${result.summary.automationRiskPercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-success" /> Human-driven
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-warning" /> AI-augmented
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-primary" /> AI-driven
            </span>
          </div>
        </motion.div>

        {/* Task Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-10"
        >
          <h2 className="text-sm font-medium uppercase tracking-widest text-muted-foreground mb-4">
            Task-Level Breakdown
          </h2>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-medium">Task</TableHead>
                  <TableHead className="font-medium">Current State</TableHead>
                  <TableHead className="font-medium">Trend</TableHead>
                  <TableHead className="font-medium text-right">Impact</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.tasks.map((task, i) => {
                  const state = stateLabels[task.currentState];
                  const trend = trendIcons[task.trend];
                  const TrendIcon = trend.icon;
                  return (
                    <TableRow key={i}>
                      <TableCell>
                        <div className="font-medium text-foreground">{task.name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 max-w-xs">{task.description}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={state.className}>{state.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <TrendIcon className="h-3.5 w-3.5" /> {trend.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-sm font-medium capitalize ${impactColors[task.impactLevel]}`}>
                          {task.impactLevel}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Card>
        </motion.div>

        {/* CTA to Skills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <Button
            size="lg"
            className="gap-2"
            onClick={() =>
              navigate(`/skills?company=${encodeURIComponent(company)}&title=${encodeURIComponent(jobTitle)}`)
            }
          >
            View Skill Recommendations
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
};

export default Analysis;
