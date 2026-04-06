export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  readTime: string;
  category: string;
  content: string; // markdown
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "cold-email-best-practices-2026",
    title: "Cold Email Best Practices for 2026",
    description: "The definitive guide to cold outreach that actually gets replies. Subject lines, personalization, timing, and follow-up strategies.",
    date: "2026-04-01",
    readTime: "8 min",
    category: "Outreach",
    content: `## Why Cold Email Still Works in 2026

Despite what the "cold email is dead" crowd says, cold outreach remains the single most effective channel for B2B pipeline generation — when done right.

The difference between spam and a great cold email? **Relevance.**

## The Anatomy of a High-Converting Cold Email

### 1. Subject Line (3-5 words)
Keep it short, specific, and curiosity-driven. Avoid clickbait.

**Good:** "Quick question about [Company]'s growth"
**Bad:** "AMAZING OPPORTUNITY — MUST READ"

### 2. Opening Line (Personalized)
Reference something specific about the prospect — a recent LinkedIn post, a company announcement, or a product launch. This signals you've done your homework.

### 3. The Bridge
Connect their situation to your value proposition in 1-2 sentences. This is where most emails fail — they talk about themselves instead of the prospect's problem.

### 4. The Ask
One clear, low-friction CTA. "Worth a 15-min call?" beats "Schedule a demo to learn about our comprehensive solution."

## Timing Matters

- **Tuesday-Thursday** outperform Monday and Friday
- **9-11 AM** in the prospect's timezone gets the highest open rates
- **Follow up 3x** — most replies come on the 2nd or 3rd touch

## The Personalization Spectrum

1. **Basic:** First name + company name (table stakes)
2. **Good:** Reference their role and a specific challenge
3. **Great:** Reference a trigger event (funding, hiring, product launch)
4. **Elite:** Reference their content, opinions, or public work

Tools like Xcrow automate the "great" and "elite" levels by analyzing company DNA and generating per-lead personalized outreach.

## Key Metrics to Track

- **Open rate:** 40-60% is good for cold
- **Reply rate:** 5-15% is strong
- **Positive reply rate:** 2-5% means your targeting is solid

## Bottom Line

Cold email works when you send the right message to the right person at the right time. The hard part has always been finding those right people — which is exactly what AI-powered tools like Xcrow solve.`,
  },
  {
    slug: "what-is-icp-targeting",
    title: "What Is ICP Targeting? The Complete Guide",
    description: "Learn how to define your Ideal Customer Profile and use it to find better leads faster. ICP framework, examples, and common mistakes.",
    date: "2026-03-25",
    readTime: "7 min",
    category: "Strategy",
    content: `## What Is an ICP?

Your **Ideal Customer Profile (ICP)** is a description of the type of company that gets the most value from your product. It's not a buyer persona (that's about the individual) — it's about the *company*.

## Why ICP Matters for Outbound

Without a clear ICP, you waste time emailing companies that will never buy. With one, every lead you generate is pre-qualified.

## The ICP Framework

### Firmographics
- **Industry:** Which verticals are you strongest in?
- **Company size:** 10-50 employees? 500+?
- **Revenue:** What's the minimum deal size that makes sense?
- **Geography:** Where can you actually sell?

### Technographics
- What tools do they currently use?
- What integrations matter?
- What does their tech stack signal about maturity?

### Behavioral Signals
- Are they hiring for roles your product supports?
- Have they recently raised funding?
- Are they expanding into new markets?

## Common ICP Mistakes

1. **Too broad:** "Any B2B company" is not an ICP
2. **Too narrow:** If only 50 companies match, you'll run out of pipeline
3. **Based on hope, not data:** Look at your best *existing* customers
4. **Never updated:** Your ICP should evolve as you learn

## How Xcrow Automates ICP Targeting

Traditional ICP targeting requires you to manually define all these criteria, then search databases with complex filters. Xcrow flips this — paste your website URL and AI analyzes your business to automatically generate a targeting tree of ideal verticals, company segments, and buyer personas.

No spreadsheets. No guesswork. Just AI-powered ICP identification.`,
  },
  {
    slug: "outbound-vs-inbound-lead-generation",
    title: "Outbound vs Inbound Lead Generation: Which Is Right for You?",
    description: "A practical comparison of outbound and inbound strategies. When to use each, how to combine them, and what works in 2026.",
    date: "2026-03-18",
    readTime: "6 min",
    category: "Strategy",
    content: `## The Great Debate

Every B2B company faces the same question: should we invest in inbound (content, SEO, social) or outbound (cold email, calls, ads)?

The answer is almost always **both** — but the ratio depends on your stage.

## Inbound: The Long Game

**Pros:**
- Compounds over time (content keeps generating leads)
- Prospects come to you (higher intent)
- Builds brand authority

**Cons:**
- Takes 6-18 months to see results
- Requires consistent content investment
- Hard to control volume

**Best for:** Established companies with content teams and patience.

## Outbound: The Fast Lane

**Pros:**
- Results in days, not months
- Full control over volume and targeting
- Can validate new markets quickly

**Cons:**
- Requires good targeting (or you're just spamming)
- Needs ongoing effort (doesn't compound like content)
- Lower intent than inbound leads

**Best for:** Startups, new market entry, and teams that need pipeline *now*.

## The Winning Combo

The best B2B teams use outbound to generate immediate pipeline while building inbound for long-term sustainability.

**Month 1-6:** 80% outbound, 20% inbound setup
**Month 6-12:** 60% outbound, 40% inbound
**Month 12+:** 40% outbound, 60% inbound

## Where Xcrow Fits

Xcrow supercharges the outbound side by eliminating the hardest parts — finding the right companies, identifying decision-makers, and writing personalized outreach. This means even solo founders can run enterprise-grade outbound campaigns from day one.`,
  },
  {
    slug: "how-to-find-decision-makers",
    title: "How to Find Decision-Makers at Any Company",
    description: "Proven methods to identify and reach the right buyer. LinkedIn, Apollo, AI tools, and direct outreach strategies.",
    date: "2026-03-10",
    readTime: "5 min",
    category: "Prospecting",
    content: `## The Decision-Maker Problem

You've found the perfect target company. But who do you actually email? The wrong contact means your email gets ignored, forwarded to a dead end, or worse — deleted.

## The Decision-Maker Hierarchy

For most B2B sales:
- **C-suite (CEO, CTO, CMO):** Final sign-off, but hard to reach
- **VPs:** Often the real decision-maker for $10K-$100K deals
- **Directors:** Drive evaluation and recommendation
- **Managers:** Can champion internally but rarely sign checks

**Rule of thumb:** Target one level above where you think the decision is made.

## Methods to Find the Right Person

### 1. LinkedIn Search
Filter by company + title. Look for people who've been in role 6+ months (new hires are less likely to buy).

### 2. Company Website
Check the About/Team page. Many companies list leadership with titles.

### 3. Contact Databases (Apollo, ZoomInfo)
Search by company and seniority. Filter for Director+ roles in relevant departments.

### 4. AI-Powered Discovery (Xcrow)
Paste the company URL and let AI determine which department and seniority level is most likely to buy your product. No manual filtering required.

## Verification Checklist

Before you email someone, verify:
- ✅ Their LinkedIn profile matches the company and title
- ✅ They've been in role for at least a few months
- ✅ Their department is relevant to what you sell
- ✅ They have decision-making authority (Director+)

## Multi-Threading

Don't just email one person. The best outbound campaigns "multi-thread" — reaching 2-3 stakeholders at the same company. This increases your chance of finding the real buyer and creates internal awareness.`,
  },
  {
    slug: "b2b-lead-generation-tools-compared",
    title: "B2B Lead Generation Tools Compared: 2026 Edition",
    description: "An honest comparison of the top B2B lead gen tools — Apollo, Clay, ZoomInfo, and Xcrow. Features, pricing, and who each tool is best for.",
    date: "2026-03-03",
    readTime: "9 min",
    category: "Tools",
    content: `## The B2B Lead Gen Landscape in 2026

The market is flooded with lead generation tools. Here's an honest breakdown of the major players and where each one shines.

## Apollo.io
**Best for:** Teams that know their ICP and want a large contact database.

Apollo offers 275M+ contacts with email and phone data. Strong filtering, basic email sequences, and a generous free tier. The catch? You need to know exactly who you're looking for — Apollo is a database, not a strategist.

**Pricing:** Free tier available. Paid from $49/mo.

## Clay
**Best for:** Sales ops teams who want to build custom data enrichment workflows.

Clay is incredibly powerful — a spreadsheet-like interface that chains together 100+ data providers. But it's complex. Building a Clay workflow requires understanding APIs, data enrichment, and automation logic. It's a tool for ops people, not sellers.

**Pricing:** From $149/mo.

## ZoomInfo
**Best for:** Enterprise sales teams with big budgets.

The industry standard for B2B data. Massive database, intent data, org charts, and deep integrations. But it comes with enterprise pricing ($30K+/year), long contracts, and a complex interface.

**Pricing:** Starts around $30K/year.

## Xcrow
**Best for:** Founders, freelancers, and small teams who need leads without the complexity.

Xcrow takes a fundamentally different approach — paste one company URL and AI handles the entire prospecting workflow: company analysis, prospect mapping, lead scoring, and outreach drafting. No ICP setup, no filters, no workflow building.

**Pricing:** Free to start. Pro from $49/mo.

## The Right Tool Depends on Your Stage

| Stage | Best Tool |
|-------|-----------|
| Solo founder, no sales experience | **Xcrow** |
| Small team, knows their ICP | **Apollo** |
| Sales ops team, complex workflows | **Clay** |
| Enterprise, 50+ reps | **ZoomInfo** |

## Our Take

The future of lead gen isn't bigger databases — it's smarter AI. Tools that understand your business and automatically find the right prospects will replace manual filtering and complex workflows. That's the bet Xcrow is making.`,
  },
];

export const BLOG_CATEGORIES = [...new Set(BLOG_POSTS.map((p) => p.category))];
