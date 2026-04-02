import { useParams, Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { getUseCaseBySlug, useCases } from "@/data/use-cases";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertTriangle, ArrowRight, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border/40 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-foreground hover:bg-muted/30 transition-colors"
      >
        {q}
        {open ? <ChevronUp className="w-4 h-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">{a}</div>}
    </div>
  );
}

export default function UseCasePage() {
  const { slug } = useParams<{ slug: string }>();
  const uc = slug ? getUseCaseBySlug(slug) : undefined;

  if (!uc) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold text-foreground">Use case not found</h1>
            <Link to="/use-cases" className="text-primary underline text-sm">Browse all use cases</Link>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: uc.metaTitle,
    description: uc.metaDescription,
    url: `https://xcrow.lovable.app/use-cases/${uc.slug}`,
    mainEntity: {
      "@type": "FAQPage",
      mainEntity: uc.faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  };

  return (
    <>
      <Helmet>
        <title>{uc.metaTitle}</title>
        <meta name="description" content={uc.metaDescription} />
        <link rel="canonical" href={`https://xcrow.lovable.app/use-cases/${uc.slug}`} />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>
      <Navbar />

      <main className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/30">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative max-w-4xl mx-auto px-6 py-20 text-center space-y-6">
            <Badge variant="outline" className="text-xs">{uc.vertical}</Badge>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight">
              {uc.heroHeadline}
            </h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {uc.heroSub}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" className="gap-2" asChild>
                <Link to="/leadgen">{uc.ctaText} <ArrowRight className="w-4 h-4" /></Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#how-it-works">See How It Works</a>
              </Button>
            </div>
          </div>
        </section>

        {/* Pain Points & Solutions */}
        <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-16">
          <div className="grid md:grid-cols-2 gap-10">
            {/* Pain */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                The Challenge
              </h2>
              <ul className="space-y-3">
                {uc.painPoints.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                    <span className="text-destructive/70 mt-0.5 shrink-0">•</span>
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            {/* Solution */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                How Xcrow Solves It
              </h2>
              <ul className="space-y-3">
                {uc.solutions.map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                    <CheckCircle2 className="w-4 h-4 text-primary/60 mt-0.5 shrink-0" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Process Steps */}
        <section className="bg-muted/20 border-y border-border/30">
          <div className="max-w-4xl mx-auto px-6 py-16 space-y-8">
            <h2 className="text-xl font-semibold text-foreground text-center">How It Works</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { step: "1", title: "Enter a website", desc: "Paste any company URL. Our AI deep-crawls their site to understand positioning." },
                { step: "2", title: "Get your ICP map", desc: "Receive a 3-layer tree: Industry Verticals → Company Segments → Buyer Personas." },
                { step: "3", title: "Generate leads", desc: "Click any node to find, enrich, and export leads matching that exact profile." },
              ].map((s) => (
                <div key={s.step} className="text-center space-y-3 p-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold text-sm flex items-center justify-center mx-auto">
                    {s.step}
                  </div>
                  <h3 className="text-sm font-semibold text-foreground">{s.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="max-w-3xl mx-auto px-6 py-16 space-y-6">
          <h2 className="text-xl font-semibold text-foreground text-center">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {uc.faq.map((f, i) => (
              <FAQItem key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="border-t border-border/30 bg-muted/10">
          <div className="max-w-3xl mx-auto px-6 py-14 text-center space-y-4">
            <h2 className="text-2xl font-bold text-foreground">Ready to find your ideal {uc.vertical} customers?</h2>
            <p className="text-sm text-muted-foreground">Start mapping your ICP in seconds — no credit card required.</p>
            <Button size="lg" className="gap-2" asChild>
              <Link to="/leadgen">{uc.ctaText} <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>
        </section>

        {/* Other Use Cases */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <h2 className="text-lg font-semibold text-foreground mb-6 text-center">Explore More Use Cases</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {useCases
              .filter((u) => u.slug !== uc.slug)
              .slice(0, 4)
              .map((u) => (
                <Link
                  key={u.slug}
                  to={`/use-cases/${u.slug}`}
                  className="p-4 rounded-lg border border-border/40 hover:border-primary/30 transition-colors group"
                >
                  <Badge variant="secondary" className="text-[10px] mb-2">{u.vertical}</Badge>
                  <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{u.title}</h3>
                </Link>
              ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
