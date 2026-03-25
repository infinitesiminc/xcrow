

# Investors Page — $1M Seed Round (Updated)

## What's New
Added **B2B Enterprise Recruiting GTM** as a 5th fund allocation bucket. Percentages rebalanced:

| Bucket | % | Amount | Focus |
|--------|---|--------|-------|
| Engineering | 35% | $350K | AI sim engine, skill graph, infra |
| B2C Growth / Ads | 20% | $200K | User acquisition, paid channels, content |
| B2B School GTM | 20% | $200K | University pilots, partnerships |
| B2B Enterprise Recruiting GTM | 15% | $150K | Employer/recruiter partnerships, ATS integrations, enterprise sales |
| Team | 10% | $100K | Key hires (eng, growth, partnerships) |

## Page Sections
1. **Hero** — "Seed Round: $1M", mission one-liner
2. **The Opportunity** — Market framing ($300B+ EdTech, AI economy gap)
3. **Fund Allocation** — Horizontal stacked bar + 5 RPG-styled cards (stone surface, filigree borders, Cinzel headers). Cards in responsive grid (1 col mobile, 3+2 desktop)
4. **Traction / Proof Points** — Key metrics strip
5. **CTA** — "Schedule a Meeting" linking to `/contact`

## Technical Steps

| Step | Detail |
|------|--------|
| Create `src/pages/Investors.tsx` | Follow `About.tsx` patterns: Navbar, Footer, framer-motion fade, Cinzel headings, `--surface-stone` cards, `--filigree` borders |
| Add route in `src/App.tsx` | `<Route path="/investors" element={<Investors />} />` — public, lazy-loaded |
| Fund bar | CSS horizontal bar with 5 color-coded segments matching territory palette |
| Cards | 5 allocation cards with icon, %, dollar amount, bullet points |
| Responsive | Stack on mobile, grid on desktop |

No database changes. Two files: new page + route addition.

