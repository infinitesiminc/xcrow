## Problem

The enlarged overlay (screenshot) has issues:

1. **Too much vertical space** wasted on the hero section — large readiness ring (120px), big title, stats row, "About" section all push tasks far down
2. **Header is just text links** — no sticky nav bar, so once you scroll the "Back to chat" button disappears
3. Tasks each take a full card with description, making the page very long

## Plan

### 1. Sticky compact header bar

Replace the floating "Back to chat" / bookmark buttons with a **sticky top bar** (`sticky top-0 z-10`) containing:

- Left: "← Back to chat" button  
- Center: role title (truncated)  
- Right: bookmark icon

### 2. Condensed hero section

Merge the readiness ring and stats into a **single horizontal row**:

- Small readiness ring (64px) on the left
- Title + company next to it  
- Stats (Risk / Augmented / Tasks) inline on the right
- Remove the large centered layout — make it a compact flex row

### 3. Remove "About" summary section

The summary paragraph pushes tasks down significantly. Remove it from the enlarged view (it's already visible in the side panel details view).

### 4. make task cards

- task card should look attractive and user friendly to use just like job card with breathing space

### Files changed

- `src/components/RolePreviewPanel.tsx` — refactor the `enlargedOverlay` JSX (lines 188–250)