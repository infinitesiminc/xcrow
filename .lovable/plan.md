

# Fix Broken Arena Images on Competition Page

## Problem
The Battle Arenas grid shows broken images — most `skill-hero-{id}.png` files don't exist in storage. Only a couple load successfully.

## Solution
Add error handling with graceful fallbacks so broken images display a styled placeholder instead of broken alt text.

### Changes to `src/pages/Competition.tsx`

1. **Replace `<img>` with a stateful image component** that tracks load/error state
2. On error, render a **gradient placeholder** using the territory's HSL color with the territory emoji centered
3. Add `onLoad` to fade in successfully loaded images

### Implementation detail

Create an inline `ArenaCard` component inside Competition.tsx:
- State: `imgStatus: 'loading' | 'loaded' | 'error'`
- On `'error'`: show a gradient background using the territory color with the emoji icon large and centered
- On `'loaded'`: show the image with a fade-in
- The gradient fallback uses `linear-gradient(135deg, hsl(var(--background)), hsl(var(--{territory.cssVar}) / 0.2))` for a cohesive dark look matching the screenshot's aesthetic

This approach ensures the grid always looks polished regardless of which hero images exist in storage.

