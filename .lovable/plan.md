

## Floating Search Button → Full-Screen Overlay

### Current State
- Desktop: A small "Search any role..." pill in the top filter bar opens a bottom sheet with `RoleSearchAutocomplete`
- Mobile: A "Search" action button in the right rail opens the same bottom sheet
- The bottom sheet contains the search input, JD upload options, and autocomplete results

### Plan

**1. Add a floating search FAB to the feed**
- Replace the current inline search pill (desktop) and action button (mobile) with a persistent floating button
- Position: bottom-right on desktop (`fixed bottom-6 right-6`), bottom-center on mobile
- Style: Glassmorphic pill with search icon + "Search any role" text on desktop, icon-only circle on mobile
- Subtle glow animation (neon purple pulse) to draw attention

**2. Build a full-screen search overlay**
- Replace the current bottom sheet in `Index.tsx` with a full-screen overlay (`fixed inset-0 z-50`)
- Dark backdrop with blur (`bg-black/80 backdrop-blur-xl`)
- Centered search input at ~40% from top, large and prominent
- Framer Motion entrance: fade + scale-in from the FAB position
- Exit: reverse animation back to FAB

**3. Overlay layout**
- Top: Close button (X) top-right
- Center: Large search input with `RoleSearchAutocomplete` (reuse existing component)
- Below input: JD upload toggles (paste/URL/file) — same as current but styled for dark overlay
- Below that: Autocomplete dropdown results (already handled by `RoleSearchAutocomplete`)
- Bottom section: `CompanyPills` for quick discovery when input is empty
- Optional: Recent searches if user is logged in

**4. Files to modify**
- `src/components/RoleFeed.tsx` — Replace search pill/button with floating FAB, pass `onOpenSearch` callback
- `src/pages/Index.tsx` — Replace bottom sheet `AnimatePresence` block with full-screen overlay component
- No new components needed; restructure existing JSX

**5. Animations**
- FAB: `whileHover={{ scale: 1.05 }}`, subtle neon glow keyframe
- Overlay open: `opacity 0→1` + content `scale(0.95)→scale(1)` with spring physics
- Overlay close: reverse with `exit` variants
- Search results: staggered fade-in (already present in autocomplete)

