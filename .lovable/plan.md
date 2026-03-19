
## Completed: Skill Map as Single Mental Model

### What was built

1. **Shared Skill Taxonomy** (`src/lib/skill-map.ts`) — 26 skills, 6 categories, XP/level system (Beginner→Developing→Proficient→Expert), keyword matcher
2. **DB migration** — Added `skills_earned jsonb` to `completed_simulations`
3. **SkillMapGrid** (`src/components/settings/SkillMapGrid.tsx`) — Gamified grid replacing bullseye, organized by category, with detail sheet
4. **JourneyDashboard** — Rewritten to use SkillMapGrid instead of CareerReachMap
5. **Journey page** — Renamed to "Skill Map" in navbar, fetches `skills_earned`
6. **SimulatorModal** — Removed objectives sidebar, scaffolding labels, review screen; done screen now shows animated skill XP cards; saves `skills_earned` to DB
7. **SkillSuggestionCards** — Rewritten as mini skill progress rings with level indicators
8. **RolePreviewPanel** — Skill pills added below each task (+Strategy, +Data Analysis)
9. **Career chat prompt** — Reframed as skill-building coach for students
10. **Homepage suggestions** — Student-oriented prompts
