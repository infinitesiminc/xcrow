import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, BarChart3, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const steps = [
  { icon: Briefcase, title: "Enter your role", description: "Tell us your company and job title" },
  { icon: BarChart3, title: "Get your analysis", description: "See how AI impacts each task in your role" },
  { icon: BookOpen, title: "Bridge the gap", description: "Get personalized skill recommendations" },
];

const Index = () => {
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim()) return;
    navigate(`/analysis?company=${encodeURIComponent(company.trim())}&title=${encodeURIComponent(jobTitle.trim())}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="flex flex-col items-center justify-center px-4 pt-24 pb-16 md:pt-32 md:pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto"
        >
          <span className="inline-block mb-4 px-3 py-1 text-xs font-medium tracking-wide uppercase rounded-full bg-accent text-accent-foreground">
            AI Impact Analyzer
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold font-display tracking-tight text-foreground leading-tight">
            How is AI changing{" "}
            <span className="text-primary">your job</span>?
          </h1>
          <p className="mt-5 text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
            Enter your role to get a task-level breakdown of AI's impact — and a personalized plan to stay ahead.
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          onSubmit={handleSubmit}
          className="mt-10 w-full max-w-md space-y-3"
        >
          <Input
            placeholder="Company name (optional)"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            className="h-12 bg-card border-border"
          />
          <Input
            placeholder="Your job title *"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            required
            className="h-12 bg-card border-border"
          />
          <Button type="submit" size="lg" className="w-full h-12 text-base font-semibold gap-2">
            Analyze My Role
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.form>
      </div>

      {/* How it works */}
      <div className="px-4 pb-24">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-sm font-medium uppercase tracking-widest text-muted-foreground mb-10">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="text-center"
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
                  <step.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display font-semibold text-foreground">{step.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
