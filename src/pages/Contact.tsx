import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, MapPin, Send, Loader2, CheckCircle2, Calendar, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Contact = () => {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isOrgInquiry = subject !== "" && subject !== "other";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { name, email, subject, company, teamSize, message, formType: isOrgInquiry ? "org" : "general" },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Message sent", description: "We'll get back to you soon." });
    } catch (err) {
      console.error("Contact form error:", err);
      toast({ title: "Failed to send", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-16">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-serif font-bold text-foreground mb-3">Get in Touch</h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Have a question, feedback, or partnership idea? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { icon: Mail, title: "Email", detail: "jackson@infinitesim.co", sub: "We respond within 24 hours" },
            { icon: MessageSquare, title: "Support", detail: "jackson@infinitesim.co", sub: "For account & technical issues" },
            { icon: MapPin, title: "Location", detail: "San Francisco, CA", sub: "Remote-first team" },
          ].map((item, i) => (
            <motion.div key={item.title} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.05 }}>
              <Card className="h-full text-center">
                <CardContent className="p-6">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-foreground/80">{item.detail}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">{item.sub}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          {sent ? (
            <Card>
              <CardContent className="p-10 text-center">
                <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                <h2 className="text-lg font-semibold text-foreground mb-2">Message sent!</h2>
                <p className="text-sm text-muted-foreground mb-4">Thanks for reaching out. We'll get back to you shortly.</p>
                <Button variant="outline" onClick={() => { setSent(false); setName(""); setEmail(""); setSubject(""); setCompany(""); setTeamSize(""); setMessage(""); }}>
                  Send another message
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-serif font-bold text-foreground mb-4">Send us a message</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={255}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="you@email.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Interested Use Case</label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value="">Select a use case…</option>
                      <option value="hiring">Hiring</option>
                      <option value="onboarding">Onboarding</option>
                      <option value="learning-development">Learning & Development</option>
                      <option value="performance-assessment">Performance Assessment</option>
                      <option value="project-staffing">Project Staffing</option>
                      <option value="other">Other (specify in message)</option>
                    </select>
                  </div>

                  {/* Show company/team-size fields for enterprise/partnership inquiries */}
                  {isOrgInquiry && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">
                            <Building2 className="inline h-3.5 w-3.5 mr-1 -mt-0.5" />
                            Company
                          </label>
                          <input
                            type="text"
                            value={company}
                            onChange={(e) => setCompany(e.target.value)}
                            maxLength={100}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Acme Inc."
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-foreground mb-1 block">Team size</label>
                          <select
                            value={teamSize}
                            onChange={(e) => setTeamSize(e.target.value)}
                            className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                          >
                            <option value="">Select…</option>
                            <option value="1-10">1–10</option>
                            <option value="11-50">11–50</option>
                            <option value="51-200">51–200</option>
                            <option value="201-1000">201–1,000</option>
                            <option value="1000+">1,000+</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Message *</label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      maxLength={2000}
                      rows={5}
                      className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                      placeholder="How can we help?"
                    />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={sending}>
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    {sending ? "Sending…" : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Book a Meeting */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="overflow-hidden h-full">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-accent">
                  <Calendar className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-serif font-bold text-foreground">Book a Meeting</h2>
                  <p className="text-xs text-muted-foreground">Schedule a 30-minute call with our team</p>
                </div>
              </div>
              <iframe
                src="https://calendly.com/jacksonlam?hide_gdpr_banner=1&background_color=0a0a0a&text_color=fafafa&primary_color=6366f1"
                className="w-full border-0 rounded-lg"
                style={{ minHeight: 580 }}
                title="Book a meeting"
              />
            </CardContent>
          </Card>
        </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
