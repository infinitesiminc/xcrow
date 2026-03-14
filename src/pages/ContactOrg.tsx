import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Building2, Calendar, Send, Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const ContactOrg = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [teamSize, setTeamSize] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !company.trim()) return;
    setSending(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { error } = await supabase.functions.invoke("send-contact-email", {
        body: { name, email, company, teamSize, message, formType: "org" },
      });
      if (error) throw error;
      setSent(true);
      toast({ title: "Request received", description: "We'll be in touch within 24 hours." });
    } catch (err) {
      console.error("Contact org form error:", err);
      toast({ title: "Failed to send", description: "Please try again or email us directly.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-8 -ml-2 text-muted-foreground h-7 text-xs">
          <ArrowLeft className="w-3 h-3 mr-1" /> Back
        </Button>

        <div className="grid lg:grid-cols-2 gap-10">
          {/* Left: Contact Form */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Get started for your team</h1>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-[52px]">
              Team and enterprise features are available by request. Fill out the form or book a call.
            </p>

            {sent ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
                  <h2 className="text-lg font-semibold text-foreground mb-2">We got your request!</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    Expect to hear from us within 24 hours. In the meantime, you can analyze individual roles for free.
                  </p>
                  <Button onClick={() => navigate("/")} className="gap-2">
                    Analyze a Role
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Your name *</label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        maxLength={100}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Work email *</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        maxLength={255}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                        placeholder="jane@company.com"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">Company *</label>
                      <input
                        type="text"
                        value={company}
                        onChange={(e) => setCompany(e.target.value)}
                        required
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
                    <div>
                      <label className="text-sm font-medium text-foreground mb-1 block">How can we help?</label>
                      <textarea
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring resize-y"
                        placeholder="Tell us about your workforce planning needs…"
                      />
                    </div>
                    <Button type="submit" className="w-full gap-2" disabled={sending}>
                      {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      {sending ? "Sending…" : "Send Request"}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Right: Calendly */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h2 className="text-2xl font-serif font-bold text-foreground">Or book a call</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-6 ml-[52px]">
              Schedule a 30-minute walkthrough with our team.
            </p>
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <iframe
                  src="https://calendly.com/jacksonlam?hide_gdpr_banner=1&background_color=0a0a0a&text_color=fafafa&primary_color=6366f1"
                  className="w-full border-0"
                  style={{ minHeight: 660 }}
                  title="Book a call"
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default ContactOrg;
