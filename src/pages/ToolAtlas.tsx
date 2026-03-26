/**
 * ToolAtlas — Full-page Tool Atlas with the interactive node map.
 */
import ToolAtlasMap from "@/components/territory/ToolAtlasMap";
import SEOHead from "@/components/SEOHead";

export default function ToolAtlas() {
  return (
    <>
      <SEOHead
        title="Tool Atlas — AI Tool Ecosystem Map | Xcrow"
        description="Explore 70+ AI tools across 15 categories. Build your stack, practice with hands-on tools, and master the agentic AI ecosystem."
        path="/tools"
      />
      <div className="h-[calc(100vh-64px)]">
        <ToolAtlasMap />
      </div>
    </>
  );
}
