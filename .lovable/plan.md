

# Plan: AI Chat Controls Targeting with Reset-to-Default

## Addition: Reset to Default Filters

After the AI or the user customizes targeting (products, personas, location), there needs to be a quick way to restore the original defaults — the selections that were auto-detected during the initial website analysis.

### UX Approach

1. **"Reset" button in TargetZone** — A small ghost button (e.g., `↺ Reset`) appears next to the Generate button whenever the current selections differ from defaults. One click restores the original auto-detected state.

2. **Chat command** — User can type "reset", "start over", or "go back to defaults" and the AI calls `reset_targeting` which restores the saved defaults.

3. **Storing defaults** — When `gtm-analyze` first returns products/personas, save a snapshot as `defaultCards`. Any subsequent chat-driven or manual changes are compared against this snapshot to show/hide the Reset button.

### Technical Changes

**`src/pages/Leadgen.tsx`**
- Add `defaultCards` state — set once when GTM analysis completes
- Pass `defaultCards` and a `onResetToDefaults` callback down to `LeadgenDashboard`
- `onResetToDefaults` sets `droppedCards = defaultCards`
- In SSE parser, handle `reset_targeting` action → same as above

**`src/components/leadgen/TargetZone.tsx`**
- Accept optional `hasCustomizations: boolean` and `onReset: () => void` props
- Show a "↺ Reset" button when `hasCustomizations` is true

**`supabase/functions/leadgen-chat/index.ts`**
- Add `reset_targeting` tool — emits `{ type: "action", action: "reset_targeting" }`
- Update system prompt to mention "reset" / "start over" / "defaults" triggers this tool

### Intent Classification (Updated)

```text
EXPLORE         │ TARGET + GO      │ DIRECT ACTION   │ RESET
"show healthcare"│"find leads"      │"generate now"   │"reset"
"select fintech" │"get healthcare   │"draft email"    │"start over"
                 │ leads"           │                 │"go back to defaults"
                 │                  │                 │
→ Update menu    │→ Update + gen    │→ Execute current│→ Restore defaults
```

### Files Modified
- `supabase/functions/leadgen-chat/index.ts` — add `reset_targeting` tool
- `src/pages/Leadgen.tsx` — store `defaultCards`, pass reset callback, handle action
- `src/components/leadgen/LeadgenDashboard.tsx` — accept controlled props, forward reset
- `src/components/leadgen/TargetZone.tsx` — show Reset button when customized

