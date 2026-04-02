
## Plan: ICP Tree Map with Distinct Layers

### Problem
Industry verticals (Mid-Market 3PLs, Cold Chain) and buyer personas (Operations Leadership, Facility Management) are mixed at the same level. The ICP framework needs **3 distinct layers**:

```
┌─────────────────────────────────────────────────────────┐
│ LAYER 1: Industry Verticals                             │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ 3PL &    │  │ Cold     │  │ Retail   │               │
│ │ E-comm   │  │ Chain    │  │ Distrib  │               │
│ └────┬─────┘  └──────────┘  └──────────┘               │
│      │                                                   │
│ LAYER 2: Company Segments (click vertical to see)        │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ Mid-Mkt  │  │ Regional │  │ National │               │
│ │ 50-500   │  │ 2-10 DCs │  │ 10+ DCs  │               │
│ └────┬─────┘  └──────────┘  └──────────┘               │
│      │                                                   │
│ LAYER 3: Buyer Personas (click segment to see)           │
│ ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│ │ Ops      │  │ Facility │  │ Supply   │               │
│ │ Leaders  │  │ Mgmt     │  │ Chain    │               │
│ └──────────┘  └──────────┘  └──────────┘               │
├─────────────────────────────────────────────────────────┤
│ Pipeline (filtered)                                      │
└─────────────────────────────────────────────────────────┘
```

### Changes

**1. Add `niche_type` column to `leadgen_niches`** 
Values: `vertical`, `segment`, `persona` — this tags each niche with its ICP layer.

**2. Update `NicheEntry` type and `upsertNiches`** to include `niche_type`.

**3. Redesign `NicheFunnelMap`** to render all visible layers vertically with labeled rows:
- Show all root verticals at top
- When a vertical is selected, show its child segments below
- When a segment is selected, show its child personas below
- Each layer has a labeled header ("Industry", "Segment", "Persona")
- SVG connector lines between parent and children
- Action bar appears at the deepest selected level

**4. Update AI chat niche parsing** in `Leadgen.tsx` to pass `niche_type` based on depth.

### Files
- Migration: add `niche_type` column
- `src/components/leadgen/useLeadsCRUD.ts` — update NicheEntry + upsertNiches
- `src/components/leadgen/NicheFunnelMap.tsx` — multi-layer tree rendering
- `src/pages/Leadgen.tsx` — pass niche_type in upsertNiches calls
