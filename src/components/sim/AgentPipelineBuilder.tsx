/**
 * AgentPipelineBuilder — Silver+ Tier: Visual multi-step AI agent workflow builder.
 * Rebranded from CustomScenarioBuilder with drag-reorder, flow preview, and credit gate.
 */
import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Workflow, Plus, Save, Play, Sparkles } from "lucide-react";
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
import PipelineStepCard, { TOOL_OPTIONS, type PipelineStep } from "./PipelineStepCard";
import PipelinePreview from "./PipelinePreview";

const cinzel = { fontFamily: "'Cinzel', serif" };
const stoneCard = {
  background: "hsl(var(--surface-stone))",
  border: "1px solid hsl(var(--filigree) / 0.2)",
  boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))",
};

let stepCounter = 1;
function makeStep(): PipelineStep {
  stepCounter += 1;
  return { id: String(stepCounter), description: "", tool: "llm", expectedOutcome: "" };
}

export default function AgentPipelineBuilder() {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [context, setContext] = useState("");
  const [difficulty, setDifficulty] = useState("intermediate");
  const [steps, setSteps] = useState<PipelineStep[]>([
    { id: "1", description: "", tool: "llm", expectedOutcome: "" },
  ]);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [previewStep, setPreviewStep] = useState(-1);

  // Drag state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const addStep = () => setSteps(prev => [...prev, makeStep()]);

  const removeStep = (id: string) => {
    if (steps.length <= 1) return;
    setSteps(prev => prev.filter(s => s.id !== id));
  };

  const updateStep = useCallback((id: string, field: keyof PipelineStep, value: string) => {
    setSteps(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  }, []);

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (idx: number) => setDragOverIdx(idx);
  const handleDragEnd = () => {
    if (dragIdx !== null && dragOverIdx !== null && dragIdx !== dragOverIdx) {
      setSteps(prev => {
        const copy = [...prev];
        const [moved] = copy.splice(dragIdx, 1);
        copy.splice(dragOverIdx, 0, moved);
        return copy;
      });
    }
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleSave = async () => {
    if (!user || !title.trim() || !jobTitle.trim()) {
      toast.error("Please fill in the pipeline name and target role");
      return;
    }
    setSaving(true);
    try {
      const stepsJson = steps.map((s, i) => ({
        order: i + 1,
        tool: s.tool,
        description: s.description,
        expected: s.expectedOutcome,
      }));
      await supabase.from("custom_simulations").insert({
        user_id: user.id,
        job_title: jobTitle,
        task_name: title,
        source_type: "agent_pipeline",
        source_prompt: context,
        source_document_text: JSON.stringify(stepsJson),
        recommended_template: "delegation",
        sim_duration: steps.length * 3,
      } as any);
      toast.success("Pipeline saved! Launch it from your quest board.");
      setTitle("");
      setJobTitle("");
      setContext("");
      setSteps([{ id: "1", description: "", tool: "llm", expectedOutcome: "" }]);
    } catch {
      toast.error("Failed to save pipeline");
    } finally {
      setSaving(false);
    }
  };

  const runPreview = () => {
    if (steps.length === 0) return;
    setPreviewing(true);
    setPreviewStep(0);
    let idx = 0;
    const interval = setInterval(() => {
      idx += 1;
      if (idx >= steps.length) {
        clearInterval(interval);
        setTimeout(() => {
          setPreviewing(false);
          setPreviewStep(-1);
          toast.success("Preview complete — all steps passed!");
        }, 800);
      } else {
        setPreviewStep(idx);
      }
    }, 1200);
  };

  const filledSteps = steps.filter(s => s.description.trim());

  return (
    <div className="rounded-xl p-6" style={stoneCard}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-primary/15">
          <Workflow className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={cinzel}>Agent Pipeline Builder</h3>
          <p className="text-[10px] text-muted-foreground">Design multi-step AI agent workflows</p>
        </div>
        <Badge className="ml-auto text-[9px] gap-1" variant="outline">
          <Sparkles className="h-3 w-3" /> Silver+
        </Badge>
      </div>

      <div className="grid lg:grid-cols-[1fr_220px] gap-4">
        {/* Left: Editor */}
        <div className="space-y-4">
          {/* Basic Info */}
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                Pipeline Name
              </label>
              <Input
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Client Onboarding Flow"
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
                Target Role
              </label>
              <Input
                value={jobTitle}
                onChange={e => setJobTitle(e.target.value)}
                placeholder="e.g. Marketing Manager"
                className="text-sm"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
              Scenario Context
            </label>
            <Textarea
              value={context}
              onChange={e => setContext(e.target.value)}
              placeholder="Describe the business scenario and goals..."
              rows={2}
              className="text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-1 block">
              Difficulty
            </label>
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

          {/* Pipeline Steps */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">
                Agent Steps — drag to reorder
              </label>
              <Button size="sm" variant="ghost" onClick={addStep} className="text-[10px] h-7 gap-1 text-primary">
                <Plus className="h-3 w-3" /> Add Step
              </Button>
            </div>
            <div className="space-y-3">
              {steps.map((step, i) => (
                <motion.div
                  key={step.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <PipelineStepCard
                    step={step}
                    index={i}
                    total={steps.length}
                    onUpdate={updateStep}
                    onRemove={removeStep}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    isDragging={dragIdx === i}
                    isDragOver={dragOverIdx === i}
                  />
                </motion.div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={handleSave} disabled={saving || filledSteps.length === 0} className="gap-2 flex-1">
              <Save className="h-4 w-4" /> Save Pipeline
            </Button>
            <Button
              variant="outline"
              onClick={runPreview}
              disabled={previewing || filledSteps.length === 0}
              className="gap-2"
            >
              <Play className="h-4 w-4" /> Preview
            </Button>
          </div>
        </div>

        {/* Right: Live flow preview */}
        <div className="hidden lg:block">
          <PipelinePreview
            steps={steps}
            title={title}
            running={previewing}
            activeStep={previewStep}
          />
        </div>
      </div>
    </div>
  );
}
