import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useCases } from "@/data/use-cases";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";

export default function UseCasesIndex() {
  return (
    <>
      <Helmet>
        <title>Use Cases | AI-Powered B2B Lead Generation by Industry</title>
        <meta name="description" content="Explore how Xcrow helps B2B teams generate leads across logistics, SaaS, healthcare, fintech, manufacturing, and more with AI-powered ICP mapping." />
        <link rel="canonical" href="https://xcrow.lovable.app/use-cases" />
      </Helmet>
      <Navbar />
      <main className="min-h-screen bg-background">
        <section className="max-w-5xl mx-auto px-6 py-16 space-y-10">
          <div className="text-center space-y-3">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
              AI Lead Generation by Industry
            </h1>
            <p className="text-base text-muted-foreground max-w-xl mx-auto">
              See how teams in every B2B vertical use Xcrow to map their ICP and generate qualified leads.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {useCases.map((uc) => (
              <Link
                key={uc.slug}
                to={`/use-cases/${uc.slug}`}
                className="group p-5 rounded-xl border border-border/40 hover:border-primary/30 bg-card/60 hover:bg-card transition-all"
              >
                <Badge variant="outline" className="text-[10px] mb-3">{uc.vertical}</Badge>
                <h2 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors mb-2">
                  {uc.title}
                </h2>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2 mb-3">
                  {uc.metaDescription}
                </p>
                <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Learn more <ArrowRight className="w-3 h-3" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
