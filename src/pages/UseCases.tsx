import { useParams, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";

interface UseCaseData {
  title: string;
  slug: string;
  headline: string;
  description: string;
  pain: string;
  solution: string;
  benefits: string[];
}

const USE_CASES: Record<string, UseCaseData> = {
  saas: {
    title: "Xcrow for SaaS Companies",
    slug: "saas",
    headline: "Find Your Next 100 SaaS Customers",
    description: "Xcrow helps SaaS founders discover companies that match their ICP and generates outreach-ready leads with verified emails.",
    pain: "You've built an amazing product but you're spending hours on LinkedIn trying to find the right buyers. Your free trial signups are slow and you can't afford a sales team yet.",
    solution: "Paste your website and Xcrow maps your ideal customer profile, discovers matching companies, and delivers decision-makers with verified emails — ready to pitch.",
    benefits: [
      "Auto-detect your ICP from your website",
      "Find SaaS buyers by tech stack, company size, and funding stage",
      "AI-drafted cold emails tailored to each prospect",
      "Export leads to your CRM or email tool",
      "Go from 0 to pipeline in under 60 seconds",
    ],
  },
  agencies: {
    title: "Xcrow for Agencies",
    slug: "agencies",
    headline: "Win More Agency Clients Without Cold Calling",
    description: "Stop waiting for referrals. Xcrow finds companies that need your agency's services and gives you the decision-maker's email.",
    pain: "You rely on referrals and inbound for new clients. When a big client churns, you scramble. You've tried LinkedIn outreach but it takes hours and the response rate is terrible.",
    solution: "Paste your agency website. Xcrow analyzes your services, identifies companies that need them, and delivers contact-ready leads — no manual prospecting required.",
    benefits: [
      "Discover companies actively needing your services",
      "Target by industry vertical, company size, or geography",
      "Personalized outreach emails that mention their specific pain points",
      "Build a repeatable pipeline instead of relying on referrals",
      "Win 2-3 new clients per month for $49",
    ],
  },
  recruiting: {
    title: "Xcrow for Recruiters",
    slug: "recruiting",
    headline: "Source Hiring Managers, Not Just Candidates",
    description: "Xcrow flips recruiting lead gen. Find companies that are hiring and reach the decision-makers who approve vendor budgets.",
    pain: "You're great at finding candidates but terrible at finding clients. You spend all day on LinkedIn and still can't get meetings with hiring managers.",
    solution: "Paste any company's careers page. Xcrow identifies who controls the recruiting budget and gives you their email — so you can pitch before they post on LinkedIn.",
    benefits: [
      "Find companies with open roles in your niche",
      "Get direct emails for hiring managers and HR leaders",
      "AI writes personalized recruiting partnership pitches",
      "Track outreach status across your entire pipeline",
      "Land retainer clients faster than any job board",
    ],
  },
  consulting: {
    title: "Xcrow for Consultants",
    slug: "consulting",
    headline: "Fill Your Consulting Pipeline on Autopilot",
    description: "Stop networking for leads. Xcrow finds companies that need your expertise and gives you direct access to decision-makers.",
    pain: "Your consulting practice lives and dies by your network. When referrals dry up, revenue drops. You've tried outbound but don't have a sales background.",
    solution: "Paste your consulting website. Xcrow identifies companies in your sweet spot, scores them by fit, and drafts outreach emails you can send in one click.",
    benefits: [
      "Discover companies that match your consulting niche",
      "Reach C-suite and VP-level decision-makers directly",
      "AI-drafted emails that position you as the expert",
      "No sales experience required — the AI does the heavy lifting",
      "Predictable pipeline for $49/mo instead of $5,000 conference tickets",
    ],
  },
  ecommerce: {
    title: "Xcrow for E-Commerce",
    slug: "ecommerce",
    headline: "Find Wholesale & Partnership Leads Instantly",
    description: "Xcrow helps e-commerce brands find wholesale buyers, retail partners, and B2B distribution contacts with verified emails.",
    pain: "You're selling D2C but want to break into wholesale and retail partnerships. Trade shows are expensive and cold-emailing buyers from Google searches gets you nowhere.",
    solution: "Paste your brand website. Xcrow finds retailers, distributors, and wholesale buyers in your category — with decision-maker emails and AI-drafted partnership pitches.",
    benefits: [
      "Find retail buyers and distributors in your product category",
      "Get direct emails for purchasing managers and category buyers",
      "AI writes partnership pitches tailored to each retailer",
      "Expand from D2C to B2B distribution without a sales team",
      "10× cheaper than a single trade show booth",
    ],
  },
};

export default function UseCases() {
  const { slug } = useParams<{ slug: string }>();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const data = slug ? USE_CASES[slug] : null;
  if (!data) return <Navigate to="/" replace />;

  const handleCta = () => {
    if (user) navigate("/leadgen");
    else openAuthModal();
  };

  return (
    <>
      <SEOHead
        title={data.title}
        description={data.description}
        path={`/use-cases/${data.slug}`}
      />
      <Navbar />
      <main className="min-h-[70vh] bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">Use Case</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            {data.headline}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {data.description}
          </p>

          <div className="space-y-10">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">The Problem</h2>
              <p className="text-muted-foreground leading-relaxed">{data.pain}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">How Xcrow Solves It</h2>
              <p className="text-muted-foreground leading-relaxed">{data.solution}</p>
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground mb-3">What You Get</h2>
              <ul className="space-y-3">
                {data.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2 text-foreground">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-14 text-center">
            <Button size="lg" className="h-14 px-10 font-bold rounded-xl" onClick={handleCta}>
              Try Xcrow Free →
            </Button>
            <p className="text-sm text-muted-foreground mt-3">No credit card required</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
