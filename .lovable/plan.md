

# Rewrite /how-it-works — The 183 Skills Story

## Goal
Replace the current feature-tour page with a narrative that answers three questions: **What** are the 183 skills? **Why** do they matter? **How** does the game engine help users acquire them?

The reader should walk away understanding the value proposition without needing to click anything else.

---

## New Page Structure (7 sections)

### 1. Hero — "183 Skills. One Game Engine."
- Headline: "The job market runs on 183 skills. Most people can't name 10."
- Subhead: We reverse-engineered 3,600+ employer job feeds to identify the exact skills the AI economy rewards. Then we built a game engine to help you master them.
- CTAs: "Explore the 183 Skills" → /skills, "Start Playing" → /

### 2. The Problem — "Why 183?"
- Short 3-card strip explaining:
  1. **AI is rewriting job descriptions** — tasks that existed 2 years ago are disappearing
  2. **Courses can't keep up** — by the time a curriculum ships, the market has moved
  3. **Employers test differently now** — they assess AI-readiness, not just knowledge
- Each card has an icon, stat, and one-liner. Punchline: "We mapped every skill employers actually hire for — and distilled them to 183 battle-tested competencies."

### 3. The 183 Skills — "8 Territories, One Map"
- Reuse `TerritoryEmblem` icons in a visual grid/map showing the 8 territory categories
- Each territory shows name, skill count range, and 2-3 example skills
- Brief explanation: skills are numbered #1–#183, ranked by market demand, and grouped into territories (Technical, Analytical, Strategic, Creative, Communication, Leadership, Human Edge, Operational)

### 4. The Engine — "Real Jobs In. Practice Out."
- 3-step pipeline visual:
  1. **Ingest** — We scan 3,600+ company job feeds daily for new tasks and skill requirements
  2. **Generate** — AI builds practice simulations from real job tasks (not generic exercises)
  3. **Adapt** — Difficulty scales to your level; the catalogue evolves as the market shifts
- Key differentiator: "Every simulation you play was born from a real job posting — not a textbook."

### 5. How You Level Up — "The Progression Loop"
- 4-step loop (compact cards):
  1. **Scout** a role → see which of the 183 skills it demands
  2. **Battle** in simulations → practice those skills hands-on
  3. **Grow** → earn XP, evolve skill castles, fill your territory map
  4. **Prove** → shareable profile showing practiced (not just studied) skills
- Visual: simple loop diagram or numbered flow

### 6. What You Walk Away With (keep existing "What You Get" section, refined)
- Skill Map, Evolved Castles, Shareable Profile — same 3 cards, tighter copy

### 7. Final CTA
- "Your future runs on 183 skills. Start mastering them."
- CTA buttons: Start Playing, Browse Skills

---

## Technical Changes

**Single file edit**: `src/pages/HowItWorks.tsx` — full rewrite

- Remove Boss Bestiary marquee (heavy, tangential to the narrative)
- Remove simulation preview images (simBriefing, simVictory) — keep the page text-focused
- Import `TerritoryEmblem` for the territory grid in section 3
- Keep `fade()` animation helper, `Navbar`, `Footer`
- All content is static — no new data fetching or DB changes

