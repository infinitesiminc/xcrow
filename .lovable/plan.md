

# Unified Map + Dashboard Experience

## Vision

Replace the separate Market Dashboard page with an integrated panel inside the existing Flash map. The map stays permanently visible while a collapsible right-side panel shows contextual stats that update as the user navigates geographically.

```text
┌──────────────┬──────────────────────┬─────────────────┐
│  Enterprise  │                      │  Context Panel  │
│  Sidebar     │       MAP            │  (right, ~380px)│
│              │                      │                 │
│              │                      │  ┌───────────┐  │
│              │                      │  │ Breadcrumb│  │
│              │                      │  │ KPI Cards │  │
│              │                      │  │ Geo Groups│  │
│              │                      │  │ Op Table  │  │
│              │                      │  └───────────┘  │
│              │                      │        OR       │
│              │                      │  ┌───────────┐  │
│              │                      │  │ Location  │  │
│              │                      │  │ Detail    │  │
│              │                      │  │ + LeadGen │  │
│              │                      │  └───────────┘  │
├──────────────┤                      ├─────────────────┤
│ Left sidebar │                      │ Toggle: Stats / │
│ (filters,    │                      │ Detail / Hide   │
│  accounts)   │                      │                 │
└──────────────┴──────────────────────┴─────────────────┘
```

## How It Works

1. **Right context panel** replaces both the current `DetailPanel` and the standalone `MarketDashboard` page. It has two modes:
   - **Market Stats mode**: Shows the breadcrumb drill-down (Country → State → City), KPI cards, geo sub-groups, and operator leaderboard — the current `MarketDashboard` content, condensed into a scrollable panel.
   - **Location Detail mode**: When a user clicks a specific garage/account pin, the panel switches to show the existing detail view (vendor info, photos, lead gen).

2. **Geographic sync with map**: Drilling into a geo group (e.g., clicking "California" → "Los Angeles" → "Hollywood") pans/zooms the map to that region and filters displayed garages. The panel stats update to show only that area's data.

3. **Panel toggle**: A floating button group on the map lets users switch between Stats / Detail / Hidden. Clicking a pin auto-opens Detail mode; clicking breadcrumb nav returns to Stats mode.

4. **Route consolidation**: Remove `/admin/flash/market` as a separate route. The market dashboard becomes a panel state within `/admin/flash`, controlled by query params or component state.

## Technical Plan

### Step 1: Create `MarketPanel` component
Extract the dashboard logic from `MarketDashboard.tsx` into a new `src/components/enterprise/MarketPanel.tsx` that renders inside a fixed-width right panel instead of a full page. Accept `country/state/city` as props (not URL params). Emit events when the user drills into a geo group so the parent can sync the map viewport.

### Step 2: Create unified `ContextPanel` wrapper
Build `src/components/enterprise/ContextPanel.tsx` — a right-side sliding panel (~384px) with two tabs/modes:
- `"market"`: Renders `MarketPanel`
- `"detail"`: Renders existing `DetailPanel` content (account/site/garage info + lead gen)
- Panel can be collapsed entirely

### Step 3: Integrate into `FlashParkingMap.tsx`
- Replace the current `DetailPanel` overlay with `ContextPanel`
- Add state for active geo context (`{country, state, city}`) and panel mode
- When user clicks a pin → set mode to `"detail"`, show location info
- When user clicks "Market Stats" toggle → set mode to `"market"`
- When user drills into a geo group in MarketPanel → update map center/zoom + filter displayed garages to that region
- When at city level and user clicks "View on Map" for an operator → filter/highlight that operator's pins

### Step 4: Map viewport sync
- Maintain a lookup of approximate center coordinates per country/state/city (can derive from garage data centroids)
- When geo drill-down changes, call `map.panTo()` and `map.setZoom()` to frame the selected region
- Filter `displayedGarages` to match the current geo selection

### Step 5: Route cleanup
- Remove the `/admin/flash/market` route from `App.tsx`
- Update `EnterpriseSidebar` to remove the Market Dashboard link (or change it to open the panel in stats mode)
- Keep `MarketDashboard.tsx` file but repurpose it as a re-export or remove it

### Step 6: Panel toggle UI
Add a floating control (bottom-right or top-right of map) with icons for:
- 📊 Market Stats (opens/focuses stats panel)
- 📍 Location Detail (shows last selected pin)
- ✕ Close panel

## Files Changed
- `src/components/enterprise/MarketPanel.tsx` — new, extracted dashboard logic
- `src/components/enterprise/ContextPanel.tsx` — new, unified right panel
- `src/pages/FlashParkingMap.tsx` — integrate ContextPanel, remove DetailPanel, add geo sync
- `src/App.tsx` — remove `/admin/flash/market` route
- `src/components/enterprise/EnterpriseSidebar.tsx` — remove or update Market Dashboard link
- `src/pages/MarketDashboard.tsx` — delete or keep as redirect

