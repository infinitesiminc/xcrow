

## Add Flash Competitors to the Map

### What

Add a new **"Competitor"** category to the account-based map, showing Flash's direct competitors as red pins at their HQ locations. This turns the tool into a full competitive landscape view alongside the existing partner/prospect/whitespace layers.

### Data Changes — `src/data/flash-prospects.ts`

1. Add a new `AccountStage` value: `"competitor"`
2. Add `STAGE_CONFIG` entry for competitor: red marker color (`#ef4444`), label "Competitor"
3. Add 5 competitor entries to `FLASH_ACCOUNTS`:

| Name | HQ | Type | Core Focus |
|------|-----|------|------------|
| T2 Systems | Indianapolis, IN | fleet_operator | Integrated parking & mobility tech |
| Metropolis Technologies | Santa Monica, CA | large_venue | AI & computer vision PARCS |
| ParkHub | Dallas, TX | large_venue | Event & asset management |
| SpotHero | Chicago, IL | fleet_operator | Digital parking reservations |
| Passport | Charlotte, NC | fleet_operator | Mobile payments & curb management |

### UI Changes — `src/pages/FlashParkingMap.tsx`

1. Add "Competitor" to the stage filter toggle row (red button)
2. Red circle pins with a distinct icon (e.g., `Swords` or `Shield` from lucide) on the map
3. Competitor cards in the sidebar list, styled with red accent
4. Detail panel shows competitor-specific info (core focus, funding context in differentiator)
5. Legend updated with the red competitor marker
6. Stats banner adds a "Competitors" count

### Visual Summary

```text
Pin Colors:
  🟢 Active Partner     — green
  🟡 Target Account     — yellow  
  ⚪ Whitespace          — gray
  🔴 Competitor          — red (NEW)
```

### Files Modified

| File | Change |
|------|--------|
| `src/data/flash-prospects.ts` | Add `"competitor"` stage, config, and 5 entries |
| `src/pages/FlashParkingMap.tsx` | Red filter toggle, red pins, legend update |

