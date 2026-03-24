

# Restructure /about → Problem-Solution Narrative for University Leadership

## Current State
The page is a general "founder manifesto" targeting all segments (professionals, students, institutions). It leads with abstract "Defense → Offense" framing that doesn't speak to a specific buyer.

## Proposed Narrative Arc

```text
1. PROBLEM: The Employability Crisis
   "Your graduates aren't prepared for the jobs that exist now"
   → Data: 69% skill gap in Human Edge, 0% Ethics coverage

2. EVIDENCE: The Skill Gap Is Measurable
   → SkillGapSection charts (already built) — promoted higher
   → Jensen Huang quote reframed as "roles evolve, curricula don't"

3. WHY IT'S GETTING WORSE: AI Agent Evolution
   → AIAgentEvolutionSection (already built) — reframed as
     "the jobs your students will enter look nothing like today"

4. WHY TRADITIONAL FIXES FAIL
   → Courses expire, reading ≠ readiness (existing "Why a Game?" content)
   → Reframed: "Adding an AI elective isn't enough"

5. SOLUTION: Xcrow as Institutional Infrastructure
   → Zero-Gap engine, 183 skills, real-time sim updates
   → L2 checkpoint glimpse (shows depth of training)

6. PROOF & CREDIBILITY
   → Founder letter (kept but shortened)
   → Stats bar (4,176 universities analyzed)

7. CTA: "Schedule a Pilot" / "Talk to Our Team"
   → University-specific language
```

## Specific Changes

### File: `src/pages/About.tsx`

1. **New Hero** — Replace "Defense to Offense" with university-facing headline:
   - *"Your Students Graduate Into an AI Economy. Are They Ready?"*
   - Subtext addresses deans/provosts directly: employability rankings, employer complaints, curriculum lag
   - Badge: "FOR UNIVERSITY LEADERSHIP" instead of "The workforce is under siege"

2. **Move SkillGapSection up** — Immediately after hero as the "proof of problem" section. This is the most compelling data for a dean.

3. **Jensen Huang quote** — Keep but add framing: *"Every discipline your university teaches is undergoing this transformation"*

4. **AI Agent Evolution** — Keep, add intro text: *"The roles your 2027 graduates will fill don't exist in your current curriculum"*

5. **Reframe "Why a Game?"** → **"Why Traditional Approaches Fail"** — Same 4 cards but with university-specific descriptions (e.g., "Your LMS can't regenerate content weekly" instead of generic statements)

6. **Zero-Gap Engine** — Reframe as institutional infrastructure: *"A curriculum layer that never goes stale"*

7. **183 Skills Catalogue** — Keep as-is, it's strong proof of depth

8. **L2 Checkpoint** — Keep, reframe intro: *"This is what your graduates need to be able to do on day one"*

9. **Founder Letter** — Move lower, shorten slightly. Still valuable for credibility but shouldn't lead.

10. **New CTA** — *"Equip Your Institution"* with "Schedule a Pilot" primary button and "Download the Skill Gap Report" secondary

11. **Remove/trim** the "Why the Crow?" section — it's brand storytelling that doesn't serve the university buyer journey. Can keep as a small footnote.

## Technical Details

- All changes in `src/pages/About.tsx` (section reordering + copy rewrites)
- Minor updates to `src/components/about/SkillGapSection.tsx` header copy to address university leaders directly
- No new components needed — this is primarily a content restructure
- Existing `AIAgentEvolutionSection` and `SkillGapSection` components stay intact, just repositioned and given new intro framing in the parent page

