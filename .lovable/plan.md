## Account-Based Map Redesign

### New Category System (2 dimensions)

**Account Type** (visual icon):
- 🏢 **Large Venue** — airports, stadiums, medical centers, convention centers
- 🔲 **Fleet Operator** — multi-location parking companies

**Relationship Stage** (marker color):
- 🟢 **Active Partner** — confirmed Flash customer with deployed technology
- 🟡 **Target Account** — identified prospect, not yet a customer
- ⚪ **Whitespace** — large operator with no known Flash relationship

### Map Changes

1. **Default view**: One pin per operator at HQ location
   - Green circle = Active Partner
   - Yellow circle = Target Account  
   - Gray circle = Whitespace
   - Icon overlay distinguishes venue vs fleet

2. **Toggle**: "Show deployed sites" checkbox reveals the 168+ facility-level pins as a subtle gray background layer

3. **Remove** confidence filter (confirmed/likely/possible) entirely from UI

4. **Sidebar**: 
   - Filter by stage: Active / Target / Whitespace
   - Filter by type: Large Venue / Fleet Operator
   - Each card shows: name, HQ, est. spaces, facilities, stage badge
   - Remove the old operator partner chip filters

5. **Legend** updates to show the new color/icon system

### Data Changes

- Merge `flash-prospects.ts` partner/prospect data into a single unified list with a `stage` field
- Add `stage: "active" | "target" | "whitespace"` to each entry
- Deployed locations data file stays untouched, just rendered conditionally

### Files Modified

| File | Change |
|------|--------|
| `src/data/flash-prospects.ts` | Add `stage` field, reclassify entries |
| `src/pages/FlashParkingMap.tsx` | Remove confidence system, add stage/type filters, HQ-only default, toggle for deployed layer |
