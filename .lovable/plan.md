

# Combine Both Panels into One Unified Left Sidebar

## Problem
The current layout has a left sidebar (w-80) for filters/accounts AND a right context panel (w-96) for market stats/detail. This forces users to scan across the entire map, and the map gets squeezed between two panels.

## Solution
Merge everything into a single left sidebar with tabbed navigation. The map fills all remaining space.

```text
CURRENT:                          PROPOSED:
┌────┬────────────┬──────┐        ┌──────────┬──────────────────────┐
│Left│    MAP     │Right │        │ Unified  │         MAP          │
│w-80│  (narrow)  │w-96  │        │ Sidebar  │      (maximized)     │
│    │            │      │        │ (w-96)   │                      │
│Fltr│            │Mkt/  │   →    │          │                      │
│List│            │Dtl   │        │ [Tabs]   │                      │
└────┴────────────┴──────┘        │ Pipeline │                      │
                                  │ Market   │                      │
                                  │ Detail   │                      │
                                  └──────────┴──────────────────────┘
```

## Tabs

| Tab | Content |
|-----|---------|
| **Pipeline** | Search, stage/type filters, garage discovery controls, account list — current left sidebar |
| **Market** | Breadcrumb geo drill-down, KPI cards, operator leaderboard — current MarketPanel |
| **Detail** | Account/site/garage info, contacts, leadgen — current AccountDetailPanel + DetailPanelContent |

## Interaction Logic
- Clicking a map pin → auto-switch to **Detail** tab
- Geo drill-down in Market tab → map viewport syncs via `MapViewportSync`
- Default view starts on **Pipeline** tab
- Collapsible via × button; floating "Open Panel" button restores it

## Technical Changes

### `src/pages/FlashParkingMap.tsx`
- Replace dual-panel layout with single left sidebar (w-96)
- Add `activeTab: "pipeline" | "market" | "detail"` state, remove `panelMode`
- Move existing sidebar JSX into Pipeline tab content
- Render `MarketPanel` in Market tab
- Render detail content in Detail tab
- Pin click sets `activeTab = "detail"`
- Remove right-side `ContextPanel` usage

### `src/components/enterprise/ContextPanel.tsx`
- Delete file (logic absorbed into FlashParkingMap)

## Files Changed
- **Edit**: `src/pages/FlashParkingMap.tsx` — unified tabbed left sidebar
- **Delete**: `src/components/enterprise/ContextPanel.tsx`

