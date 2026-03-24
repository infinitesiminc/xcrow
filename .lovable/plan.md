

# National Xcrow Competition Page — `/competition`

## Overview
New standalone landing page for the **National Xcrow Championship** on **June 10, 2026**, open to all US college students, **$1,000,000 cash prize pool**. RPG-themed, high-energy, conversion-focused.

## New file: `src/pages/Competition.tsx`

### 1. Hero Section
- Headline: **"The National Xcrow Championship"**
- Date badge: **June 10, 2026**
- Subtext: "All US college students. One day. $1,000,000 in prizes."
- Live countdown timer (days/hours/minutes/seconds) using `useState` + `useEffect` interval
- "Register Now" CTA → opens auth modal via `useAuth().openAuthModal`
- RPG atmospheric glows using existing CSS variables

### 2. Prize Breakdown — $1M total
- 4-card grid with gold/silver/bronze/steel styling:
  - 1st Place: **$500,000**
  - 2nd Place: **$250,000**
  - 3rd Place: **$150,000**
  - Top 10: **$10,000 each**
- Trophy/medal icons from Lucide (`Trophy`, `Medal`, `Award`)

### 3. How It Works
- 4-step flow cards: Register → Qualify → Compete → Win
- Each with icon, title, description
- Qualification via platform practice, competition day is live sims

### 4. Eligibility & Rules
- US college/university enrollment required
- Individual competition
- All 183 skill territories in play
- Clean list layout with shield/check icons

### 5. What You'll Battle
- Preview cards: timed AI simulations, L2 checkpoints, boss battles
- Real-world job tasks from actual companies
- Uses existing RPG card styling

### 6. Social Proof Strip
- Stats: universities represented, students registered, skill territories (placeholder numbers)
- "Your university could be represented"

### 7. Final CTA
- "Claim Your Spot" primary button → auth modal
- "Tell Your Campus" secondary → `navigator.share` or copy link

### Tech
- `framer-motion` animations using existing `fade` pattern
- Navbar + Footer wrapper
- Fully responsive

## Edit: `src/App.tsx`
- Add lazy import: `const Competition = lazy(() => import("./pages/Competition.tsx"));`
- Add route: `<Route path="/competition" element={<><Navbar /><Competition /><Footer /></>} />`

