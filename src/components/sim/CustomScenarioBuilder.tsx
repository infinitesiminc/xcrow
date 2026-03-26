/**
 * CustomScenarioBuilder — Platinum Tier: Users create their own simulation scenarios.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Wand2, Plus, Save, Play, Trash2, ChevronDown, Layers,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

interface ScenarioStep {
  id: string;
  description: string;
  tool: string;
  expectedOutcome: string;
}

const TOOL_OPTIONS = [
  "ChatGPT / LLM", "Code Interpreter", "Web Search", "Image Generator",
  "Data Analyzer", "Email Agent", "Spreadsheet Agent", "Custom API",
];

export default function CustomScenarioBuilder() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [context, setContext] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [steps, setSteps] = useState<ScenarioStep[]>([
    { id: "1", description: "", tool: TOOL_OPTIONS[0], expectedOutcome: "" },
  ]);
  const [saving, setSaving] = useState(false);

  const addStep = () => {
    setSteps(prev => [
      ...prev,
      { id: String(prev.length + 1), description: "", tool: TOOL_OPTIONS[0], expectedOutcome: "" },
    ]);
  };

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = (id: string, field: keyof ScenarioStep, value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !jobTitle.trim()) {
      toast.error("Please fill in the title and job title");
      return;
    }
    setSaving(true);
    try {
      await supabase.from("custom_simulations").insert({
        user_id: user.id,
        job_title: jobTitle,
        task_name: title,
        source_type: "custom_builder",
        source_prompt: context,
        recommended_template: "delegation",
        sim_duration: steps.length * 3,
      } as any);
      toast.success("Scenario saved! You can launch it from your quest board.");
      setTitle("");
      setJobTitle("");
      setContext("");
      setSteps([{ id: "1", description: "", tool: TOOL_OPTIONS[0], expectedOutcome: "" }]);
    } catch {
      toast.error("Failed to save scenario");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl p-6" style={stoneCard}>
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15">
          <Wand2 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={cinzel}>Scenario Builder</h3>
          <p className="text-[10px] text-muted-foreground">Design your own simulation challenge</p>
        </div>
        <Badge className="ml-auto text-[9px]" variant="outline">
          <Layers className="h-3 w-3 mr-1" /> Custom
        </Badge>
      </div>

      <div className="space-y-4">
        {/* Basic Info */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Scenario Title</label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Client Onboarding Automation"
              className="text-sm"
            />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Target Role</label>
            <Input
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
              placeholder="e.g. Marketing Manager"
              className="text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Context / Background</label>
          <Textarea
            value={context}
            onChange={e => setContext(e.target.value)}
            placeholder="Describe the scenario context and what the user should accomplish..."
            rows={3}
            className="text-sm"
          />
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">Difficulty</label>
          <Select value={difficulty} onValueChange={setDifficulty}>
            <SelectTrigger className="w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="beginner">🌱 Beginner</SelectItem>
              <SelectItem value="intermediate">⚔️ Intermediate</SelectItem>
              <SelectItem value="advanced">🔥 Advanced</SelectItem>
              <SelectItem value="expert">👑 Expert</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Steps */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Workflow Steps</label>
            <Button size="sm" variant="ghost" onClick={addStep} className="text-[10px] h-7 gap-1 text-primary">
              <Plus className="h-3 w-3" /> Add Step
            </Button>
          </div>
          <div className="space-y-3">
            {steps.map((step, i) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg p-3 border border-border/50 bg-background/50"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-mono text-muted-foreground w-5">#{i + 1}</span>
                  <Select value={step.tool} onValueChange={v => updateStep(step.id, "tool", v)}>
                    <SelectTrigger className="h-7 text-[11px] w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TOOL_OPTIONS.map(tool => (
                        <SelectItem key={tool} value={tool} className="text-xs">{tool}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {steps.length > 1 && (
                    <Button size="sm" variant="ghost" onClick={() => removeStep(step.id)} className="h-7 w-7 p-0 ml-auto text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                <Input
                  value={step.description}
                  onChange={e => updateStep(step.id, "description", e.target.value)}
                  placeholder="What should the agent do?"
                  className="text-xs mb-1.5"
                />
                <Input
                  value={step.expectedOutcome}
                  onChange={e => updateStep(step.id, "expectedOutcome", e.target.value)}
                  placeholder="Expected outcome (for scoring)"
                  className="text-xs"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} disabled={saving} className="gap-2 flex-1">
            <Save className="h-4 w-4" /> Save Scenario
          </Button>
          <Button variant="outline" disabled className="gap-2">
            <Play className="h-4 w-4" /> Preview
          </Button>
        </div>
      </div>
    </div>
  );
}
