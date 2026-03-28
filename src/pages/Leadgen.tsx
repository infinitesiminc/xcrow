import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Zap, Target, Mail, Bot, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  { icon: Target, title: "AI Prospect Discovery", desc: "Autonomous agents scan your ICP across the web and surface high-intent leads." },
  { icon: Bot, title: "Smart Qualification", desc: "Agent scores leads on fit, timing, and buying signals — no manual research." },
  { icon: Mail, title: "Personalized Outreach", desc: "AI drafts hyper-personalized sequences based on each prospect's context." },
  { icon: Zap, title: "Pipeline on Autopilot", desc: "From first touch to booked meeting — agents handle the entire top-of-funnel." },
];

export default function Leadgen() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await supabase.from("competition_registrations").insert({
        email: email.trim(),
        full_name: "Leadgen Waitlist",
        university: "N/A",
      });
      setSubmitted(true);
      toast.success("You're on the list!");
    } catch {
      toast.error("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Xcrow Leadgen — AI Agents That Find Your Next Customer</title>
        <meta name="description" content="AI-powered lead generation agents that discover, qualify, and reach out to your ideal customers on autopilot." />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        {/* Hero */}
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 text-xs border-primary/30 text-primary">
              Coming Soon
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-cinzel text-foreground mb-4 leading-tight">
              AI agents that find<br />your next customer
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Stop cold calling. Let autonomous agents discover high-intent prospects,
              craft personalized outreach, and fill your pipeline — while you focus on closing.
            </p>

            {submitted ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium">
                <Check className="w-5 h-5" /> You're on the early access list
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-muted/20 border-border/40"
                />
                <Button type="submit" disabled={loading} className="gap-1.5 shrink-0">
                  Get Early Access <ArrowRight className="w-4 h-4" />
                </Button>
              </form>
            )}
          </motion.div>
        </div>

        {/* Features */}
        <div className="max-w-5xl mx-auto px-4 pb-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.4 }}
              >
                <Card className="bg-card/40 border-border/30 hover:border-primary/30 transition-colors h-full">
                  <CardContent className="p-5 flex gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <f.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm mb-1">{f.title}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
