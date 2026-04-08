

## Flash Parking Map — `/flashparkingmap`

### What We're Building
A research tool page at `/flashparkingmap` that displays an interactive Google Maps view of known Flash Parking technology deployments. Each location gets a marker color-coded by confidence level (Confirmed, Likely, Possible). Users can filter by operator/partner, click markers for details, and browse a sidebar list.

### Prerequisites
- **Google Maps API Key**: Required. You'll need to add a `GOOGLE_MAPS_API_KEY` as a build-time environment variable (via `VITE_GOOGLE_MAPS_API_KEY`). We'll use the `@vis.gl/react-google-maps` library.

### Navigation & UX Design

```text
┌─────────────────────────────────────────────────────┐
│  Navbar                                             │
├──────────┬──────────────────────────────────────────┤
│ SIDEBAR  │                                          │
│          │         GOOGLE MAP                       │
│ Filter   │         (full height)                    │
│ by:      │                                          │
│ □ Conf.  │    🟢 Confirmed  🟡 Likely  🔴 Possible │
│ □ Likely │                                          │
│ □ Poss.  │         Markers clustered               │
│          │         Click → InfoWindow               │
│ Partners │                                          │
│ ☑ Wally  │                                          │
│ ☑ Plat.  │                                          │
│ ☑ LAZ    │                                          │
│ ...      │                                          │
│          │                                          │
│ Location │                                          │
│ List     │                                          │
│ (scroll) │                                          │
└──────────┴──────────────────────────────────────────┘
```

- **Sidebar (left, collapsible on mobile)**: Filter checkboxes by confidence level and by partner/operator. Scrollable location list below filters — clicking a location pans the map and opens its info window.
- **Map (main area)**: Markers with color by confidence. Clustered when zoomed out. InfoWindow on click shows: location name, address, operator, deployment scope, confidence badge, and source link.
- **No auth required** — public research page.

### Technical Plan

1. **Install `@vis.gl/react-google-maps`** npm package

2. **Create data file `src/data/flash-parking-locations.ts`**
   - Hard-coded array of ~40-50 locations extracted from the uploaded MD file
   - Each entry: `{ name, address, lat, lng, operator, scope, confidence: 'confirmed'|'likely'|'possible', notes, sourceUrl }`
   - Geocode coordinates manually for known locations (airports, venues, cities)
   - WallyPark locations (ATL, DEN, JAX, LAX, MCO, PHL, SAN, SEA) all marked as "likely" since case study confirms 10/10 but doesn't specify which
   - Airports with explicit press releases → "confirmed"
   - Portfolio-level mentions (Diamond/Seattle, Platinum/13 markets) → "possible" with city-center pins

3. **Create page `src/pages/FlashParkingMap.tsx`**
   - Full-viewport layout: sidebar + map
   - Sidebar with: confidence filter checkboxes, partner/operator filter checkboxes, scrollable location list with confidence badges
   - Google Map with colored markers (green/yellow/red), marker clustering, and InfoWindows
   - Responsive: sidebar collapses to bottom sheet on mobile

4. **Add route to `src/App.tsx`**
   - Public route: `<Route path="/flashparkingmap" element={<FlashParkingMap />} />`

5. **API Key Setup**
   - The Google Maps JavaScript API key needs to be a **public/client-side** key, so it will be stored as `VITE_GOOGLE_MAPS_API_KEY` in the codebase or as a build secret
   - I'll prompt you to provide it before the map renders

### Confidence Classification Logic
| Level | Color | Criteria |
|-------|-------|----------|
| Confirmed | Green 🟢 | Named in press release or case study with specific facility details |
| Likely | Yellow 🟡 | Operator confirmed as Flash partner; specific location matches operator's known sites |
| Possible | Red 🔴 | Portfolio-level mention only; city-center pin representing "somewhere in this market" |

