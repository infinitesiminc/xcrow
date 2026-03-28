/**
 * Index — Product picker: Upskill / Founder / Leadgen
 * Authenticated users who completed onboarding redirect to /map.
 */
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import Footer from "@/components/Footer";
import xcrowLogo from "@/assets/xcrow-logo.webp";
import { Map, Rocket, Target, ArrowRight } from "lucide-react";

const PRODUCTS = [
  {
    id: "upskill",
    name: "Xcrow Upskill",
    tagline: "Master 183 AI skills. Own your career.",
    description: "AI-powered skill gap analysis, gamified quests, and territory conquest. Built for students and professionals navigating the AI economy.",
    icon: Map,
    route: "/upskill",
    cta: "Start Your Mission",
    color: "from-emerald-500/20 to-emerald-500/5",
    border: "border-emerald-500/30 hover:border-emerald-500/60",
    accent: "text-emerald-400",
    bgAccent: "bg-emerald-500/10",
  },
  {
    id: "founder",
    name: "Xcrow Founder",
    tagline: "One prompt. One founder. Ship an AI startup.",
    description: "Discover high-potential niches scored by AI agent disruption potential, then generate a complete builder spec to launch your venture.",
    icon: Rocket,
    route: "/founder",
    cta: "Find Opportunities",
    color: "from-violet-500/20 to-violet-500/5",
    border: "border-violet-500/30 hover:border-violet-500/60",
    accent: "text-violet-400",
    bgAccent: "bg-violet-500/10",
  },
  {
    id: "leadgen",
    name: "Xcrow Leadgen",
    tagline: "AI agents that find your next customer.",
    description: "Autonomous agents discover, qualify, and reach out to high-intent prospects — filling your pipeline while you focus on closing.",
    icon: Target,
    route: "/leadgen",
    cta: "Get Early Access",
    color: "from-amber-500/20 to-amber-500/5",
    border: "border-amber-500/30 hover:border-amber-500/60",
    accent: "text-amber-400",
    bgAccent: "bg-amber-500/10",
  },
];

export default function Index() {
  const navigate = useNavigate();

  return (
    <>
      <SEOHead
        title="Xcrow — AI Skills, Startups & Lead Generation"
        description="Three products. One platform. Master AI skills, launch AI-native startups, or let AI agents find your next customer."
        path="/"
      />
      <div className="min-h-screen bg-background flex flex-col">
        {/* Hero */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pt-16 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-12"
          >
            <img src={xcrowLogo} alt="Xcrow" className="h-16 w-16 mx-auto mb-4 crow-glow" />
            <h1
              className="text-3xl md:text-4xl font-bold text-foreground mb-3"
              style={{ fontFamily: "'Cinzel', serif" }}
            >
              Choose your path
            </h1>
            <p className="text-muted-foreground text-sm md:text-base max-w-lg mx-auto">
              Three products built for the AI economy. Pick the one that fits where you are.
            </p>
          </motion.div>

          {/* Product Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl w-full">
            {PRODUCTS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.1, duration: 0.5 }}
                className="h-full"
              >
                <Card
                  className={`cursor-pointer transition-all duration-300 h-full flex flex-col bg-gradient-to-b ${p.color} ${p.border} group`}
                  onClick={() => navigate(p.route)}
                >
                  <CardContent className="p-6 flex flex-col flex-1">
                    <div className={`w-12 h-12 rounded-xl ${p.bgAccent} flex items-center justify-center mb-4`}>
                      <p.icon className={`w-6 h-6 ${p.accent}`} />
                    </div>
                    <h2
                      className="text-lg font-bold text-foreground mb-1"
                      style={{ fontFamily: "'Cinzel', serif" }}
                    >
                      {p.name}
                    </h2>
                    <p className={`text-sm font-medium ${p.accent} mb-3`}>{p.tagline}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed flex-1 mb-5">
                      {p.description}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className={`gap-1.5 w-full mt-auto group-hover:${p.accent} transition-colors`}
                    >
                      {p.cta} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        <Footer />
      </div>
    </>
  );
}
