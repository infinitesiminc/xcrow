import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/50 bg-card/50 mt-auto">
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Product</h4>
          <ul className="space-y-2">
            <li><Link to="/why-simulation" className="text-sm text-foreground/70 hover:text-foreground transition-colors">How It Works</Link></li>
            <li><Link to="/case-study/anthropic" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Case Study</Link></li>
            <li><Link to="/pricing" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/contact" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Contact</Link></li>
            <li><Link to="/contact" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Book a Demo</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 pt-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} InfiniteSim, Inc. All rights reserved.</p>
        <p className="text-[10px] text-muted-foreground/60">AI-powered career intelligence</p>
      </div>
    </div>
  </footer>
);

export default Footer;
