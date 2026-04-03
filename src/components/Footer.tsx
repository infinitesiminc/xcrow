import { forwardRef } from "react";
import { Link } from "react-router-dom";

const Footer = forwardRef<HTMLElement>((_, ref) => (
  <footer
    ref={ref}
    className="mt-auto bg-background border-t border-border"
  >
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start justify-between gap-6">
        <div>
          <Link
            to="/"
            className="font-semibold text-foreground hover:opacity-80 transition-opacity text-lg"
          >
            Xcrow.ai
          </Link>
          <p className="text-xs text-muted-foreground mt-1">AI-powered ICP research & lead generation.</p>
        </div>
        <div className="flex gap-10">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Product
            </span>
            <Link to="/leadgen" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Leadgen</Link>
            <Link to="/use-cases" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Use Cases</Link>
            <Link to="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Blog</Link>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Company
            </span>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </div>
        </div>
      </div>
      <div className="mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border">
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Xcrow.ai</p>
        <div className="flex items-center gap-4">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
          <Link to="/terms" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
          <Link to="/cookies" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Cookies</Link>
        </div>
      </div>
    </div>
  </footer>
));

Footer.displayName = "Footer";

export default Footer;
