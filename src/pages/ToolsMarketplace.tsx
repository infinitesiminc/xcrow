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
  { name: "Google Gemini for Workspace", category: "ai_tools", description: "AI assistant across Gmail, Docs, Sheets, and Slides for enterprise productivity.", vendor: "Google", url: "https://workspace.google.com/solutions/ai", tags: ["Productivity", "Office Suite", "AI Assistant"], pricing: "Per seat" },
  { name: "Notion AI", category: "ai_tools", description: "AI-powered workspace for notes, docs, project management, and knowledge bases.", vendor: "Notion", url: "https://notion.so/product/ai", tags: ["Productivity", "Project Management", "Knowledge Base"], pricing: "Add-on" },
  { name: "Jasper", category: "ai_tools", description: "AI content generation platform for marketing copy, blog posts, and brand voice.", vendor: "Jasper AI", url: "https://jasper.ai", tags: ["Content", "Marketing", "Writing"], pricing: "Tiered" },
  { name: "Midjourney", category: "ai_tools", description: "AI image generation for creative design, marketing visuals, and concept art.", vendor: "Midjourney", url: "https://midjourney.com", tags: ["Design", "Creative", "Image Generation"], pricing: "Subscription" },
  { name: "GitHub Copilot", category: "ai_tools", description: "AI pair programmer that suggests code completions and generates functions.", vendor: "GitHub", url: "https://github.com/features/copilot", tags: ["Development", "Coding", "Productivity"], pricing: "Per seat" },
  { name: "Cursor", category: "ai_tools", description: "AI-first code editor with deep codebase understanding and multi-file editing.", vendor: "Cursor", url: "https://cursor.com", tags: ["Development", "Coding", "AI Editor"], pricing: "Freemium" },
  { name: "Salesforce Einstein", category: "ai_tools", description: "AI-powered CRM analytics, lead scoring, and customer insight automation.", vendor: "Salesforce", url: "https://www.salesforce.com/einstein", tags: ["CRM", "Sales", "Analytics"], pricing: "Enterprise" },
  { name: "HubSpot AI", category: "ai_tools", description: "AI tools for marketing automation, content creation, and customer engagement.", vendor: "HubSpot", url: "https://www.hubspot.com/artificial-intelligence", tags: ["Marketing", "CRM", "Automation"], pricing: "Tiered" },
  { name: "Tableau AI", category: "ai_tools", description: "AI-enhanced data visualization and business intelligence platform.", vendor: "Salesforce", url: "https://www.tableau.com/products/ai-analytics", tags: ["Analytics", "Data Viz", "BI"], pricing: "Per user" },
  { name: "Power BI Copilot", category: "ai_tools", description: "Natural language analytics and AI-powered insights in Microsoft Power BI.", vendor: "Microsoft", url: "https://powerbi.microsoft.com", tags: ["Analytics", "Data Viz", "BI"], pricing: "Per user" },
  { name: "Grammarly Business", category: "ai_tools", description: "AI writing assistant for professional communication across teams.", vendor: "Grammarly", url: "https://www.grammarly.com/business", tags: ["Writing", "Communication", "Productivity"], pricing: "Per seat" },
  { name: "Fireflies.ai", category: "ai_tools", description: "AI meeting assistant that transcribes, summarizes, and tracks action items.", vendor: "Fireflies", url: "https://fireflies.ai", tags: ["Meetings", "Transcription", "Productivity"], pricing: "Freemium" },
  { name: "Otter.ai", category: "ai_tools", description: "Real-time meeting transcription with AI summaries and action item extraction.", vendor: "Otter.ai", url: "https://otter.ai", tags: ["Meetings", "Transcription", "Collaboration"], pricing: "Freemium" },
  { name: "Synthesia", category: "ai_tools", description: "AI video generation platform for training, marketing, and internal comms.", vendor: "Synthesia", url: "https://www.synthesia.io", tags: ["Video", "Training", "Content"], pricing: "Per video" },
  { name: "Canva AI", category: "ai_tools", description: "AI-powered design platform for presentations, social media, and marketing assets.", vendor: "Canva", url: "https://www.canva.com/ai-image-generator", tags: ["Design", "Marketing", "Creative"], pricing: "Freemium" },
  { name: "Adobe Firefly", category: "ai_tools", description: "Generative AI integrated into Adobe Creative Suite for image and video creation.", vendor: "Adobe", url: "https://www.adobe.com/products/firefly.html", tags: ["Design", "Creative", "Image Generation"], pricing: "Subscription" },
  { name: "Xero AI", category: "ai_tools", description: "AI-powered accounting with automated bank reconciliation and invoice processing.", vendor: "Xero", url: "https://www.xero.com", tags: ["Accounting", "Finance", "Automation"], pricing: "Subscription" },
  { name: "QuickBooks AI", category: "ai_tools", description: "Smart bookkeeping with AI-driven categorization and cash flow forecasting.", vendor: "Intuit", url: "https://quickbooks.intuit.com", tags: ["Accounting", "Finance", "Bookkeeping"], pricing: "Subscription" },
  { name: "Harvey AI", category: "ai_tools", description: "AI assistant purpose-built for legal professionals — research, drafting, and analysis.", vendor: "Harvey", url: "https://www.harvey.ai", tags: ["Legal", "Research", "Drafting"], pricing: "Enterprise" },
  { name: "Ironclad AI", category: "ai_tools", description: "AI-powered contract lifecycle management with automated review and extraction.", vendor: "Ironclad", url: "https://ironcladapp.com", tags: ["Legal", "Contracts", "CLM"], pricing: "Enterprise" },
  { name: "Workday AI", category: "ai_tools", description: "AI for HR, finance, and planning — workforce analytics, recruiting, and payroll.", vendor: "Workday", url: "https://www.workday.com/en-us/artificial-intelligence.html", tags: ["HR", "Finance", "Workforce"], pricing: "Enterprise" },
  { name: "ServiceNow AI", category: "ai_tools", description: "AI-driven IT service management, workflow automation, and employee experience.", vendor: "ServiceNow", url: "https://www.servicenow.com/solutions/ai.html", tags: ["IT", "Operations", "Automation"], pricing: "Enterprise" },
  { name: "Figma AI", category: "ai_tools", description: "AI features in Figma for automated design generation, prototyping, and asset creation.", vendor: "Figma", url: "https://www.figma.com", tags: ["Design", "UX", "Prototyping"], pricing: "Freemium" },
  { name: "Perplexity Pro", category: "ai_tools", description: "AI-powered research and search engine with cited sources and deep analysis.", vendor: "Perplexity", url: "https://www.perplexity.ai", tags: ["Research", "Search", "Analysis"], pricing: "Subscription" },
  { name: "Gong", category: "ai_tools", description: "Revenue intelligence platform using AI to analyze sales calls and deals.", vendor: "Gong", url: "https://www.gong.io", tags: ["Sales", "Revenue", "Analytics"], pricing: "Enterprise" },
  { name: "Surfer SEO", category: "ai_tools", description: "AI-driven SEO content optimization and keyword strategy platform.", vendor: "Surfer", url: "https://surferseo.com", tags: ["SEO", "Content", "Marketing"], pricing: "Subscription" },

  // Human-Edge Skills
  { name: "Coursera for Business", category: "human_skills", description: "Leadership, negotiation, and strategic thinking courses from top universities.", vendor: "Coursera", url: "https://www.coursera.org/business", tags: ["Leadership", "Strategy", "Learning"], pricing: "Per seat" },
  { name: "LinkedIn Learning", category: "human_skills", description: "Professional development courses for communication, management, and creativity.", vendor: "LinkedIn", url: "https://www.linkedin.com/learning", tags: ["Professional Dev", "Soft Skills", "Management"], pricing: "Subscription" },
  { name: "MasterClass for Business", category: "human_skills", description: "Expert-led classes on leadership, negotiation, and creative thinking.", vendor: "MasterClass", url: "https://www.masterclass.com/business", tags: ["Leadership", "Creativity", "Communication"], pricing: "Per seat" },
  { name: "BetterUp", category: "human_skills", description: "AI-powered coaching platform for leadership development and resilience.", vendor: "BetterUp", url: "https://www.betterup.com", tags: ["Coaching", "Leadership", "Wellbeing"], pricing: "Enterprise" },
  { name: "Hone", category: "human_skills", description: "Live, small-group management training for modern people leaders.", vendor: "Hone", url: "https://www.honehq.com", tags: ["Management", "Training", "Leadership"], pricing: "Per seat" },
  { name: "Udemy Business", category: "human_skills", description: "On-demand professional skills library covering leadership, communication, and business.", vendor: "Udemy", url: "https://business.udemy.com", tags: ["Professional Dev", "Skills", "On-Demand"], pricing: "Per seat" },
  { name: "edX for Business", category: "human_skills", description: "Executive education and professional certificates from Harvard, MIT, and more.", vendor: "edX", url: "https://business.edx.org", tags: ["Executive Ed", "Certification", "Strategy"], pricing: "Per seat" },
  { name: "Torch", category: "human_skills", description: "Digital coaching and mentoring platform for leadership development at scale.", vendor: "Torch", url: "https://torch.io", tags: ["Coaching", "Mentoring", "Leadership"], pricing: "Enterprise" },
  { name: "Headspace for Work", category: "human_skills", description: "Mindfulness and focus training to build resilience and emotional intelligence.", vendor: "Headspace", url: "https://www.headspace.com/work", tags: ["Wellbeing", "Focus", "Resilience"], pricing: "Per seat" },
  { name: "Franklin Covey", category: "human_skills", description: "Time management, leadership effectiveness, and strategic execution programs.", vendor: "Franklin Covey", url: "https://www.franklincovey.com", tags: ["Leadership", "Productivity", "Strategy"], pricing: "Enterprise" },

  // New Capabilities
  { name: "DataCamp", category: "new_capabilities", description: "Learn data science, AI, and analytics skills with hands-on exercises.", vendor: "DataCamp", url: "https://www.datacamp.com", tags: ["Data Science", "Analytics", "AI/ML"], pricing: "Subscription" },
  { name: "Codecademy Pro", category: "new_capabilities", description: "Interactive coding and tech skills courses for career transitions.", vendor: "Codecademy", url: "https://www.codecademy.com/pro", tags: ["Coding", "Tech Skills", "Career"], pricing: "Subscription" },
  { name: "Zapier", category: "new_capabilities", description: "No-code automation platform connecting 6,000+ apps for workflow optimization.", vendor: "Zapier", url: "https://zapier.com", tags: ["Automation", "No-Code", "Workflow"], pricing: "Freemium" },
  { name: "Make (Integromat)", category: "new_capabilities", description: "Visual automation platform for complex multi-step workflows.", vendor: "Make", url: "https://www.make.com", tags: ["Automation", "Integration", "No-Code"], pricing: "Freemium" },
  { name: "Replit", category: "new_capabilities", description: "AI-powered coding environment for building and deploying applications.", vendor: "Replit", url: "https://replit.com", tags: ["Development", "AI Coding", "Deployment"], pricing: "Freemium" },
  { name: "Deeplearning.AI", category: "new_capabilities", description: "AI and machine learning courses by Andrew Ng for practitioners.", vendor: "Deeplearning.AI", url: "https://www.deeplearning.ai", tags: ["AI/ML", "Deep Learning", "Certification"], pricing: "Free / Paid" },
  { name: "Lovable", category: "new_capabilities", description: "Build full-stack web apps from natural language prompts — no code required.", vendor: "Lovable", url: "https://lovable.dev", tags: ["No-Code", "Web Apps", "AI Builder"], pricing: "Freemium" },
  { name: "n8n", category: "new_capabilities", description: "Open-source workflow automation with AI agent capabilities and self-hosting.", vendor: "n8n", url: "https://n8n.io", tags: ["Automation", "Open Source", "AI Agents"], pricing: "Freemium" },
  { name: "Retool", category: "new_capabilities", description: "Build internal tools and dashboards with AI-powered development.", vendor: "Retool", url: "https://retool.com", tags: ["Internal Tools", "Low-Code", "Dashboards"], pricing: "Freemium" },
  { name: "Airtable", category: "new_capabilities", description: "AI-powered database and app platform for project management and operations.", vendor: "Airtable", url: "https://airtable.com", tags: ["Database", "Project Mgmt", "No-Code"], pricing: "Freemium" },
  { name: "Weights & Biases", category: "new_capabilities", description: "ML experiment tracking and model evaluation platform for data teams.", vendor: "W&B", url: "https://wandb.ai", tags: ["ML Ops", "Experiment Tracking", "AI/ML"], pricing: "Freemium" },
  { name: "Hugging Face", category: "new_capabilities", description: "Open-source AI model hub for deploying and fine-tuning foundation models.", vendor: "Hugging Face", url: "https://huggingface.co", tags: ["AI Models", "Open Source", "NLP"], pricing: "Freemium" },
  { name: "Snowflake Cortex", category: "new_capabilities", description: "AI-powered data analytics and machine learning built into the data cloud.", vendor: "Snowflake", url: "https://www.snowflake.com/en/data-cloud/cortex", tags: ["Data Cloud", "Analytics", "AI/ML"], pricing: "Usage-based" },
  { name: "Dbt (data build tool)", category: "new_capabilities", description: "Transform raw data into analytics-ready datasets with version control.", vendor: "dbt Labs", url: "https://www.getdbt.com", tags: ["Data Engineering", "Analytics", "SQL"], pricing: "Freemium" },
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
