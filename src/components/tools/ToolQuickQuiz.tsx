/**
 * ToolQuickQuiz — 3-question rapid assessment that determines proficiency level.
 * Questions are generated from tool metadata (products, use cases, category).
 * Renders as a compact overlay anchored to the card.
 */
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import type { GTCTool } from "@/data/gtc-tools-registry";

export interface QuizResult {
  level: number; // 0-3
  correct: number;
  total: number;
}

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

const PROFICIENCY_LEVELS = [
  { label: "New", color: "hsl(var(--muted-foreground))", emoji: "🔍" },
  { label: "Beginner", color: "hsl(200, 80%, 55%)", emoji: "🌱" },
  { label: "Intermediate", color: "hsl(45, 90%, 55%)", emoji: "⚡" },
  { label: "Advanced", color: "hsl(var(--primary))", emoji: "🏆" },
];

function generateQuestions(tool: GTCTool): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const products = tool.products || [];
  const productNames = products.map(p => p.name);

  // Q1: What is this tool? (Easy — tests basic awareness)
  questions.push({
    question: `What best describes ${tool.name}?`,
    options: shuffle([
      tool.description.split(".")[0] + ".",
      `A project management tool for agile teams.`,
      `An open-source database management system.`,
    ]),
    correctIndex: 0, // will be recalculated after shuffle
  });

  // Q2: Product suite knowledge (Medium)
  if (productNames.length >= 2) {
    const real = productNames[Math.floor(Math.random() * productNames.length)];
    const fakes = generateFakeProducts(tool.name, productNames);
    questions.push({
      question: `Which of these is a real ${tool.name} product?`,
      options: shuffle([real, ...fakes.slice(0, 2)]),
      correctIndex: 0,
    });
  } else {
    // Fallback: category question
    const categoryLabels: Record<string, string> = {
      "foundation-models": "Foundation Models & LLMs",
      "coding-agents": "Coding & Development Agents",
      "data-platforms": "Data & Analytics Platforms",
      "mlops-infra": "MLOps & Infrastructure",
      "cloud-ai": "Cloud AI Services",
      "cybersecurity": "Cybersecurity & Identity",
      "enterprise-ai": "Enterprise AI Platforms",
      "design-media": "Design & Creative Media",
      "hr-talent": "HR & Talent Management",
      "finance-ops": "Finance & Operations",
      "productivity": "Productivity & Collaboration",
      "bi-visualization": "BI & Data Visualization",
    };
    const correct = categoryLabels[tool.category] || tool.category;
    const wrongCats = Object.values(categoryLabels).filter(c => c !== correct);
    const picked = wrongCats.sort(() => Math.random() - 0.5).slice(0, 2);
    questions.push({
      question: `${tool.name} primarily belongs to which category?`,
      options: shuffle([correct, ...picked]),
      correctIndex: 0,
    });
  }

  // Q3: Use case / applied knowledge (Hard)
  if (tool.useCases && tool.useCases.length > 0) {
    const realUC = formatUseCase(tool.useCases[0]);
    const fakeUCs = ["3D rendering and animation", "Hardware chip design", "Supply chain logistics tracking"]
      .filter(u => u !== realUC);
    questions.push({
      question: `Which use case does ${tool.name} best support?`,
      options: shuffle([realUC, ...fakeUCs.slice(0, 2)]),
      correctIndex: 0,
    });
  } else {
    const companyQ = `${tool.name} is made by which company?`;
    const fakeCompanies = ["Palantir", "Snowflake", "Databricks", "Salesforce", "Microsoft", "Google", "Meta"]
      .filter(c => c !== tool.company).sort(() => Math.random() - 0.5).slice(0, 2);
    questions.push({
      question: companyQ,
      options: shuffle([tool.company, ...fakeCompanies]),
      correctIndex: 0,
    });
  }

  // Fix correctIndex after shuffle
  return questions.map(q => {
    const original = q.options[0]; // before shuffle, correct was first
    return q; // shuffle already placed it; correctIndex is set inside shuffle
  });
}

function shuffle(arr: string[]): string[] {
  // First item is the correct answer — shuffle and return with marker
  const correct = arr[0];
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  // We need to communicate the correct index — mutate via closure won't work
  // Instead, we'll handle it differently
  return shuffled;
}

function formatUseCase(uc: string): string {
  return uc.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase());
}

function generateFakeProducts(toolName: string, realNames: string[]): string[] {
  const fakes = [
    `${toolName} Sync`, `${toolName} Hub`, `${toolName} Insights`,
    `${toolName} Studio`, `${toolName} Edge`, `${toolName} Flow`,
    `${toolName} Connect`, `${toolName} Guard`, `${toolName} Pulse`,
  ];
  return fakes.filter(f => !realNames.some(r => r.toLowerCase() === f.toLowerCase()))
    .sort(() => Math.random() - 0.5);
}

function buildQuiz(tool: GTCTool): QuizQuestion[] {
  const products = tool.products || [];
  const productNames = products.map(p => p.name);
  const questions: QuizQuestion[] = [];

  // Q1: Description recognition
  {
    const correct = tool.description.split(".")[0] + ".";
    const wrongs = [
      "A project management tool for agile development teams.",
      "An open-source database management and migration system.",
      "A cloud-native monitoring and observability platform.",
    ].filter(w => w !== correct);
    const opts = [correct, wrongs[0], wrongs[1]];
    const shuffled = opts.sort(() => Math.random() - 0.5);
    questions.push({ question: `What best describes ${tool.name}?`, options: shuffled, correctIndex: shuffled.indexOf(correct) });
  }

  // Q2: Product or category
  if (productNames.length >= 2) {
    const correct = productNames[Math.floor(Math.random() * productNames.length)];
    const fakes = generateFakeProducts(tool.name, productNames).slice(0, 2);
    const opts = [correct, ...fakes];
    const shuffled = opts.sort(() => Math.random() - 0.5);
    questions.push({ question: `Which is a real ${tool.name} product?`, options: shuffled, correctIndex: shuffled.indexOf(correct) });
  } else {
    const catMap: Record<string, string> = {
      "foundation-models": "Foundation Models", "coding-agents": "Coding Agents",
      "data-platforms": "Data Platforms", "mlops-infra": "MLOps Infrastructure",
      "cloud-ai": "Cloud AI", "cybersecurity": "Cybersecurity",
      "enterprise-ai": "Enterprise AI", "design-media": "Design & Media",
      "hr-talent": "HR & Talent", "finance-ops": "Finance Ops",
      "productivity": "Productivity", "bi-visualization": "BI & Visualization",
      "agentic-frameworks": "Agentic Frameworks", "search-retrieval": "Search & Retrieval",
      "simulation-digital-twin": "Simulation", "robotics-physical-ai": "Robotics",
      "networking-edge": "Networking", "hardware-compute": "Hardware & Compute",
      "vertical-industry": "Vertical Industry", "legal-compliance": "Legal & Compliance",
      "customer-platforms": "Customer Platforms", "marketing-revops": "Marketing & RevOps",
    };
    const correct = catMap[tool.category] || tool.category;
    const wrongs = Object.values(catMap).filter(c => c !== correct).sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [correct, ...wrongs];
    const shuffled = opts.sort(() => Math.random() - 0.5);
    questions.push({ question: `${tool.name} belongs to which category?`, options: shuffled, correctIndex: shuffled.indexOf(correct) });
  }

  // Q3: Use case or company
  if (tool.useCases && tool.useCases.length > 0) {
    const correct = formatUseCase(tool.useCases[0]);
    const wrongs = ["3D Rendering And Animation", "Hardware Chip Design", "Supply Chain Logistics"].filter(w => w !== correct).slice(0, 2);
    const opts = [correct, ...wrongs];
    const shuffled = opts.sort(() => Math.random() - 0.5);
    questions.push({ question: `Which use case does ${tool.name} best support?`, options: shuffled, correctIndex: shuffled.indexOf(correct) });
  } else {
    const correct = tool.company;
    const wrongs = ["Palantir", "Snowflake", "Databricks", "Salesforce", "Adobe", "Google"]
      .filter(c => c !== correct).sort(() => Math.random() - 0.5).slice(0, 2);
    const opts = [correct, ...wrongs];
    const shuffled = opts.sort(() => Math.random() - 0.5);
    questions.push({ question: `Who makes ${tool.name}?`, options: shuffled, correctIndex: shuffled.indexOf(correct) });
  }

  return questions;
}

interface Props {
  tool: GTCTool;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
}

export default function ToolQuickQuiz({ tool, onComplete, onClose }: Props) {
  const questions = useMemo(() => buildQuiz(tool), [tool.name]);
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [finished, setFinished] = useState(false);

  const q = questions[currentQ];

  const handleAnswer = (idx: number) => {
    if (answered) return;
    setSelected(idx);
    setAnswered(true);
    if (idx === q.correctIndex) setCorrect(c => c + 1);
  };

  const next = () => {
    if (currentQ < questions.length - 1) {
      setCurrentQ(c => c + 1);
      setSelected(null);
      setAnswered(false);
    } else {
      const finalCorrect = selected === q.correctIndex ? correct : correct; // already counted
      const level = finalCorrect === 3 ? 3 : finalCorrect === 2 ? 2 : finalCorrect === 1 ? 1 : 0;
      setFinished(true);
      onComplete({ level, correct: finalCorrect, total: 3 });
    }
  };

  const finalLevel = correct === 3 ? 3 : correct === 2 ? 2 : correct === 1 ? 1 : 0;
  const lvl = PROFICIENCY_LEVELS[finalLevel];

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50"
        style={{ background: "hsl(var(--background) / 0.7)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[min(420px,90vw)] rounded-2xl shadow-2xl flex flex-col"
        style={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border) / 0.3)" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{tool.icon}</span>
            <div>
              <h3 className="text-sm font-bold" style={{ color: "hsl(var(--foreground))" }}>{tool.name}</h3>
              <p className="text-[10px] uppercase tracking-wider font-medium" style={{ color: "hsl(var(--muted-foreground))" }}>
                Quick Test · Q{currentQ + 1}/{questions.length}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {questions.map((_, i) => (
                <div key={i} className="w-6 h-1.5 rounded-full transition-all" style={{
                  background: i < currentQ ? "hsl(var(--primary))" : i === currentQ ? "hsl(var(--primary) / 0.4)" : "hsl(var(--muted) / 0.15)"
                }} />
              ))}
            </div>
            <button onClick={onClose} className="p-1 rounded-lg hover:opacity-70 transition-all"
              style={{ background: "hsl(var(--muted) / 0.1)" }}>
              <X className="h-4 w-4" style={{ color: "hsl(var(--muted-foreground))" }} />
            </button>
          </div>
        </div>

        {!finished ? (
          <div className="px-5 pb-5 space-y-4">
            {/* Question */}
            <p className="text-sm font-semibold leading-snug" style={{ color: "hsl(var(--foreground))" }}>
              {q.question}
            </p>

            {/* Options */}
            <div className="space-y-2">
              {q.options.map((opt, idx) => {
                const isCorrectOpt = idx === q.correctIndex;
                const isSelected = idx === selected;
                let bg = "hsl(var(--muted) / 0.06)";
                let border = "hsl(var(--border) / 0.15)";
                let color = "hsl(var(--foreground) / 0.8)";

                if (answered) {
                  if (isCorrectOpt) { bg = "hsl(142, 70%, 45%, 0.12)"; border = "hsl(142, 70%, 45%, 0.4)"; color = "hsl(142, 70%, 45%)"; }
                  else if (isSelected) { bg = "hsl(0, 70%, 50%, 0.1)"; border = "hsl(0, 70%, 50%, 0.35)"; color = "hsl(0, 70%, 50%)"; }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(idx)}
                    disabled={answered}
                    className="w-full px-4 py-3 rounded-xl text-[13px] text-left flex items-center gap-3 transition-all hover:scale-[1.01]"
                    style={{ background: bg, border: `1px solid ${border}`, color }}
                  >
                    {answered && isCorrectOpt && <Check className="h-4 w-4 shrink-0" />}
                    {answered && isSelected && !isCorrectOpt && <X className="h-4 w-4 shrink-0" />}
                    {!answered && <span className="w-5 h-5 rounded-full border flex items-center justify-center text-[10px] shrink-0"
                      style={{ borderColor: "hsl(var(--border) / 0.3)", color: "hsl(var(--muted-foreground))" }}>
                      {String.fromCharCode(65 + idx)}
                    </span>}
                    <span>{opt}</span>
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            {answered && (
              <motion.button
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={next}
                className="w-full py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1.5"
                style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
              >
                {currentQ < questions.length - 1 ? <>Next <ArrowRight className="h-3.5 w-3.5" /></> : "See Result"}
              </motion.button>
            )}
          </div>
        ) : (
          /* Result */
          <div className="px-5 pb-6 flex flex-col items-center text-center gap-3 py-6">
            <span className="text-5xl">{lvl.emoji}</span>
            <div>
              <p className="text-lg font-bold" style={{ color: lvl.color }}>{lvl.label}</p>
              <p className="text-xs mt-0.5" style={{ color: "hsl(var(--muted-foreground))" }}>
                {correct}/{questions.length} correct
              </p>
            </div>
            {tool.url && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[11px] font-medium underline underline-offset-2"
                style={{ color: "hsl(var(--primary))" }}
              >
                Learn more at {tool.name} →
              </a>
            )}
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2 rounded-xl text-xs font-bold"
              style={{ background: "hsl(var(--muted) / 0.1)", color: "hsl(var(--foreground))" }}
            >
              Done
            </button>
          </div>
        )}
      </motion.div>
    </>
  );
}