

## Redesign Role Detail Overlay — TikTok-Native Patterns

### What Changes

Transform the current scroll-and-read overlay into a **snap-scroll, visual-first, interactive** experience matching TikTok/Stories UX.

### 1. Snap-Scroll Sections (Stories-style)

Replace the single scrollable div with **3 snap-scroll "screens"** inside the overlay, each taking full height of the content area. Users swipe vertically between them. Add **dot indicators** on the right edge showing current section.

- Screen 1: **"🎯 The Role"** — description + metadata pills
- Screen 2: **"⚡ Key Tasks"** — horizontally swipeable task chips
- Screen 3: **"🤖 AI Impact"** — hero-sized metric gauges

### 2. Hero-Sized AI Metrics (Screen 3)

Replace thin progress bars with **3 circular arc gauges** (similar to RiskGauge component) arranged in a row/grid:
- **Readiness** (100 - risk) — green/amber arc
- **AI Tools** (augmented%) — blue arc  
- **Growth** (aiOpportunity%) — purple arc

Each gauge: large number center, label below, ~80px diameter. Animated on enter.

### 3. Swipeable Task Chips (Screen 2)

Replace bullet list with a **horizontal carousel** of task cards. Each card:
- Task name (bold, 1 line)
- AI exposure badge (brand colors)
- Tap action → navigates to full analysis with that task highlighted

Use the existing `Carousel` component or a simple horizontal scroll with `snap-x`.

### 4. Emoji-Led Section Headers

Replace icon + text headers with larger, bolder emoji-led labels:
```
🎯 The Role     ⚡ Key Tasks     🤖 AI Impact
```
Bigger font (`text-base font-bold`), no icon components needed.

### 5. Dot Navigation Indicator

A vertical column of 3 dots on the right side, highlighting the current snap section. Uses `IntersectionObserver` or scroll position to track active section.

### 6. Micro-Interaction: Quick Simulate Button

On Screen 3 (AI Impact), add a secondary CTA: **"⚡ Try a Task"** that opens the SimulatorModal directly with a random task from this role — zero-click path to engagement.

### Files to Edit

| File | Change |
|---|---|
| `src/components/RoleFeed.tsx` | Rewrite `RoleDetailOverlay` with snap-scroll layout, dot nav, swipeable tasks, arc gauges |

### Technical Approach

- Content area uses `overflow-y-auto snap-y snap-mandatory` with each section as `snap-start min-h-full`
- Arc gauges reuse the SVG pattern from `RiskGauge.tsx` (smaller radius)
- Task chips use horizontal `overflow-x-auto snap-x` with `scroll-snap-type: x mandatory`
- Dot nav tracks scroll position via `onScroll` handler checking `scrollTop` against section offsets
- Framer Motion `motion.div` for staggered entry animations on each screen

