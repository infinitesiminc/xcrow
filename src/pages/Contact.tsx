import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MapPin, Send, Loader2, CheckCircle2, Calendar, GraduationCap, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, delay, ease: "easeOut" as const },
});

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [university, setUniversity] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !university.trim()) return;
    setSending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { name, email, subject: "university-inquiry", company: university, teamSize: "", message: message || `University inquiry from ${university}`, formType: "org", phone },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Message sent", description: "I'll get back to you within 24 hours. — Jackson" });
    } catch (err) {
      console.error("Contact form error:", err);
      toast({ title: "Failed to send", description: "Please try again or email jackson@xcrow.ai directly.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  const inputClass = "w-full rounded-xl border border-border bg-background px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-muted-foreground/50";

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">

          {/* ═══ FOUNDER LETTER ═══ */}
          <motion.div {...fade()} className="max-w-2xl mx-auto text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6"
              style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
              <span className="text-2xl">👋</span>
            </div>
            <h1 className="font-fantasy text-3xl sm:text-5xl font-bold mb-5 leading-tight">
              Let's Talk About Your Students' Future
            </h1>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed mb-6">
              I'm <span className="text-foreground font-semibold">Jackson</span>, founder of Xcrow. I built this platform because I saw the same gap
              at every university I visited — career services teams want to prepare students for AI, but the tools don't exist yet.
            </p>
            <p className="text-muted-foreground text-base sm:text-lg leading-relaxed">
              If you're running career support, employability programs, or workforce readiness initiatives,
              I'd love to hear what challenges your students face. Every partnership starts with a conversation.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-5 gap-8">

            {/* ═══ CONTACT FORM — 3 cols ═══ */}
            <motion.div {...fade(0.15)} className="lg:col-span-3">
              {sent ? (
                <Card className="border-border/50" style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <CardContent className="p-10 text-center">
                    <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-primary" />
                    <h2 className="font-fantasy text-xl font-bold mb-2">Message sent!</h2>
                    <p className="text-sm text-muted-foreground mb-6">Thanks for reaching out. I'll personally reply within 24 hours. — Jackson</p>
                    <Button variant="outline" onClick={() => { setSent(false); setName(""); setEmail(""); setUniversity(""); setPhone(""); setMessage(""); }}>
                      Send another message
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <Card className="border-border/50" style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light)), 0 4px 20px hsl(var(--emboss-shadow))" }}>
                  <CardContent className="p-6 sm:p-8">
                    <h2 className="font-fantasy text-xl font-bold mb-1">Get in Touch</h2>
                    <p className="text-sm text-muted-foreground mb-6">Tell me about your university and I'll show you how Xcrow fits.</p>
                    <form onSubmit={handleSubmit} className="space-y-4">

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">
                          <GraduationCap className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5 text-primary" />
                          University Name *
                        </label>
                        <input type="text" value={university} onChange={e => setUniversity(e.target.value)}
                          required maxLength={150} className={inputClass} placeholder="e.g. UCLA, NYU, University of Michigan" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Your Name *</label>
                          <input type="text" value={name} onChange={e => setName(e.target.value)}
                            required maxLength={100} className={inputClass} placeholder="Full name" />
                        </div>
                        <div>
                          <label className="text-sm font-medium mb-1.5 block">Work Email *</label>
                          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            required maxLength={255} className={inputClass} placeholder="you@university.edu" />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">
                          <Phone className="inline h-3.5 w-3.5 mr-1.5 -mt-0.5 text-primary" />
                          Office Number
                        </label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                          maxLength={30} className={inputClass} placeholder="+1 (555) 123-4567" />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-1.5 block">Message <span className="text-muted-foreground font-normal">(optional)</span></label>
                        <textarea value={message} onChange={e => setMessage(e.target.value)}
                          maxLength={2000} rows={4} className={`${inputClass} resize-y`}
                          placeholder="Tell me about your career services goals, student cohort size, or any specific challenges…" />
                      </div>

                      <Button type="submit" className="w-full gap-2 h-12 text-base" disabled={sending}>
                        {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                        {sending ? "Sending…" : "Send to Jackson"}
                      </Button>
                      <p className="text-[11px] text-muted-foreground text-center">I reply to every message personally within 24 hours.</p>
                    </form>
                  </CardContent>
                </Card>
              )}
            </motion.div>

            {/* ═══ SIDEBAR — 2 cols ═══ */}
            <div className="lg:col-span-2 space-y-5">

              {/* Direct contact */}
              <motion.div {...fade(0.25)}>
                <Card className="border-border/50" style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <CardContent className="p-6 space-y-4">
                    <h3 className="font-fantasy font-bold text-sm">Reach Me Directly</h3>
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">jackson@xcrow.ai</p>
                        <p className="text-[11px] text-muted-foreground">I respond within 24 hours</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <div>
                        <p className="text-sm font-medium">160 Glendale Blvd</p>
                        <p className="text-[11px] text-muted-foreground">Los Angeles, CA 90026</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Calendly */}
              <motion.div {...fade(0.35)}>
                <Card className="border-border/50 overflow-hidden" style={{ background: "hsl(var(--card))", boxShadow: "inset 0 1px 0 hsl(var(--emboss-light))" }}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="h-9 w-9 rounded-xl flex items-center justify-center"
                        style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)" }}>
                        <Calendar className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-fantasy font-bold text-sm">Book a Call</h3>
                        <p className="text-[11px] text-muted-foreground">30 min · free · no pressure</p>
                      </div>
                    </div>
                    <iframe
                      src="https://calendly.com/jacksonlam?hide_gdpr_banner=1&background_color=0a0a0a&text_color=fafafa&primary_color=6366f1"
                      className="w-full border-0 rounded-lg"
                      style={{ minHeight: 500 }}
                      title="Book a meeting with Jackson"
                    />
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Contact;
