

## Reclaim Vertical Space for the Account List

### Problem
The sidebar has ~5 fixed sections above the scrollable account list (header, stats banner, search, stage filters, type filters, deployed toggle), consuming over half the viewport height. The list gets squeezed.

### Proposed Approach: Collapsible Filter Section

Wrap the **Stats Banner**, **Stage filters**, **Type filters**, and **Deployed toggle** into a single collapsible section with a small toggle button (e.g., "Filters ▾"). When collapsed, these 4 blocks hide, freeing ~180px of vertical space for the list.

**What stays always visible:**
- Header (logo + title) — brand identity
- Search bar — primary interaction
- Account list — the main content

**What collapses:**
- Stats banner (3 stat boxes + stage counts)
- Stage filter toggles
- Type filter toggles  
- Deployed sites toggle

The section defaults to **expanded** so filters are discoverable, but one click collapses it to maximize list space.

### Implementation

| File | Change |
|------|--------|
| `src/pages/FlashParkingMap.tsx` | Wrap stats + filters in a `Collapsible` from `@/components/ui/collapsible`. Add a small trigger button between search and the collapsible block. Active filter count shown on the trigger when collapsed. |

### Result
- Expanded: identical to current layout
- Collapsed: header + search + full-height list, filters hidden behind a single toggle

