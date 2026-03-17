import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="border-t border-border/30 bg-card/30 mt-auto">
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-display font-bold neon-text">Infinite Sim</Link>
          <nav className="flex items-center gap-3 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-foreground transition-colors">Explore</Link>
            <Link to="/practice" className="hover:text-foreground transition-colors">Practice</Link>
          </nav>
        </div>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} InfiniteSim · AI career prep for everyone 🚀</p>
      </div>
    </div>
  </footer>
);

export default Footer;
