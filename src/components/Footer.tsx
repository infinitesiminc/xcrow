import { forwardRef } from "react";
import { Link } from "react-router-dom";

const PRODUCT = [
  { label: "Lead Gen", to: "/leadgen" },
  { label: "How It Works", to: "/how-it-works" },
  { label: "Pricing", to: "/pricing" },
  { label: "Blog", to: "/blog" },
  { label: "Demo", to: "/demo" },
];

const USE_CASES = [
  { label: "SaaS", to: "/use-cases/saas" },
  { label: "Agencies", to: "/use-cases/agencies" },
  { label: "Recruiting", to: "/use-cases/recruiting" },
  { label: "Consulting", to: "/use-cases/consulting" },
  { label: "E-commerce", to: "/use-cases/ecommerce" },
];

const COMPARE = [
  { label: "vs Apollo", to: "/vs/apollo" },
  { label: "vs Clay", to: "/vs/clay" },
  { label: "vs ZoomInfo", to: "/vs/zoominfo" },
  { label: "vs LinkedIn", to: "/vs/linkedin" },
];

const LEGAL = [
  { label: "Privacy", to: "/privacy" },
  { label: "Terms", to: "/terms" },
  { label: "Cookies", to: "/cookies" },
  
  { label: "About", to: "/about" },
];

const ColHeader = ({ children }: { children: string }) => (
  <p className="text-xs font-bold text-foreground uppercase tracking-[0.1em] mb-3">{children}</p>
);

const ColLink = ({ to, children }: { to: string; children: string }) => (
  <Link to={to} className="block text-sm text-muted-foreground hover:text-foreground transition-colors py-0.5">
    {children}
  </Link>
);

const Footer = forwardRef<HTMLElement>((_, ref) => (
  <footer ref={ref} className="mt-auto bg-background border-t border-border">
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
        <div>
          <ColHeader>Product</ColHeader>
          {PRODUCT.map((l) => <ColLink key={l.to} to={l.to}>{l.label}</ColLink>)}
        </div>
        <div>
          <ColHeader>Use Cases</ColHeader>
          {USE_CASES.map((l) => <ColLink key={l.to} to={l.to}>{l.label}</ColLink>)}
        </div>
        <div>
          <ColHeader>Compare</ColHeader>
          {COMPARE.map((l) => <ColLink key={l.to} to={l.to}>{l.label}</ColLink>)}
        </div>
        <div>
          <ColHeader>Company</ColHeader>
          {LEGAL.map((l) => <ColLink key={l.to} to={l.to}>{l.label}</ColLink>)}
        </div>
      </div>
      <div className="border-t border-border pt-6 flex flex-col sm:flex-row items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Xcrow. All rights reserved.</p>
        <p className="text-xs text-muted-foreground">The #1 Outbound Lead Gen</p>
      </div>
    </div>
  </footer>
));

Footer.displayName = "Footer";
export default Footer;
