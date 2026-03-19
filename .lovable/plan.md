

## Build Plan: 4 Marketing Pages

### Priority Order
1. `/schools` — University landing page (B2B revenue driver)
2. `/students` — Redesign existing page with updated messaging
3. `/about` — Mission / brand story
4. `/blog` — SEO content hub (static MVP)

---

### Page 1: `/schools` — For Universities

**Hero**: "Your curriculum was designed before GPT. Your students weren't." + bold stat (e.g. "67% of skills in your catalog are AI-exposed") + CTA: "Get a Free Curriculum Audit"

**Sections**:
- **The Problem**: Visual showing traditional curriculum vs market skill demand gap (reuse the skill block component pattern from `/students`)
- **How It Works** (3 steps): 1) We scrape your catalog 2) Map skills to market demand 3) Identify gaps + recommend simulations
- **Live Preview**: Mock curriculum gap analysis card showing a sample school's coverage %, gaps, and AI readiness — styled like the existing `SkillsGapMatrix` output
- **What Schools Get**: Feature grid — gap analysis, simulation library, student dashboards, leaderboard, auto-enroll, cohort analytics
- **Social Proof**: School logos marquee (UCLA, MIT, Stanford, etc. — mock for now) + a testimonial quote placeholder
- **CTA**: "Book a Curriculum Audit" → links to `/contact`

**New file**: `src/pages/Schools.tsx`
**Route**: Add to `App.tsx` with `<Navbar />` + `<Footer />`

---

### Page 2: `/students` — Redesign

**Keep**: The Lego skill-stack thesis section (it's strong). The before/after AI shift comparison.

**Add/Update**:
- New hero copy: "Your degree teaches subjects. The job market needs skills."
- **Practice section**: Show simulation preview — mock chat bubble + pillar scores
- **Skill Map preview**: Visual of a student's radar/heatmap (pull from existing `JourneyRadarView` style)
- **Leaderboard teaser**: Mini leaderboard preview + "Join 5,000+ students" 
- **Viral CTA**: "Your school isn't on crowy yet? Tell your professor." → mailto or `/contact` link
- Final CTA: "Get Started — Free"

**Edit**: `src/pages/Students.tsx`

---

### Page 3: `/about` — Mission & Brand

**Sections**:
- **Hero**: "We're building the bridge between education and the AI economy"
- **The Problem**: The acceleration gap — AI evolves monthly, curricula update yearly, careers span decades
- **The Crow**: Brand story — crows are adaptive problem-solvers, tool-users, pattern-recognizers. That's the skillset the future demands.
- **What We Build**: Jobs → Tasks → Skills framework explanation with the Lego visual
- **Team**: Founder card(s) with photo placeholder, title, one-liner
- **Backed By / Advisors**: Placeholder section for future use

**New file**: `src/pages/About.tsx`
**Route**: Add to `App.tsx`

---

### Page 4: `/blog` — Static MVP

**Simple layout**:
- Hero: "Insights" or "Resources" header
- Grid of 3-4 hardcoded article cards with title, excerpt, date, category tag
- Cards link to `#` for now (no actual blog engine)
- Categories: "AI & Work", "Skills Research", "For Educators"

**New file**: `src/pages/Blog.tsx`
**Route**: Add to `App.tsx`

---

### Shared Changes

- **`App.tsx`**: Add 3 new lazy imports + routes (`/schools`, `/about`, `/blog`)
- **`Navbar.tsx`**: May need nav links updated (check if these pages should appear in nav)
- **Design**: All pages use the existing bold/dark aesthetic — `fadeUp` animations, `Section` wrapper pattern from Students.tsx, brand colors (`brand-ai`, `brand-human`, `brand-mid`)

### Implementation Order
Build one page per message, starting with `/schools`.

