

## Add Bubble Map View to Skills Gap Page

Add an SVG bubble chart alongside the existing heatmap table, with toggleable views. The bubble map plots skills on an XY plane where:

- **X-axis**: Market Demand (task count)
- **Y-axis**: AI Exposure (%)
- **Bubble size**: Proportional to demand count
- **Bubble color**: Coverage % (red=0% → green=100%, matching existing `coverageColor`)
- **Labels**: Skill name inside/beside each bubble
- **Hover tooltip**: Shows skill name, coverage %, demand, AI exposure

### Layout

Add a view toggle (Table | Bubble) at the top of `CrossSchoolSkillsGap`. When "Bubble" is selected, render an SVG scatter-bubble chart using the same `rows` data already computed.

### Changes

**`src/components/admin/CrossSchoolSkillsGap.tsx`**:
1. Add `view` state: `"table" | "bubble"` (default `"table"`)
2. Add toggle buttons next to KPI chips
3. Add `BubbleMap` inline component that:
   - Renders a 600×400 SVG with axes
   - X-axis: demand (0 → maxDemand), Y-axis: AI exposure (0–100%)
   - Each skill = circle positioned by (demand, exposure), radius scaled by demand, fill by `coverageColor(coveragePct)`
   - Category-colored ring or label grouping
   - Hover state shows tooltip with details
   - Axis labels and gridlines for readability
4. Keep existing heatmap table as-is, just conditionally render based on `view`

No database changes needed — uses existing computed `rows` data.

