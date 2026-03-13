

## Redesign: Attractive Cards with Icons for Analysis Page

### Problem
The current analysis page uses minimal styling — flat rows for tasks, plain text for skills, and a basic stats bar. It works but feels utilitarian rather than polished.

### Design Vision

**1. Stats Summary — Three Icon Cards**
Replace the single stats row with three individual cards, each with:
- A distinctive icon in a colored circle (Bot for AI-augmented, ShieldAlert for automation risk, GraduationCap for new skills)
- Large percentage number
- Label text
- Subtle gradient background matching the stat's color theme
- A mini progress arc or bar within each card

**2. Task Cards — Richer Visual Treatment**
Upgrade each task row into a proper card with:
- Left colored accent border (green/yellow/red based on impact level) instead of a small dot
- Icon per task state (User/Users/Bot) rendered larger in a tinted circle
- Task description shown as a subtitle line (currently hidden)
- Trend indicator as a small labeled chip rather than just an icon
- Hover: subtle lift shadow + border glow

**3. Skill Cards — Category Headers with Icons + Better Cards**
Upgrade skills from plain buttons to proper cards:
- Category headers get larger icons with colored backgrounds (wrench in purple circle for Tools, heart in pink for Human, sparkles in amber for New)
- Each skill becomes a card with: left-aligned priority badge, name, truncated description, and a subtle expand arrow
- Expanded state shows resources in mini link-cards with favicons

**4. Save CTA — Gradient Banner Card**
Replace the plain text + button with a visually distinct gradient banner card with an icon.

### Technical Approach

All changes are in `src/pages/Analysis.tsx`:
- Refactor the stats section into a 3-column grid of `Card` components with icons
- Refactor each task row to use left border accent + icon circle + description subtitle
- Refactor `CompactSkill` component with card styling, better spacing
- Add a gradient CTA card at the bottom
- Import additional icons: `ShieldAlert`, `GraduationCap`, `Cpu`, `BookOpen`

No new dependencies needed — uses existing shadcn Card, Badge, and Lucide icons.

### Files Changed
- `src/pages/Analysis.tsx` — UI refactor for stats cards, task cards, skill cards, and CTA banner

