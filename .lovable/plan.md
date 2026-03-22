## XP System Redesign — IMPLEMENTED

### What Changed

#### Skill Level Thresholds (per-skill XP → castle tier)
| Level | XP | Castle Visual |
|-------|-----|--------------|
| Novice | 0 | 🏚️ Ruins |
| Apprentice | 150 | 🏕️ Outpost (claimed!) |
| Adept | 500 | 🏰 Fortress |
| Master | 1200 | ⚔️ Citadel |
| Grandmaster | 2500 | ✨ Citadel+Glow |

#### Player Tiers (aggregate total XP)
| Tier | Total XP |
|------|----------|
| Recruit | 0 |
| Explorer | 500 |
| Strategist | 3,000 |
| Commander | 10,000 |
| Legend | 30,000 |

#### XP Formula (per skill per simulation)
```
Base: 40 XP
Score multiplier: × (overallScore / 50) → 0x to 2x
Context bonus: +20 XP (new job context)
Max: 100 XP per skill per sim
```

### Files Modified
- `src/lib/castle-levels.ts` — New thresholds (150/500/1200/2500), added Grandmaster tier, added `calculateSkillXP()`
- `src/lib/skill-map.ts` — Updated LEVELS to 5 tiers (Novice→Grandmaster), legacy fallback uses 40 XP base
- `src/components/territory/CompactHUD.tsx` — Player tiers: Recruit/Explorer/Strategist/Commander/Legend
- `src/components/journey/PlayerHUD.tsx` — Same player tier update
- `src/components/SimulatorModal.tsx` — Score-based XP formula replaces flat 100
- `src/pages/Index.tsx` — Added grandmaster to tier maps
- `src/pages/PublicProfile.tsx` — Added grandmaster to tier maps
- `src/pages/MapPage.tsx` — Updated "Beginner" → "Novice"
- `src/components/territory/MyRolesPanel.tsx` — Added grandmaster to tier colors

### Still TODO (future iterations)
- Wire canonical_future_skills (183 skills) as primary skill source instead of legacy 30-skill SKILL_TAXONOMY
- Match simulation XP to canonical skill IDs via job_future_skills linkage
- Show per-skill XP on Territory Map nodes
- Retire `src/hooks/use-skills.ts` and old `SKILL_TAXONOMY`
