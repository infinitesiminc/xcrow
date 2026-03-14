

## Pricing Page Plan

### Structure

Create a `/pricing` page with two segments side-by-side: **Individual** and **Organization**.

### Individual Pricing

| | Free | Pro — $19/mo |
|---|---|---|
| Role analyses | 2/month | Unlimited |
| Practice simulations | 3/month | Unlimited |
| Career pathways | Basic | Full + AI recommendations |
| Action plan | Summary | Detailed with tool links |
| Dashboard & history | Yes | Yes |
| Priority support | -- | Yes |

- Annual toggle: $19/mo or $190/year (save ~17%)
- CTA: "Get started free" / "Upgrade to Pro"

### Organization Pricing

Per-seat model with volume discount tiers:

| Seats | Price/seat/mo |
|---|---|
| 1-10 | $15 |
| 11-50 | $12 |
| 51-200 | $9 |
| 200+ | Custom |

Includes everything in Individual Pro plus: bulk role upload, department heatmaps, team dashboards, cohort tracking, admin controls.

- CTA for 1-200: "Start team trial" (links to `/contact-org`)
- CTA for 200+: "Talk to sales"

### Implementation

1. **New file: `src/pages/Pricing.tsx`**
   - Monthly/annual toggle (individuals only)
   - Two-column card layout: Individual (Free vs Pro) and Organization (tiered table)
   - Animated with framer-motion, consistent with existing page style
   - Feature comparison checklists on each card
   - FAQ accordion at the bottom (billing, cancellation, trial)

2. **Route: `src/App.tsx`**
   - Add `/pricing` route with Navbar + Footer

3. **Navigation updates**
   - Add "Pricing" link to `Navbar.tsx`
   - Add "Pricing" link to `Footer.tsx`
   - Update CTAs on ForIndividuals and ForOrganizations pages to link to `/pricing`

No payment integration yet -- this is the design/marketing page. Payment gating can be wired up separately with Stripe or Polar.

