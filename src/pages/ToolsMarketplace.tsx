import { useSearchParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Search, Wrench, Heart, Sparkles, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useState, useMemo } from "react";

interface Tool {
  name: string;
  category: "ai_tools" | "human_skills" | "new_capabilities";
  description: string;
  vendor: string;
  url: string;
  tags: string[];
  pricing?: string;
}

const TOOLS_DIRECTORY: Tool[] = [
  // AI Tools & Platforms
  { name: "ChatGPT Enterprise", category: "ai_tools", description: "AI assistant for drafting, analysis, coding, and creative tasks across all roles.", vendor: "OpenAI", url: "https://openai.com/enterprise", tags: ["AI Assistant", "Productivity", "Writing"], pricing: "Per seat" },
  { name: "Microsoft Copilot", category: "ai_tools", description: "AI integrated into Microsoft 365 for document creation, data analysis, and email.", vendor: "Microsoft", url: "https://copilot.microsoft.com", tags: ["Productivity", "Office Suite", "AI Assistant"], pricing: "Per seat" },
  { name: "Notion AI", category: "ai_tools", description: "AI-powered workspace for notes, docs, project management, and knowledge bases.", vendor: "Notion", url: "https://notion.so/product/ai", tags: ["Productivity", "Project Management", "Knowledge Base"], pricing: "Add-on" },
  { name: "Jasper", category: "ai_tools", description: "AI content generation platform for marketing copy, blog posts, and brand voice.", vendor: "Jasper AI", url: "https://jasper.ai", tags: ["Content", "Marketing", "Writing"], pricing: "Tiered" },
  { name: "Midjourney", category: "ai_tools", description: "AI image generation for creative design, marketing visuals, and concept art.", vendor: "Midjourney", url: "https://midjourney.com", tags: ["Design", "Creative", "Image Generation"], pricing: "Subscription" },
  { name: "GitHub Copilot", category: "ai_tools", description: "AI pair programmer that suggests code completions and generates functions.", vendor: "GitHub", url: "https://github.com/features/copilot", tags: ["Development", "Coding", "Productivity"], pricing: "Per seat" },
  { name: "Salesforce Einstein", category: "ai_tools", description: "AI-powered CRM analytics, lead scoring, and customer insight automation.", vendor: "Salesforce", url: "https://www.salesforce.com/einstein", tags: ["CRM", "Sales", "Analytics"], pricing: "Enterprise" },
  { name: "HubSpot AI", category: "ai_tools", description: "AI tools for marketing automation, content creation, and customer engagement.", vendor: "HubSpot", url: "https://www.hubspot.com/artificial-intelligence", tags: ["Marketing", "CRM", "Automation"], pricing: "Tiered" },
  { name: "Tableau AI", category: "ai_tools", description: "AI-enhanced data visualization and business intelligence platform.", vendor: "Salesforce", url: "https://www.tableau.com/products/ai-analytics", tags: ["Analytics", "Data Viz", "BI"], pricing: "Per user" },
  { name: "Grammarly Business", category: "ai_tools", description: "AI writing assistant for professional communication across teams.", vendor: "Grammarly", url: "https://www.grammarly.com/business", tags: ["Writing", "Communication", "Productivity"], pricing: "Per seat" },
  { name: "Fireflies.ai", category: "ai_tools", description: "AI meeting assistant that transcribes, summarizes, and tracks action items.", vendor: "Fireflies", url: "https://fireflies.ai", tags: ["Meetings", "Transcription", "Productivity"], pricing: "Freemium" },
  { name: "Synthesia", category: "ai_tools", description: "AI video generation platform for training, marketing, and internal comms.", vendor: "Synthesia", url: "https://www.synthesia.io", tags: ["Video", "Training", "Content"], pricing: "Per video" },

  // Human-Edge Skills
  { name: "Coursera for Business", category: "human_skills", description: "Leadership, negotiation, and strategic thinking courses from top universities.", vendor: "Coursera", url: "https://www.coursera.org/business", tags: ["Leadership", "Strategy", "Learning"], pricing: "Per seat" },
  { name: "LinkedIn Learning", category: "human_skills", description: "Professional development courses for communication, management, and creativity.", vendor: "LinkedIn", url: "https://www.linkedin.com/learning", tags: ["Professional Dev", "Soft Skills", "Management"], pricing: "Subscription" },
  { name: "MasterClass for Business", category: "human_skills", description: "Expert-led classes on leadership, negotiation, and creative thinking.", vendor: "MasterClass", url: "https://www.masterclass.com/business", tags: ["Leadership", "Creativity", "Communication"], pricing: "Per seat" },
  { name: "BetterUp", category: "human_skills", description: "AI-powered coaching platform for leadership development and resilience.", vendor: "BetterUp", url: "https://www.betterup.com", tags: ["Coaching", "Leadership", "Wellbeing"], pricing: "Enterprise" },
  { name: "Hone", category: "human_skills", description: "Live, small-group management training for modern people leaders.", vendor: "Hone", url: "https://www.honehq.com", tags: ["Management", "Training", "Leadership"], pricing: "Per seat" },

  // New Capabilities
  { name: "DataCamp", category: "new_capabilities", description: "Learn data science, AI, and analytics skills with hands-on exercises.", vendor: "DataCamp", url: "https://www.datacamp.com", tags: ["Data Science", "Analytics", "AI/ML"], pricing: "Subscription" },
  { name: "Codecademy Pro", category: "new_capabilities", description: "Interactive coding and tech skills courses for career transitions.", vendor: "Codecademy", url: "https://www.codecademy.com/pro", tags: ["Coding", "Tech Skills", "Career"], pricing: "Subscription" },
  { name: "Zapier", category: "new_capabilities", description: "No-code automation platform connecting 6,000+ apps for workflow optimization.", vendor: "Zapier", url: "https://zapier.com", tags: ["Automation", "No-Code", "Workflow"], pricing: "Freemium" },
  { name: "Make (Integromat)", category: "new_capabilities", description: "Visual automation platform for complex multi-step workflows.", vendor: "Make", url: "https://www.make.com", tags: ["Automation", "Integration", "No-Code"], pricing: "Freemium" },
  { name: "Replit", category: "new_capabilities", description: "AI-powered coding environment for building and deploying applications.", vendor: "Replit", url: "https://replit.com", tags: ["Development", "AI Coding", "Deployment"], pricing: "Freemium" },
  { name: "Deeplearning.AI", category: "new_capabilities", description: "AI and machine learning courses by Andrew Ng for practitioners.", vendor: "Deeplearning.AI", url: "https://www.deeplearning.ai", tags: ["AI/ML", "Deep Learning", "Certification"], pricing: "Free / Paid" },
];

const categoryConfig = {
  ai_tools: { label: "AI Tools & Platforms", icon: Wrench, dotColor: "bg-dot-blue" },
  human_skills: { label: "Human-Edge Skills", icon: Heart, dotColor: "bg-dot-teal" },
  new_capabilities: { label: "New Capabilities", icon: Sparkles, dotColor: "bg-dot-purple" },
};

export default function ToolsMarketplace() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const highlightTool = searchParams.get("tool");
  const fromRole = searchParams.get("role");
  const filterCat = searchParams.get("category") as keyof typeof categoryConfig | null;
  const [search, setSearch] = useState(highlightTool || "");
  const [activeCategory, setActiveCategory] = useState<string | null>(filterCat);

  const filtered = useMemo(() => {
    let tools = TOOLS_DIRECTORY;
    if (activeCategory) tools = tools.filter(t => t.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      tools = tools.filter(t =>
        t.name.toLowerCase().includes(q) ||
        t.vendor.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q)) ||
        t.description.toLowerCase().includes(q)
      );
    }
    return tools;
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ArrowLeft className="h-4 w-4 text-muted-foreground" />
            </button>
            <div>
              <h1 className="text-2xl font-serif font-bold text-foreground">Tool Marketplace</h1>
              {fromRole && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Recommended for: <span className="text-foreground font-medium">{fromRole}</span>
                </p>
              )}
            </div>
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search tools, vendors, or skills..."
                className="pl-9 h-9 text-sm"
              />
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button
              variant={activeCategory === null ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setActiveCategory(null)}
            >
              All
            </Button>
            {(Object.keys(categoryConfig) as (keyof typeof categoryConfig)[]).map(cat => {
              const cfg = categoryConfig[cat];
              const Icon = cfg.icon;
              return (
                <Button
                  key={cat}
                  variant={activeCategory === cat ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs gap-1.5"
                  onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                >
                  <span className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                  {cfg.label}
                </Button>
              );
            })}
          </div>
        </motion.div>

        {/* Results */}
        <div className="space-y-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-12">No tools found. Try a different search.</p>
          )}
          {filtered.map((tool, i) => {
            const cfg = categoryConfig[tool.category];
            const isHighlighted = highlightTool && tool.name.toLowerCase().includes(highlightTool.toLowerCase());
            return (
              <motion.div
                key={tool.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <a href={tool.url} target="_blank" rel="noopener noreferrer" className="block">
                  <Card className={`border-border/50 hover:border-border transition-colors cursor-pointer ${isHighlighted ? "ring-2 ring-primary/30" : ""}`}>
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`w-2 h-2 rounded-full ${cfg.dotColor} shrink-0`} />
                          <span className="text-sm font-semibold text-foreground">{tool.name}</span>
                          <span className="text-[10px] text-muted-foreground">by {tool.vendor}</span>
                          {tool.pricing && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 ml-auto">{tool.pricing}</Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed mb-2">{tool.description}</p>
                        <div className="flex gap-1.5 flex-wrap">
                          {tool.tags.map(tag => (
                            <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0 mt-1" />
                    </CardContent>
                  </Card>
                </a>
              </motion.div>
            );
          })}
        </div>

        <p className="text-[10px] text-muted-foreground text-center mt-8 mb-4">
          Links may include affiliate partnerships. We only recommend tools we believe add value.
        </p>
      </div>
    </div>
  );
}
