import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { type LessonConfig } from "@/data/academy-curriculum";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Brain, Pencil, CheckCircle2, Loader2, Trophy, Star, AlertTriangle } from "lucide-react";

interface GradeResult {
  judgment_score: number;
  speed_score: number;
  override_score: number;
  tool_score: number;
  overall_score: number;
  feedback: string;
  highlights?: string[];
  improvements?: string[];
  passed: boolean;
}

interface LessonRendererProps {
  lesson: LessonConfig;
  lessonId: string;
  moduleId: string;
  lessonIndex: number;
  totalLessons: number;
  onComplete: (grade?: GradeResult) => void;
  onNext: () => void;
  onPrev: () => void;
}

type Step = "think" | "prompt" | "validate";

interface CompanyContext {
  name: string;
  industry: string | null;
  website: string | null;
  description: string | null;
  employee_range: string | null;
  funding_stage: string | null;
  headquarters: string | null;
}

export default function LessonRenderer({
  lesson, lessonId, moduleId, lessonIndex, totalLessons, onComplete, onNext, onPrev,
}: LessonRendererProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("think");
  const [userResponse, setUserResponse] = useState("");
  const [grading, setGrading] = useState(false);
  const [grade, setGrade] = useState<GradeResult | null>(null);
  const [completed, setCompleted] = useState(false);
  const [companyContext, setCompanyContext] = useState<CompanyContext | null>(null);
  const [loadingCompany, setLoadingCompany] = useState(false);

  const isConcept = lesson.type === "concept";
  const needsCompany = !isConcept;
  const hasPrompt = !!lesson.content.prompt;
  const hasValidate = !!lesson.content.validate;

  const steps: Step[] = ["think"];
  if (hasPrompt) steps.push("prompt");
  if (hasValidate) steps.push("validate");

  const stepIndex = steps.indexOf(step);

  useEffect(() => {
    if (needsCompany && !companyContext) fetchRandomCompany();
  }, [lessonId]);

  async function fetchRandomCompany() {
    setLoadingCompany(true);
    try {
      const { data } = await supabase
        .from("companies")
        .select("name, industry, website, description, employee_range, funding_stage, headquarters")
        .not("website", "is", null)
        .not("description", "is", null)
        .limit(50);
      if (data && data.length > 0) {
        const pick = data[Math.floor(Math.random() * data.length)];
        setCompanyContext(pick as CompanyContext);
      }
    } catch (e) {
      console.error("Failed to load company context", e);
    } finally {
      setLoadingCompany(false);
    }
  }

  async function handleSubmit() {
    if (!userResponse.trim()) {
      toast.error("Please write your response first.");
      return;
    }
    setGrading(true);
    try {
      const { data, error } = await supabase.functions.invoke("grade-lesson", {
        body: {
          lessonType: lesson.type,
          lessonContent: lesson.content,
          userResponse,
        },
      });
      if (error) throw error;
      setGrade(data as GradeResult);
      setStep("validate");
      setCompleted(true);
      onComplete(data as GradeResult);
    } catch (e) {
      console.error(e);
      toast.error("Grading failed. Please try again.");
    } finally {
      setGrading(false);
    }
  }

  function handleConceptComplete() {
    setCompleted(true);
    onComplete();
  }

  function getStepIcon(s: Step) {
    switch (s) {
      case "think": return <Brain className="w-4 h-4" />;
      case "prompt": return <Pencil className="w-4 h-4" />;
      case "validate": return <CheckCircle2 className="w-4 h-4" />;
    }
  }

  function getStepLabel(s: Step) {
    switch (s) {
      case "think": return "Think";
      case "prompt": return "Prompt";
      case "validate": return "Validate";
    }
  }

  const typeLabel = {
    concept: "📖 Concept",
    prompt_lab: "🧪 Prompt Lab",
    tool_lab: "🔧 Tool Lab",
    challenge: "⚔️ Live Lab Challenge",
  }[lesson.type];

  return (
    <div className="max-w-3xl mx-auto">
      {/* Lesson header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">{typeLabel}</span>
          <span className="text-xs text-muted-foreground">
            Lesson {lessonIndex + 1} of {totalLessons}
          </span>
        </div>
        <h2 className="text-xl font-bold text-foreground">{lesson.title}</h2>
        <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
          <Star className="w-3 h-3 text-primary" />
          <span>+{lesson.xpReward} XP</span>
        </div>
      </div>

      {/* Step indicators */}
      {steps.length > 1 && (
        <div className="flex items-center gap-2 mb-6">
          {steps.map((s, i) => (
            <button
              key={s}
              onClick={() => {
                if (s === "validate" && !grade) return;
                setStep(s);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                step === s
                  ? "bg-primary text-primary-foreground"
                  : i < stepIndex
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {getStepIcon(s)}
              {getStepLabel(s)}
            </button>
          ))}
        </div>
      )}

      {/* Step content */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {step === "think" && (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <Brain className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Think</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">
                    {lesson.content.think}
                  </p>
                </div>
              </div>

              {isConcept && !completed && (
                <Button onClick={handleConceptComplete} className="w-full mt-4">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  I understand — mark complete
                </Button>
              )}

              {hasPrompt && (
                <Button onClick={() => setStep("prompt")} className="w-full mt-4">
                  Continue to exercise
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {step === "prompt" && (
            <div>
              <div className="flex items-start gap-3 mb-4">
                <Pencil className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-2">Your Turn</h3>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-4">
                    {lesson.content.prompt}
                  </p>
                </div>
              </div>

              <Textarea
                placeholder="Type your response here..."
                value={userResponse}
                onChange={(e) => setUserResponse(e.target.value)}
                className="min-h-[160px] text-sm"
                disabled={grading || !!grade}
              />

              {!grade && (
                <Button
                  onClick={handleSubmit}
                  disabled={grading || !userResponse.trim()}
                  className="w-full mt-4"
                >
                  {grading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      AI is grading...
                    </>
                  ) : (
                    <>
                      Submit for grading
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              )}

              {grade && (
                <Button onClick={() => setStep("validate")} className="w-full mt-4">
                  View your grade
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {step === "validate" && grade && (
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold ${
                  grade.passed
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                }`}>
                  {grade.overall_score}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">
                    {grade.passed ? "Passed! 🎉" : "Not quite yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {grade.passed ? `+${lesson.xpReward} XP earned` : "Review feedback and try again"}
                  </p>
                </div>
              </div>

              {/* Score breakdown */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: "Judgment", score: grade.judgment_score, weight: "40%" },
                  { label: "Speed", score: grade.speed_score, weight: "20%" },
                  { label: "Override", score: grade.override_score, weight: "25%" },
                  { label: "Tool Use", score: grade.tool_score, weight: "15%" },
                ].map(({ label, score, weight }) => (
                  <div key={label} className="bg-muted rounded-lg p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-muted-foreground">{label} ({weight})</span>
                      <span className="text-sm font-semibold text-foreground">{score}</span>
                    </div>
                    <Progress value={score} className="h-1.5" />
                  </div>
                ))}
              </div>

              {/* Feedback */}
              <div className="bg-muted rounded-lg p-4 mb-4">
                <p className="text-sm text-foreground/80">{grade.feedback}</p>
              </div>

              {grade.highlights && grade.highlights.length > 0 && (
                <div className="mb-3">
                  <h4 className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1.5 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> What you did well
                  </h4>
                  <ul className="text-xs text-foreground/70 space-y-1">
                    {grade.highlights.map((h, i) => <li key={i}>✓ {h}</li>)}
                  </ul>
                </div>
              )}

              {grade.improvements && grade.improvements.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-semibold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Areas to improve
                  </h4>
                  <ul className="text-xs text-foreground/70 space-y-1">
                    {grade.improvements.map((h, i) => <li key={i}>→ {h}</li>)}
                  </ul>
                </div>
              )}

              {!grade.passed && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setGrade(null);
                    setUserResponse("");
                    setStep("prompt");
                    setCompleted(false);
                  }}
                  className="w-full"
                >
                  Try again
                </Button>
              )}
            </div>
          )}

          {step === "validate" && !grade && isConcept && completed && (
            <div className="text-center py-6">
              <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-foreground">Concept Complete!</h3>
              <p className="text-sm text-muted-foreground">+{lesson.xpReward} XP earned</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onPrev} disabled={lessonIndex === 0}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Previous
        </Button>
        <Button
          onClick={onNext}
          disabled={!completed && !grade?.passed}
        >
          {lessonIndex === totalLessons - 1 ? "Finish Module" : "Next Lesson"}
          <ArrowRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
