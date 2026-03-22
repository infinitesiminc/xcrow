

## Prompt Arena Result Cards — Visual Enhancement Plan

### Problem
After the user picks which prompt is better, the "Better approach" / "Less effective" badges and result reveal feel buried and lack visual impact. The feedback moment should be a dramatic RPG reveal.

### Changes — `src/components/sim/PromptArena.tsx`

**1. Victory / Defeat Badges (replace current result strip)**
- Replace the flat text strip (lines 211-226) with full-width animated badge banners:
  - **Winner card**: Gold shield badge with "🏆 Superior Strategy" in Cinzel, glowing filigree border, subtle gold shimmer animation
  - **Loser card**: Muted "💀 Weaker Approach" badge with desaturated styling
  - "Your pick" tag gets a larger, animated treatment — green glow for correct, red pulse for incorrect

**2. Card Border Animations on Reveal**
- Winner card: animated gold glow border pulse (keyframe from `hsl(var(--filigree))` to `hsl(var(--filigree-glow))`)
- Loser card: border dims to near-invisible, card opacity drops to 0.7
- Both use `motion.div` `animate` transitions for smooth state change

**3. Typography Upgrade**
- "Better approach" → "🏆 Superior Strategy" at 15px bold Cinzel
- "Less effective" → "💀 Weaker Approach" at 13px Cinzel, muted
- Correct/Incorrect banner headline bumped to `text-lg` with Cinzel font

**4. Correct/Incorrect Banner Enhancement**
- Correct: Add sparkle particles animation (3 small ✨ dots floating up)
- Incorrect: Subtle shake animation on reveal
- Both banners get stone-textured backgrounds consistent with RPG panels

**5. Key Insight Card**
- Add a scroll/parchment emoji and Cinzel header
- Slightly larger text (14px) for the insight body

### Files Modified
- `src/components/sim/PromptArena.tsx` — all changes in this single file

### No Breaking Changes
- ArenaRound interface unchanged
- All props/callbacks remain the same
- Only visual/animation enhancements

