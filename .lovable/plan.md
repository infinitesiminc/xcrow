

## Flash Partnership Intelligence & Prospecting Tool

### Research Findings from flashparking.com

Scraped all case studies, press releases, news articles, and product pages. Here are the **confirmed partners not yet in the map** that need to be added:

**New partners from case studies:**
- Park Rite (multi-location operator)
- Parkwell Management / The Music Garage (Chicago)
- Omni Hotel (hospitality)
- Downtown Tempe District (municipal)
- Graduate Annapolis (hospitality)
- Bal Harbour Shops (luxury retail, Miami)
- Weymouth Lane Beach (municipal)
- Weston Urban / Renaissance Tower (San Antonio)
- Hotel Californian (Santa Barbara)
- 1111 Lincoln Road (Miami)
- Resort at Squaw Creek (Lake Tahoe)

**New partners from press releases:**
- Miami HEAT / Kaseya Center (400 garage spaces + 50 valet)
- New York Jets / MetLife Stadium (event parking)
- Ball Arena Denver (60 EV charging ports)
- Get My Parking (reseller partnership)

**Acquisitions (Flash-owned entities):**
- Ticketech (NYC metered parking)
- Parkonect
- ZipPark
- Mountain Parking Equipment
- CSI (Northeast)

**Technology/demand partners:**
- ParkMobile/Arrive (8,000+ new locations)
- Waze (30,000+ locations)
- ParkWhiz (Flash-owned marketplace)
- Ticketmaster, AXS, SeatGeek, Vivid Seats

### Implementation Plan

#### 1. Create `src/data/flash-prospects.ts`

Two data sets in one file:

**A. Confirmed Partners** (~25 entries with official stats):
Each entry includes: name, partnerType ("operator" | "venue" | "acquisition" | "technology"), estimatedSpaces, facilityCount, focusArea, hqCity, hqLat, hqLng, website, differentiator, caseStudyUrl

Partners: WallyPark, Diamond Parking, Platinum Parking, Parkway Corp, Park Rite, Parkwell, City of Las Vegas, TMC/LAZ, Miami Design District, Bal Harbour Shops, Omni Hotel, Downtown Tempe, Graduate Annapolis, ParkMobile, Waze, Ticketech, Ball Arena, Kaseya Center (Miami HEAT), MetLife Stadium (NY Jets), One Parking, Get My Parking, CSI, Mountain Parking Equipment

**B. Prospect Operators** (~20 entries):
Each includes: name, accountType ("large_venue" | "fleet_operator"), estimatedSpaces, facilityCount, focusArea, hqCity, hqLat, hqLng, website, differentiator, status ("prospect")

Prospects: ABM Parking (2,000+ locations), Propark Mobility (1,000+ sites), Ace Parking (500+ locations), The Parking Spot (47 airports), Icon Parking (200+ NYC), Towne Park (800+ sites), InterPark, Premium Parking, Park 'N Fly, Colonial Parking, AirGarage, Edison ParkFast, Denison Parking, Douglas Parking, National Parking, Evolution Parking, The Car Park, Indigo Park, United Parking, MuniPark

#### 2. Add new deployment pins to `src/data/flash-parking-locations.ts`

Add ~15 new confirmed locations discovered from case studies:
- Kaseya Center, Miami (Miami HEAT)
- MetLife Stadium, East Rutherford NJ (NY Jets)
- Ball Arena, Denver (EV hub)
- Bal Harbour Shops, Miami
- 1111 Lincoln Road, Miami
- Downtown Tempe, AZ
- Graduate Annapolis, MD
- Hotel Californian, Santa Barbara
- Resort at Squaw Creek, Lake Tahoe
- Weston Urban, San Antonio
- The Music Garage, Chicago

#### 3. Major redesign of `src/pages/FlashParkingMap.tsx`

**Sidebar header**: "Flash Partnership Intelligence" with subtitle "Account growth & deployment tracker"

**Stats banner**: Three metric cards:
- "16,000+" Locations (official)
- "30,000+" Network (via Waze/ParkMobile)
- "~180 Mapped" with coverage gap indicator

**Two tabs** (Deployed | Prospects):

*Deployed tab* — current functionality with one visual change: all pins become light gray as a base layer

*Prospects tab* — scrollable list grouped into:
- "Existing Partners" section showing confirmed Flash partners with their official stats, case study links, and mapped location counts
- "Large Venue Accounts" section (airports, stadiums, convention centers)
- "Fleet Operators" section (multi-location operators)
- Each card shows: name, estimated spaces, facility count, focus area, status badge, differentiator

**Map visual changes:**
- Deployed pins: light gray base layer when Prospects tab active, normal colors when Deployed tab active
- Prospect HQ markers: blue diamonds with account-type icons
- When prospect clicked: InfoWindow shows operator stats and highlights overlapping deployed pins

**Legend** updates to show both marker types

#### Files Modified

| File | Action |
|------|--------|
| `src/data/flash-prospects.ts` | Create — ~45 entries (25 partners + 20 prospects) |
| `src/data/flash-parking-locations.ts` | Edit — add ~15 new confirmed case study locations |
| `src/pages/FlashParkingMap.tsx` | Major edit — tabs, stats, prospect panel, visual reorientation |

