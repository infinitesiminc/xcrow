

## Level 2 Sentinel's Sanctum — AI Image Enhancement Plan

### Concept

Use the Lovable AI image generation API (Gemini flash-image) to create **dynamic, context-aware visuals** that CSS alone cannot achieve. Each checkpoint gets a unique AI-generated illustration tied to the actual scenario content, making every L2 audit feel bespoke rather than templated.

---

### Where AI Images Add Value

**1. Checkpoint Scene Illustrations**
- When each checkpoint loads, generate a small (256×256) illustration based on the checkpoint's `area` + `aiClaim` text
- Prompt pattern: *"Dark fantasy oracle vision, ethereal indigo glow, showing [area topic] — minimalist, no text, arcane observatory style"*
- Display as a subtle background or card hero image with low opacity overlay
- Cache in Supabase Storage by checkpoint hash to avoid re-generation

**2. Completion "Ascension" Portrait**
- On audit completion, generate a unique sentinel portrait based on the user's score tier
- Grand Sentinel (80%+): radiant oracle with golden halo
- Vigilant Watcher (50-79%): watchful sentinel in violet armor
- Apprentice Seer (below 50%): hooded figure with glowing rune staff
- Display prominently in the completion ceremony screen

**3. Oracle's Claim Visual**
- Generate a small "vision card" illustration for the AI claim being evaluated — a visual representation of the future scenario described
- Makes the abstract AI prediction feel tangible and real

---

### Implementation

**Backend: New edge function `generate-sim-image`**
- Accepts: `prompt` string, `cacheKey` string
- Checks Supabase Storage for cached image by key
- If miss: calls Gemini flash-image API, uploads result to `sim-images` storage bucket, returns public URL
- If hit: returns cached URL directly

**Frontend: `GuidedAudit.tsx` changes**
- Add `useEffect` per checkpoint step that calls `generate-sim-image` with a constructed prompt
- Display image with fade-in behind checkpoint card (opacity 0.12 as atmospheric background)
- Completion screen triggers portrait generation on mount
- All images are non-blocking — UI renders immediately, images fade in when ready

**Storage: New `sim-images` bucket**
- Public read, service-role write
- Images cached by hash of prompt to prevent duplicate generation

---

### Files Modified
1. `supabase/functions/generate-sim-image/index.ts` — new edge function
2. `src/components/sim/GuidedAudit.tsx` — image fetch + display logic
3. Database migration — create `sim-images` storage bucket with public policy

### Combined with CSS Plan
This layers on top of the existing Sentinel's Sanctum CSS changes (rune stones, violet gradients, animations). The AI images add atmosphere while CSS handles the core UI structure.

### Performance Guardrails
- Images load async, never block interaction
- Cache-first strategy eliminates repeated API calls
- Fallback: if generation fails, component renders normally without images (graceful degradation)

