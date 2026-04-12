import { useParams, Navigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SEOHead from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle } from "lucide-react";

interface ComparisonRow {
  feature: string;
  xcrow: string | boolean;
  competitor: string | boolean;
}

interface ComparisonData {
  title: string;
  slug: string;
  competitorName: string;
  headline: string;
  description: string;
  summary: string;
  rows: ComparisonRow[];
}

const COMPARISONS: Record<string, ComparisonData> = {
  apollo: {
    title: "Xcrow vs Apollo",
    slug: "apollo",
    competitorName: "Apollo.io",
    headline: "Apollo Is Built for Sales Teams. You Don't Have One.",
    description: "See how Xcrow compares to Apollo.io for startup founders who need leads without the complexity of enterprise sales tools.",
    summary: "Apollo gives you 240M contacts and 15+ filters — then expects you to know what to do. Xcrow gives you outreach-ready leads from a single URL.",
    rows: [
      { feature: "Setup time", xcrow: "10 seconds", competitor: "Hours of filter configuration" },
      { feature: "Sales expertise required", xcrow: false, competitor: true },
      { feature: "AI-drafted outreach", xcrow: true, competitor: false },
      { feature: "Lead scoring", xcrow: true, competitor: "Manual filters only" },
      { feature: "ICP auto-discovery", xcrow: true, competitor: false },
      { feature: "Price", xcrow: "$49/mo", competitor: "$99/mo" },
      { feature: "Leads with verified emails", xcrow: "500/mo", competitor: "Pay per credit" },
    ],
  },
  clay: {
    title: "Xcrow vs Clay",
    slug: "clay",
    competitorName: "Clay",
    headline: "Clay Is Powerful. But You Need an Ops Team to Use It.",
    description: "Clay is amazing for RevOps teams. But if you're a founder doing sales yourself, Xcrow gets you leads in 10 seconds — no waterfall enrichment required.",
    summary: "Clay requires building complex enrichment workflows. Xcrow handles discovery, enrichment, and outreach in one step.",
    rows: [
      { feature: "Setup time", xcrow: "10 seconds", competitor: "Hours of workflow building" },
      { feature: "Technical skill required", xcrow: false, competitor: "High — needs RevOps knowledge" },
      { feature: "AI-drafted outreach", xcrow: true, competitor: "With custom workflows" },
      { feature: "Built-in lead discovery", xcrow: true, competitor: "Requires data sources" },
      { feature: "ICP auto-discovery", xcrow: true, competitor: false },
      { feature: "Price", xcrow: "$49/mo", competitor: "$134+/mo" },
      { feature: "Time to first lead", xcrow: "10 seconds", competitor: "30+ minutes" },
    ],
  },
  zoominfo: {
    title: "Xcrow vs ZoomInfo",
    slug: "zoominfo",
    competitorName: "ZoomInfo",
    headline: "ZoomInfo Costs $15K/yr. You Have a $49 Alternative.",
    description: "ZoomInfo is built for enterprise sales teams with $15K+ budgets. Xcrow gives startup founders the same leads for $49/mo.",
    summary: "ZoomInfo requires an annual contract, sales demo, and enterprise budget. Xcrow starts free and gives you leads in 10 seconds.",
    rows: [
      { feature: "Price", xcrow: "$49/mo", competitor: "$15,000+/yr" },
      { feature: "Contract", xcrow: "Month-to-month", competitor: "Annual commitment" },
      { feature: "Setup", xcrow: "Paste a URL", competitor: "Sales demo + onboarding" },
      { feature: "AI-drafted outreach", xcrow: true, competitor: false },
      { feature: "ICP auto-discovery", xcrow: true, competitor: false },
      { feature: "Ideal for", xcrow: "Founders & small teams", competitor: "Enterprise sales orgs" },
      { feature: "Free tier", xcrow: true, competitor: false },
    ],
  },
  "linkedin-sales-navigator": {
    title: "Xcrow vs LinkedIn Sales Navigator",
    slug: "linkedin-sales-navigator",
    competitorName: "LinkedIn Sales Navigator",
    headline: "You Don't Have Time for LinkedIn. You Have a Product to Ship.",
    description: "LinkedIn Sales Navigator costs $120/mo for 50 InMails. Xcrow gives you 500 leads with real email addresses for $49/mo.",
    summary: "LinkedIn charges $2.40 per InMail that might get ignored. Xcrow gives you direct email addresses you own forever.",
    rows: [
      { feature: "Price", xcrow: "$49/mo", competitor: "$120+/mo" },
      { feature: "Contacts per month", xcrow: "500 with emails", competitor: "50 InMails" },
      { feature: "Real email addresses", xcrow: true, competitor: false },
      { feature: "AI-drafted outreach", xcrow: true, competitor: false },
      { feature: "Data ownership", xcrow: "You own your leads", competitor: "LinkedIn owns the data" },
      { feature: "ICP auto-discovery", xcrow: true, competitor: false },
      { feature: "Time per lead", xcrow: "~1 second", competitor: "5-10 minutes manual" },
    ],
  },
};

function CellValue({ value }: { value: string | boolean }) {
  if (value === true) return <CheckCircle2 className="w-5 h-5 text-primary" />;
  if (value === false) return <XCircle className="w-5 h-5 text-destructive/60" />;
  return <span>{value}</span>;
}

export default function Comparison() {
  const { slug } = useParams<{ slug: string }>();
  const { user, openAuthModal } = useAuth();
  const navigate = useNavigate();

  const data = slug ? COMPARISONS[slug] : null;
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
        path={`/vs/${data.slug}`}
      />
      <Navbar />
      <main className="min-h-[70vh] bg-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-20">
          <p className="text-primary text-sm font-semibold tracking-[0.15em] uppercase mb-4">Comparison</p>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-foreground tracking-tight mb-6">
            {data.headline}
          </h1>
          <p className="text-lg text-muted-foreground mb-10 leading-relaxed">
            {data.summary}
          </p>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-6 py-4 text-muted-foreground font-medium">Feature</th>
                  <th className="text-center px-6 py-4 text-primary font-bold">Xcrow</th>
                  <th className="text-center px-6 py-4 text-muted-foreground font-medium">{data.competitorName}</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row, i) => (
                  <tr key={row.feature} className={i % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                    <td className="px-6 py-4 font-medium text-foreground">{row.feature}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <CellValue value={row.xcrow} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-muted-foreground">
                      <div className="flex justify-center">
                        <CellValue value={row.competitor} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
