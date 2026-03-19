import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 bg-card/30 mt-auto">
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <Link to="/" className="font-display font-bold neon-text">crowy.ai</Link>
          <p className="text-xs text-muted-foreground mt-1">AI career prep for everyone 🚀</p>
        </div>
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Product</span>
            <Link to="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Explore Roles</Link>
            <Link to="/students" className="text-sm text-muted-foreground hover:text-foreground transition-colors">For Students</Link>
            <Link to="/schools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">For Schools</Link>
            <Link to="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground uppercase tracking-wider">Company</span>
            <Link to="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 border-t border-border/20">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} crowy.ai</p>
      </div>
    </div>
  </footer>
);

export default Footer;
