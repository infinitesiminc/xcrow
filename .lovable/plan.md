

# Homepage Messaging Pivot: Startup Founders Without Sales Teams

## Current Problem
The messaging assumes the reader knows what an SDR is, what Apollo filters are, and has context on enterprise sales tools. A startup founder without a sales team doesn't relate to any of this. They don't have an SDR to replace — they've never had one.

## New Messaging Direction

**Core insight**: These founders are doing sales themselves (badly), or not doing it at all. They don't need a "cheaper Apollo" — they need their **first sales engine**.

### Key Changes

| Section | Current | Proposed |
|---|---|---|
| **Eyebrow** | "THE $49 SALES TEAM" | "YOUR FIRST SALES TEAM" |
| **Headline** | "Paste a URL. Skip the SDR." | "Paste a URL. Get Your First Customers." |
| **Subheadline** | "Other tools give you a database..." | "You're building a product, not a sales team. Paste your website and we'll find the people who need what you're building." |
| **Tagline under CTA** | "Free to start · No credit card · No sales expertise needed" | "No sales experience needed · Free to start · Works in 10 seconds" |
| **Stats row** | "$49 vs $120+ on LinkedIn" | "$49/mo — Your entire outbound" / "0 sales hires needed" / "10s to your first lead" |
| **Social proof** | "Trusted by GTM teams targeting these companies" | "Founders use Xcrow to land their first 10 customers" |
| **How It Works** | Generic lead gen steps | Founder-centric: "Paste your website" → "AI builds your sales playbook" → "Start closing deals" |
| **Apollo comparison** | SDR/GTM-heavy language | Reframe: "Apollo is built for sales teams. You don't have one. That's the point." |
| **LinkedIn comparison** | InMail pricing comparison | Reframe: "You don't have time for LinkedIn. You have a product to ship." |
| **Bottom CTA** | "Your Competitor Is Still Building Apollo Filters" | "Your competitors are hiring SDRs. You just need a URL." |
| **SEO title** | "The $49 Sales Team" | "Xcrow — Your First Sales Hire is a URL" |

### Files to Modify
- `src/pages/Index.tsx` — All copy changes above
- `src/components/SEOHead.tsx` — Only if default meta description needs updating (it's passed as props, so just the Index call)

### What stays the same
- Page structure, layout, animations, and components unchanged
- CTA input form and logic unchanged
- Trust strip unchanged
- Comparison section structure unchanged (just copy updates)
- Footer, Navbar unchanged

