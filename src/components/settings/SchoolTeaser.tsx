/**
 * SchoolTeaser — Shown on the Journey page when a student's school
 * hasn't signed up yet. Encourages them to share the platform with
 * their school / department to unlock program-specific features.
 */
import { useState } from "react";
import { motion } from "framer-motion";
import {
  GraduationCap, Sparkles, Send, Copy, Check, ArrowRight, BookOpen, Zap, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const FEATURES = [
  { icon: BookOpen, label: "Program-specific skill gaps", desc: "See exactly what your major doesn't teach" },
  { icon: Zap, label: "AI task simulations", desc: "Practice real workplace scenarios" },
  { icon: Users, label: "Cohort leaderboards", desc: "Compete with classmates on career readiness" },
];

export default function SchoolTeaser() {
  const { profile, plan } = useAuth();
  const [copied, setCopied] = useState(false);

  // Only show for non-school students
  if (plan === "school") return null;
  const isStudent = profile?.careerStage === "student" || !!profile?.schoolName;
  if (!isStudent) return null;

  const schoolName = profile?.schoolName || "your school";
  const shareUrl = `${window.location.origin}/enterprise`;

  function handleCopy() {
    const msg = `Hey! I've been using Crowy to map my AI-readiness skills. It'd be amazing if ${schoolName} partnered with them so we could get program-specific gap analysis and simulations. Check it out: ${shareUrl}`;
    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleEmail() {
    const subject = encodeURIComponent(`Crowy — AI career readiness for ${schoolName} students`);
    const body = encodeURIComponent(
      `Hi,\n\nI've been using Crowy (${shareUrl}) to practice AI-era work tasks and map my career readiness skills.\n\nThey offer a school partnership that gives students personalized curriculum gap analysis based on our actual program courses. I think it would be a great fit for ${schoolName}.\n\nWould you be open to exploring this?\n\nThanks!`
    );
    window.open(`mailto:?subject=${subject}&body=${body}`, "_blank");
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="rounded-2xl border border-[hsl(var(--neon-purple))]/20 bg-gradient-to-br from-[hsl(var(--neon-purple))]/5 via-card to-[hsl(var(--neon-blue))]/5 p-5 mb-5"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="rounded-lg bg-[hsl(var(--neon-purple))]/10 p-2 shrink-0">
          <GraduationCap className="h-4.5 w-4.5 text-[hsl(var(--neon-purple))]" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            Unlock {schoolName}'s full experience
            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[hsl(var(--neon-pink))]/10 text-[hsl(var(--neon-pink))] text-[10px] font-semibold">
              <Sparkles className="h-2.5 w-2.5" /> Pro
            </span>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            When {schoolName} partners with Crowy, you'll get personalized insights based on your actual courses
          </p>
        </div>
      </div>

      {/* Feature preview cards */}
      <div className="grid sm:grid-cols-3 gap-2 mb-4">
        {FEATURES.map((feat, i) => (
          <motion.div
            key={feat.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.08 }}
            className="rounded-xl border border-border/40 bg-background/50 p-3 text-center"
          >
            <feat.icon className="h-4 w-4 text-[hsl(var(--neon-purple))]/60 mx-auto mb-1.5" />
            <p className="text-[11px] font-medium text-foreground">{feat.label}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">{feat.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={handleEmail} className="gap-1.5 bg-[hsl(var(--neon-purple))] hover:bg-[hsl(var(--neon-purple))]/90 text-white">
          <Send className="h-3 w-3" /> Tell your professor
        </Button>
        <Button size="sm" variant="outline" onClick={handleCopy} className="gap-1.5 border-[hsl(var(--neon-purple))]/30 hover:bg-[hsl(var(--neon-purple))]/5">
          {copied ? <Check className="h-3 w-3 text-[hsl(var(--success))]" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied!" : "Copy message"}
        </Button>
        <Button size="sm" variant="ghost" onClick={() => window.open(shareUrl, "_blank")} className="gap-1.5 text-muted-foreground">
          Learn more <ArrowRight className="h-3 w-3" />
        </Button>
      </div>

      <p className="text-[10px] text-muted-foreground/60 mt-3 italic">
        Schools get a free pilot — help your department discover AI-readiness tools
      </p>
    </motion.div>
  );
}
