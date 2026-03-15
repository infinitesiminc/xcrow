import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/50 bg-card/50 mt-auto">
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Product</h4>
          <ul className="space-y-2">
            <li><Link to="/analyze" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Analyze a Role</Link></li>
            <li><Link to="/" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Platform</Link></li>
            <li><Link to="/how-it-works" className="text-sm text-foreground/70 hover:text-foreground transition-colors">How It Works</Link></li>
            <li><Link to="/tools" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Tool Marketplace</Link></li>
            <li><Link to="/dashboard" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Dashboard</Link></li>
            <li><Link to="/pricing" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Pricing</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Solutions</h4>
          <ul className="space-y-2">
            <li><Link to="/for-individuals" className="text-sm text-foreground/70 hover:text-foreground transition-colors">For Individuals</Link></li>
            <li><Link to="/for-organizations" className="text-sm text-foreground/70 hover:text-foreground transition-colors">For Organizations</Link></li>
            <li><Link to="/contact-org" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Contact Sales</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Account</h4>
          <ul className="space-y-2">
            <li><Link to="/auth" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Sign In</Link></li>
            <li><Link to="/settings" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Settings</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Company</h4>
          <ul className="space-y-2">
            <li><Link to="/contact" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Contact</Link></li>
            <li><Link to="/contact-org" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Enterprise</Link></li>
            <li><Link to="/pricing" className="text-sm text-foreground/70 hover:text-foreground transition-colors">Pricing</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-border/40 pt-6 flex items-center justify-between">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Infinite Simulation. All rights reserved.</p>
        <p className="text-[10px] text-muted-foreground/60">AI-powered career intelligence</p>
      </div>
    </div>
  </footer>
);

export default Footer;
