import { useState } from "react";
import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Target, Mail, Bot, ArrowRight, Check, Globe, Phone, Loader2, ExternalLink, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const FEATURES = [
  { icon: Globe, title: "Paste Your Website", desc: "We scrape your site to understand your product, market, and ideal customer profile." },
  { icon: Bot, title: "AI Lead Discovery", desc: "Our agents search the web and find 5 high-fit prospects matching your ICP." },
  { icon: Target, title: "Contact Details", desc: "Get social profiles, emails, and phone numbers — ready to reach out." },
  { icon: Send, title: "Delivered to WhatsApp", desc: "Leads are sent directly to your WhatsApp — no login, no dashboard." },
];

interface Lead {
  name: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  linkedin?: string;
  twitter?: string;
}

export default function Leadgen() {
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [step, setStep] = useState<"input" | "processing" | "done">("input");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/[^0-9+]/g, "");
    return digits.startsWith("+") ? digits : `+${digits}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !website.trim()) return;

    const formattedPhone = formatPhone(phone);
    if (formattedPhone.length < 10) {
      toast.error("Please enter a valid phone number with country code");
      return;
    }

    setLoading(true);
    setStep("processing");

    try {
      const { data, error } = await supabase.functions.invoke("leadgen-scout", {
        body: { website: website.trim(), phone: formattedPhone },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to find leads");

      const foundLeads: Lead[] = data.leads || [];
      setLeads(foundLeads);
      setStep("done");

      // Build WhatsApp message
      const msg = buildWhatsAppMessage(foundLeads, website.trim());
      const waUrl = `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodeURIComponent(msg)}`;
      window.open(waUrl, "_blank");

      toast.success(`${foundLeads.length} leads found and sent to WhatsApp!`);
    } catch (err: any) {
      console.error("Leadgen error:", err);
      toast.error(err.message || "Something went wrong");
      setStep("input");
    } finally {
      setLoading(false);
    }
  };

  const buildWhatsAppMessage = (leads: Lead[], site: string) => {
    let msg = `🎯 *Xcrow Scout — Leads for ${site}*\n\n`;
    leads.forEach((l, i) => {
      msg += `*${i + 1}. ${l.name}*`;
      if (l.title) msg += ` — ${l.title}`;
      if (l.company) msg += ` @ ${l.company}`;
      msg += "\n";
      if (l.email) msg += `📧 ${l.email}\n`;
      if (l.phone) msg += `📱 ${l.phone}\n`;
      if (l.linkedin) msg += `🔗 ${l.linkedin}\n`;
      if (l.twitter) msg += `🐦 ${l.twitter}\n`;
      msg += "\n";
    });
    msg += "_Powered by Xcrow Scout_";
    return msg;
  };

  const resendToWhatsApp = () => {
    const formattedPhone = formatPhone(phone);
    const msg = buildWhatsAppMessage(leads, website.trim());
    const waUrl = `https://wa.me/${formattedPhone.replace("+", "")}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, "_blank");
  };

  return (
    <>
      <Helmet>
        <title>Xcrow Scout — AI Lead Gen via WhatsApp</title>
        <meta name="description" content="Paste your website, get 5 qualified leads delivered to your WhatsApp. No login required." />
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-background pt-20">
        {/* Hero */}
        <div className="max-w-3xl mx-auto px-4 pt-12 pb-16 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Badge variant="outline" className="mb-4 text-xs border-primary/30 text-primary">
              Free — 5 Leads Instantly
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold font-cinzel text-foreground mb-4 leading-tight">
              Paste your website,<br />get leads on WhatsApp
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Our AI scrapes your site, understands your ideal customer,
              and delivers 5 qualified prospects straight to your WhatsApp — in under 60 seconds.
            </p>

            <AnimatePresence mode="wait">
              {step === "input" && (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="max-w-md mx-auto space-y-3"
                >
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+1 626 123 4567"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        required
                        className="pl-9 bg-muted/20 border-border/40"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="url"
                        placeholder="https://yourcompany.com"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        required
                        className="pl-9 bg-muted/20 border-border/40"
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full gap-1.5">
                    Find My Leads <ArrowRight className="w-4 h-4" />
                  </Button>
                  <p className="text-[11px] text-muted-foreground/60">
                    No signup required. We don't store your number.
                  </p>
                </motion.form>
              )}

              {step === "processing" && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="max-w-md mx-auto"
                >
                  <Card className="bg-card/60 border-primary/20">
                    <CardContent className="p-8 flex flex-col items-center gap-4">
                      <Loader2 className="w-10 h-10 text-primary animate-spin" />
                      <div>
                        <p className="font-semibold text-foreground">Scouting leads…</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          Scraping your website → Analyzing ICP → Searching prospects
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {step === "done" && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="max-w-lg mx-auto space-y-4"
                >
                  <div className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary/10 border border-primary/30 text-primary font-medium">
                    <Check className="w-5 h-5" /> {leads.length} leads sent to your WhatsApp
                  </div>

                  <div className="space-y-2 text-left">
                    {leads.map((l, i) => (
                      <Card key={i} className="bg-card/40 border-border/30">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-foreground text-sm">{l.name}</p>
                              {(l.title || l.company) && (
                                <p className="text-xs text-muted-foreground">
                                  {l.title}{l.title && l.company ? " @ " : ""}{l.company}
                                </p>
                              )}
                            </div>
                            <div className="flex gap-1.5 shrink-0">
                              {l.linkedin && (
                                <a href={l.linkedin} target="_blank" rel="noopener" className="text-muted-foreground hover:text-primary transition-colors">
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-3 mt-2 flex-wrap">
                            {l.email && <span className="text-xs text-muted-foreground">📧 {l.email}</span>}
                            {l.phone && <span className="text-xs text-muted-foreground">📱 {l.phone}</span>}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  <div className="flex gap-2 justify-center pt-2">
                    <Button variant="outline" size="sm" onClick={resendToWhatsApp} className="gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Resend to WhatsApp
                    </Button>
                    <Button size="sm" onClick={() => { setStep("input"); setLeads([]); }} className="gap-1.5">
                      Scout Again <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
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
