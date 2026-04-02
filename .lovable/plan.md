# Delete Niche Library + Add Logo Marquee Social Proof to Homepage and integrate /leadgen directly with homepage

## Changes

### 1. Delete Niche Library

- **Delete** `src/components/leadgen/NicheLibrary.tsx`
- **Edit** `src/pages/Leadgen.tsx`:
  - Remove `NicheLibrary` import
  - Remove `browseLibrary` state and `handleSeedFromLibrary` function
  - Remove the "Browse Niche Library" button from the discovery hero
  - Remove the `browseLibrary` conditional rendering block — simplify to just `!hasDiscovered ? discoveryHero : dashboard`

### 2. Reshape Homepage (`src/pages/Index.tsx`)

Replace the 3-product picker with a single Leadgen-focused landing page:

- **Hero section**: Headline like "AI-Powered ICP Research" with a CTA button linking to `/leadgen`
- **Logo Marquee Strip**: Use the existing `CompanyMarquee.tsx` component with a curated list of recognizable brands (Apple, Stripe, OpenAI, Netflix, Figma, Anthropic, Canva, Datadog, Notion, Salesforce, etc.)
- **Headline above marquee**: "Powering ICP research across 3,700+ companies"
- Keep the existing dark RPG aesthetic, ember particles, and hero background image
- Remove the 3-product grid entirely
- Keep Footer

### 3. Brand list

Hardcode ~16 well-known brand names in 2 rows for the marquee. `CompanyMarquee` already handles logo fetching via `brandfetchFromName()` with fallbacks.

## Files affected


| File                                      | Action                               |
| ----------------------------------------- | ------------------------------------ |
| `src/components/leadgen/NicheLibrary.tsx` | Delete                               |
| `src/pages/Leadgen.tsx`                   | Remove NicheLibrary references       |
| `src/pages/Index.tsx`                     | Rewrite as Leadgen landing + marquee |
