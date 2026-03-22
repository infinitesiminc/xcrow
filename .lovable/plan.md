

## XP System Analysis — Optimal Ranges for 183 Skills

### Current XP Award Logic (what actually happens today)

```text
XP_PER_SIM = 100 (flat)
Skills matched per sim: 1-5 (keyword matching)
XP per skill = 100 / numMatched ≈ 20-100 XP per skill per sim
No score multiplier — same XP whether you score 30% or 95%
```

### Engagement Model

Assumptions for a typical user:
- **Casual**: 2-3 sims/week (~10 min each)
- **Active**: 5-7 sims/week  
- **Power**: 10+ sims/week
- Each sim awards XP to **2 skills** on average (based on job_future_skills linkage)
- A user will naturally explore ~20-40 skills before focusing

### Proposed XP-per-Sim Formula

```text
Base XP per matched skill:  40 XP
Score multiplier:           × (overallScore / 50)  → 0.0x to 2.0x
Context bonus:              +20 XP (first time in a new job context)

Typical range per skill per sim:
  Poor performance (30%):   40 × 0.6 = 24 XP
  Average (65%):            40 × 1.3 = 52 XP  
  Strong (85%):             40 × 1.7 = 68 XP
  Perfect (100%):           40 × 2.0 = 80 XP + 20 context = 100 XP max

Median expected:            ~55 XP per skill per sim
```

### Tier Thresholds — Time-to-Tier Analysis

```text
Tier          XP      Sims to reach   Casual (wks)   Active (wks)
─────────────────────────────────────────────────────────────────
Novice         0      —               —              —
Apprentice   150      ~3 sims         1-2 wks        <1 wk
Adept        500      ~9 sims         3-4 wks        1-2 wks
Master      1200      ~22 sims        8-10 wks       3-4 wks
Grandmaster 2500      ~45 sims        16-20 wks      6-8 wks
```

**Why these numbers work:**
- **Apprentice at 150**: Quick enough that 2-3 focused sims "claim" a castle visually. First session feels rewarding.
- **Adept at 500**: ~1 month of casual play. Feels like a real achievement. This is when the Fortress visual upgrade kicks in.
- **Master at 1200**: ~2 months. Requires genuine depth — you can't get here by accident. Citadel earned.
- **Grandmaster at 2500**: ~4-5 months. True mastery. Glow effect. Bragging rights.

**Full catalogue perspective (183 skills):**
- Reaching Apprentice across ALL 183 skills = 183 × 150 = 27,450 total XP → ~500 sims → ~2 years casual
- Reaching Adept across 30 skills (a realistic breadth goal) = 15,000 XP → ~270 sims → ~6 months active
- This prevents "completion" feeling while keeping per-skill progress tangible

### Castle Tier Mapping

```text
Castle Visual    XP Threshold    Level Name
─────────────────────────────────────────
🏚️ Ruins         0              Novice (unclaimed)
🏕️ Outpost       150            Apprentice (claimed!)
🏰 Fortress      500            Adept
⚔️ Citadel       1200           Master
⚔️✨ Citadel+Glow 2500          Grandmaster
```

### Player Tier (aggregate across all skills)

```text
Tier         Total XP     ~Meaning
──────────────────────────────────────────────
Recruit        0          Just started
Explorer     500          Claimed a few castles
Strategist  3000          Building real territory
Commander  10000          Serious coverage
Legend     30000          Deep mastery across domains
```

### Changes from Previous Plan

| Aspect | Previous Plan | Revised |
|--------|--------------|---------|
| Apprentice threshold | 200 | **150** (faster first reward) |
| Adept threshold | 600 | **500** (rounder number, ~1mo casual) |
| Master threshold | 1500 | **1200** (better pacing gap) |
| Grandmaster threshold | 3000 | **2500** (achievable in one semester) |
| Base XP per skill | 50 | **40** (slower burn, score matters more) |
| Max XP per skill/sim | ~125 | **100** (clean number) |
| Player tiers | 4 (Recruit→Commander) | **5** (add Legend at 30K) |

### Files to Modify

Same as previous plan — no changes to file list. The thresholds update in:
- `src/lib/castle-levels.ts` — castle tier thresholds (150/500/1200/2500)
- `src/lib/skill-map.ts` — level definitions, XP formula
- `src/components/territory/CompactHUD.tsx` — player tier thresholds
- `src/components/journey/PlayerHUD.tsx` — player tier thresholds
- `src/components/SimulatorModal.tsx` — XP award calculation (replace flat 100 with score-based formula)

All other changes (unifying to canonical_future_skills, retiring SKILL_TAXONOMY, wiring XP into territory map) remain as previously planned.

