export interface CuratedCompany {
  name: string;
  website: string;
  industry: string;
  description: string;
  employee_range: string;
  funding_stage: string;
  headquarters: string;
}

export const CURATED_COMPANIES: Record<string, CuratedCompany[]> = {
  Fintech: [
    { name: "Stripe", website: "stripe.com", industry: "Fintech", description: "Payment infrastructure for the internet", employee_range: "5001-10000", funding_stage: "Late Stage", headquarters: "San Francisco, CA" },
    { name: "Plaid", website: "plaid.com", industry: "Fintech", description: "Financial data connectivity platform", employee_range: "1001-5000", funding_stage: "Late Stage", headquarters: "San Francisco, CA" },
    { name: "Brex", website: "brex.com", industry: "Fintech", description: "Corporate cards and spend management for startups", employee_range: "1001-5000", funding_stage: "Series D", headquarters: "San Francisco, CA" },
    { name: "Ramp", website: "ramp.com", industry: "Fintech", description: "Corporate card and finance automation platform", employee_range: "501-1000", funding_stage: "Series D", headquarters: "New York, NY" },
    { name: "Marqeta", website: "marqeta.com", industry: "Fintech", description: "Modern card issuing and payment processing platform", employee_range: "501-1000", funding_stage: "Public", headquarters: "Oakland, CA" },
    { name: "Affirm", website: "affirm.com", industry: "Fintech", description: "Buy now, pay later consumer financing", employee_range: "1001-5000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Mercury", website: "mercury.com", industry: "Fintech", description: "Banking for startups and scaling companies", employee_range: "501-1000", funding_stage: "Series C", headquarters: "San Francisco, CA" },
    { name: "Adyen", website: "adyen.com", industry: "Fintech", description: "Global payments platform for enterprise", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Amsterdam, Netherlands" },
    { name: "Wise", website: "wise.com", industry: "Fintech", description: "International money transfers and multi-currency accounts", employee_range: "5001-10000", funding_stage: "Public", headquarters: "London, UK" },
    { name: "Checkout.com", website: "checkout.com", industry: "Fintech", description: "Cloud-based payment processing for enterprise", employee_range: "1001-5000", funding_stage: "Series D", headquarters: "London, UK" },
  ],
  SaaS: [
    { name: "HubSpot", website: "hubspot.com", industry: "SaaS / B2B", description: "CRM, marketing, sales, and service platform", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Cambridge, MA" },
    { name: "Notion", website: "notion.so", industry: "SaaS / B2B", description: "All-in-one workspace for notes, docs, and projects", employee_range: "501-1000", funding_stage: "Series C", headquarters: "San Francisco, CA" },
    { name: "Figma", website: "figma.com", industry: "SaaS / B2B", description: "Collaborative interface design tool", employee_range: "1001-5000", funding_stage: "Acquired", headquarters: "San Francisco, CA" },
    { name: "Airtable", website: "airtable.com", industry: "SaaS / B2B", description: "Low-code platform for building apps and workflows", employee_range: "501-1000", funding_stage: "Series F", headquarters: "San Francisco, CA" },
    { name: "Canva", website: "canva.com", industry: "SaaS / B2B", description: "Visual communication and design platform", employee_range: "5001-10000", funding_stage: "Late Stage", headquarters: "Sydney, Australia" },
    { name: "Monday.com", website: "monday.com", industry: "SaaS / B2B", description: "Work operating system for teams", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Tel Aviv, Israel" },
    { name: "Zapier", website: "zapier.com", industry: "SaaS / B2B", description: "Workflow automation connecting 5000+ apps", employee_range: "501-1000", funding_stage: "Series B", headquarters: "San Francisco, CA" },
    { name: "Miro", website: "miro.com", industry: "SaaS / B2B", description: "Visual collaboration platform for teams", employee_range: "1001-5000", funding_stage: "Series C", headquarters: "San Francisco, CA" },
    { name: "Calendly", website: "calendly.com", industry: "SaaS / B2B", description: "Scheduling automation platform", employee_range: "501-1000", funding_stage: "Series B", headquarters: "Atlanta, GA" },
    { name: "Loom", website: "loom.com", industry: "SaaS / B2B", description: "Async video messaging for work", employee_range: "201-500", funding_stage: "Acquired", headquarters: "San Francisco, CA" },
  ],
  AI: [
    { name: "OpenAI", website: "openai.com", industry: "AI & ML", description: "AI research and deployment company behind ChatGPT", employee_range: "1001-5000", funding_stage: "Late Stage", headquarters: "San Francisco, CA" },
    { name: "Anthropic", website: "anthropic.com", industry: "AI & ML", description: "AI safety company building Claude", employee_range: "501-1000", funding_stage: "Series D", headquarters: "San Francisco, CA" },
    { name: "Hugging Face", website: "huggingface.co", industry: "AI & ML", description: "Open-source AI model hub and platform", employee_range: "201-500", funding_stage: "Series D", headquarters: "New York, NY" },
    { name: "Cohere", website: "cohere.com", industry: "AI & ML", description: "Enterprise AI platform for NLP", employee_range: "201-500", funding_stage: "Series D", headquarters: "Toronto, Canada" },
    { name: "Scale AI", website: "scale.com", industry: "AI & ML", description: "Data labeling and AI infrastructure platform", employee_range: "501-1000", funding_stage: "Series F", headquarters: "San Francisco, CA" },
    { name: "Databricks", website: "databricks.com", industry: "AI & ML", description: "Unified analytics and AI platform", employee_range: "5001-10000", funding_stage: "Late Stage", headquarters: "San Francisco, CA" },
    { name: "Runway", website: "runwayml.com", industry: "AI & ML", description: "AI-powered creative tools for video and images", employee_range: "201-500", funding_stage: "Series D", headquarters: "New York, NY" },
    { name: "Jasper", website: "jasper.ai", industry: "AI & ML", description: "AI content creation platform for marketing teams", employee_range: "201-500", funding_stage: "Series A", headquarters: "Austin, TX" },
    { name: "Stability AI", website: "stability.ai", industry: "AI & ML", description: "Open-source generative AI models", employee_range: "201-500", funding_stage: "Series B", headquarters: "London, UK" },
    { name: "Perplexity", website: "perplexity.ai", industry: "AI & ML", description: "AI-powered answer engine and search", employee_range: "201-500", funding_stage: "Series B", headquarters: "San Francisco, CA" },
  ],
  "Developer Tools": [
    { name: "Vercel", website: "vercel.com", industry: "Developer Tools", description: "Frontend cloud platform and Next.js creators", employee_range: "501-1000", funding_stage: "Series D", headquarters: "San Francisco, CA" },
    { name: "Supabase", website: "supabase.com", industry: "Developer Tools", description: "Open-source Firebase alternative with Postgres", employee_range: "201-500", funding_stage: "Series C", headquarters: "Singapore" },
    { name: "Datadog", website: "datadoghq.com", industry: "Developer Tools", description: "Cloud monitoring and observability platform", employee_range: "5001-10000", funding_stage: "Public", headquarters: "New York, NY" },
    { name: "PlanetScale", website: "planetscale.com", industry: "Developer Tools", description: "Serverless MySQL database platform", employee_range: "51-200", funding_stage: "Series C", headquarters: "San Francisco, CA" },
    { name: "Postman", website: "postman.com", industry: "Developer Tools", description: "API development and testing platform", employee_range: "501-1000", funding_stage: "Series D", headquarters: "San Francisco, CA" },
    { name: "GitLab", website: "gitlab.com", industry: "Developer Tools", description: "DevSecOps platform for software development", employee_range: "1001-5000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Sentry", website: "sentry.io", industry: "Developer Tools", description: "Application monitoring and error tracking", employee_range: "501-1000", funding_stage: "Series E", headquarters: "San Francisco, CA" },
    { name: "LaunchDarkly", website: "launchdarkly.com", industry: "Developer Tools", description: "Feature management and experimentation platform", employee_range: "501-1000", funding_stage: "Series D", headquarters: "Oakland, CA" },
    { name: "Linear", website: "linear.app", industry: "Developer Tools", description: "Project management for software teams", employee_range: "51-200", funding_stage: "Series B", headquarters: "San Francisco, CA" },
    { name: "Retool", website: "retool.com", industry: "Developer Tools", description: "Low-code platform for internal tools", employee_range: "201-500", funding_stage: "Series C", headquarters: "San Francisco, CA" },
  ],
  Health: [
    { name: "Veeva Systems", website: "veeva.com", industry: "Healthcare", description: "Cloud software for life sciences industry", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Pleasanton, CA" },
    { name: "Doximity", website: "doximity.com", industry: "Healthcare", description: "Professional network for physicians", employee_range: "501-1000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Flatiron Health", website: "flatiron.com", industry: "Healthcare", description: "Oncology-focused health tech platform", employee_range: "501-1000", funding_stage: "Acquired", headquarters: "New York, NY" },
    { name: "Hims & Hers", website: "hims.com", industry: "Healthcare", description: "Telehealth platform for wellness and care", employee_range: "1001-5000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Ro", website: "ro.co", industry: "Healthcare", description: "Direct-to-patient healthcare company", employee_range: "501-1000", funding_stage: "Series D", headquarters: "New York, NY" },
    { name: "Tempus", website: "tempus.com", industry: "Healthcare", description: "AI-powered precision medicine platform", employee_range: "1001-5000", funding_stage: "Late Stage", headquarters: "Chicago, IL" },
    { name: "Olive AI", website: "oliveai.com", industry: "Healthcare", description: "AI automation for healthcare operations", employee_range: "501-1000", funding_stage: "Series H", headquarters: "Columbus, OH" },
    { name: "Nuvance Health", website: "nuvancehealth.org", industry: "Healthcare", description: "Regional healthcare system in NY and CT", employee_range: "10000+", funding_stage: "Non-Profit", headquarters: "Danbury, CT" },
    { name: "Oscar Health", website: "hioscar.com", industry: "Healthcare", description: "Technology-driven health insurance company", employee_range: "1001-5000", funding_stage: "Public", headquarters: "New York, NY" },
    { name: "Zocdoc", website: "zocdoc.com", industry: "Healthcare", description: "Healthcare marketplace connecting patients with doctors", employee_range: "501-1000", funding_stage: "Series D", headquarters: "New York, NY" },
  ],
  Security: [
    { name: "CrowdStrike", website: "crowdstrike.com", industry: "Security", description: "Cloud-native endpoint security platform", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Austin, TX" },
    { name: "Snyk", website: "snyk.io", industry: "Security", description: "Developer security platform for code and dependencies", employee_range: "1001-5000", funding_stage: "Series G", headquarters: "Boston, MA" },
    { name: "1Password", website: "1password.com", industry: "Security", description: "Password management and security platform", employee_range: "501-1000", funding_stage: "Series C", headquarters: "Toronto, Canada" },
    { name: "Wiz", website: "wiz.io", industry: "Security", description: "Cloud security posture management platform", employee_range: "1001-5000", funding_stage: "Series D", headquarters: "New York, NY" },
    { name: "SentinelOne", website: "sentinelone.com", industry: "Security", description: "Autonomous AI-powered cybersecurity platform", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Mountain View, CA" },
    { name: "Okta", website: "okta.com", industry: "Security", description: "Identity and access management platform", employee_range: "5001-10000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Cloudflare", website: "cloudflare.com", industry: "Security", description: "Web security, performance, and reliability platform", employee_range: "5001-10000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Palo Alto Networks", website: "paloaltonetworks.com", industry: "Security", description: "Enterprise cybersecurity and firewall solutions", employee_range: "10000+", funding_stage: "Public", headquarters: "Santa Clara, CA" },
    { name: "Arctic Wolf", website: "arcticwolf.com", industry: "Security", description: "Security operations as a managed service", employee_range: "1001-5000", funding_stage: "Series F", headquarters: "Eden Prairie, MN" },
    { name: "Abnormal Security", website: "abnormalsecurity.com", industry: "Security", description: "AI-based email security platform", employee_range: "501-1000", funding_stage: "Series D", headquarters: "San Francisco, CA" },
  ],
  commerce: [
    { name: "Shopify", website: "shopify.com", industry: "E-commerce", description: "Commerce platform for online and retail businesses", employee_range: "10000+", funding_stage: "Public", headquarters: "Ottawa, Canada" },
    { name: "Faire", website: "faire.com", industry: "E-commerce", description: "B2B wholesale marketplace for retailers", employee_range: "501-1000", funding_stage: "Series G", headquarters: "San Francisco, CA" },
    { name: "Bolt", website: "bolt.com", industry: "E-commerce", description: "One-click checkout for online retailers", employee_range: "201-500", funding_stage: "Series E", headquarters: "San Francisco, CA" },
    { name: "BigCommerce", website: "bigcommerce.com", industry: "E-commerce", description: "Open SaaS ecommerce platform", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Austin, TX" },
    { name: "Instacart", website: "instacart.com", industry: "E-commerce", description: "Grocery delivery and pickup marketplace", employee_range: "5001-10000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Klarna", website: "klarna.com", industry: "E-commerce", description: "Buy now pay later and shopping platform", employee_range: "5001-10000", funding_stage: "Late Stage", headquarters: "Stockholm, Sweden" },
    { name: "Etsy", website: "etsy.com", industry: "E-commerce", description: "Marketplace for handmade and vintage goods", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Brooklyn, NY" },
    { name: "Recharge", website: "rechargepayments.com", industry: "E-commerce", description: "Subscription management for ecommerce", employee_range: "201-500", funding_stage: "Series C", headquarters: "Santa Monica, CA" },
    { name: "Klaviyo", website: "klaviyo.com", industry: "E-commerce", description: "Marketing automation for ecommerce brands", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Boston, MA" },
    { name: "Yotpo", website: "yotpo.com", industry: "E-commerce", description: "Ecommerce marketing platform for reviews and loyalty", employee_range: "501-1000", funding_stage: "Series F", headquarters: "New York, NY" },
  ],
  Education: [
    { name: "Coursera", website: "coursera.org", industry: "Education", description: "Online learning platform with university courses", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Mountain View, CA" },
    { name: "Duolingo", website: "duolingo.com", industry: "Education", description: "Language learning platform and app", employee_range: "501-1000", funding_stage: "Public", headquarters: "Pittsburgh, PA" },
    { name: "Canvas (Instructure)", website: "instructure.com", industry: "Education", description: "Learning management system for education", employee_range: "1001-5000", funding_stage: "Acquired", headquarters: "Salt Lake City, UT" },
    { name: "Chegg", website: "chegg.com", industry: "Education", description: "Student-first learning and tutoring platform", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Santa Clara, CA" },
    { name: "Handshake", website: "joinhandshake.com", industry: "Education", description: "Career platform connecting students to employers", employee_range: "501-1000", funding_stage: "Series F", headquarters: "San Francisco, CA" },
    { name: "Guild Education", website: "guildeducation.com", industry: "Education", description: "Employer-sponsored education benefits platform", employee_range: "1001-5000", funding_stage: "Series F", headquarters: "Denver, CO" },
    { name: "Articulate", website: "articulate.com", industry: "Education", description: "E-learning authoring tools for enterprises", employee_range: "501-1000", funding_stage: "Series A", headquarters: "New York, NY" },
    { name: "Kahoot!", website: "kahoot.com", industry: "Education", description: "Game-based learning platform", employee_range: "501-1000", funding_stage: "Public", headquarters: "Oslo, Norway" },
    { name: "Quizlet", website: "quizlet.com", industry: "Education", description: "AI-powered study tools and flashcards", employee_range: "201-500", funding_stage: "Series D", headquarters: "San Francisco, CA" },
    { name: "Udemy", website: "udemy.com", industry: "Education", description: "Online marketplace for teaching and learning", employee_range: "1001-5000", funding_stage: "Public", headquarters: "San Francisco, CA" },
  ],
  "Real Estate": [
    { name: "Zillow", website: "zillow.com", industry: "Real Estate", description: "Real estate marketplace and data platform", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Seattle, WA" },
    { name: "Opendoor", website: "opendoor.com", industry: "Real Estate", description: "Digital platform for buying and selling homes", employee_range: "1001-5000", funding_stage: "Public", headquarters: "San Francisco, CA" },
    { name: "Redfin", website: "redfin.com", industry: "Real Estate", description: "Technology-powered real estate brokerage", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Seattle, WA" },
    { name: "Compass", website: "compass.com", industry: "Real Estate", description: "Real estate technology platform for agents", employee_range: "5001-10000", funding_stage: "Public", headquarters: "New York, NY" },
    { name: "Loft (Loft.io)", website: "loft.com.br", industry: "Real Estate", description: "Digital real estate platform in Latin America", employee_range: "1001-5000", funding_stage: "Series D", headquarters: "São Paulo, Brazil" },
    { name: "Pacaso", website: "pacaso.com", industry: "Real Estate", description: "Co-ownership platform for second homes", employee_range: "201-500", funding_stage: "Series C", headquarters: "Napa, CA" },
    { name: "Divvy Homes", website: "divvyhomes.com", industry: "Real Estate", description: "Rent-to-own homeownership platform", employee_range: "201-500", funding_stage: "Series D", headquarters: "San Francisco, CA" },
    { name: "Roofstock", website: "roofstock.com", industry: "Real Estate", description: "Marketplace for investment real estate", employee_range: "201-500", funding_stage: "Series E", headquarters: "Oakland, CA" },
    { name: "CoStar Group", website: "costargroup.com", industry: "Real Estate", description: "Commercial real estate data and analytics", employee_range: "5001-10000", funding_stage: "Public", headquarters: "Washington, DC" },
    { name: "AppFolio", website: "appfolio.com", industry: "Real Estate", description: "Property management software platform", employee_range: "1001-5000", funding_stage: "Public", headquarters: "Santa Barbara, CA" },
  ],
};

// Flatten all companies for "All Industries"
export function getAllCuratedCompanies(): CuratedCompany[] {
  return Object.values(CURATED_COMPANIES).flat();
}
