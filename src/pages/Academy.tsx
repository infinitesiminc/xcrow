import { useNavigate } from "react-router-dom";
import CompanyExplorer from "@/components/academy/CompanyExplorer";

export default function Academy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">GTM Academy</h1>
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to Lead Hunter
          </button>
        </div>
      </div>
      <CompanyExplorer />
    </div>
  );
}
