

## Add Company Name and Location to Role Cards

### Current State
- The `RoleCard` interface only has: `title`, `image`, `augmented`, `risk`, `aiOpportunity`, `tag`
- The Supabase query in `Index.tsx` fetches `title, department, augmented_percent, automation_risk_percent, new_skills_percent` — no company or location data
- The `jobs` table has `location` and `company_id` (FK to `companies` table with `name`)

### Plan

**1. Extend data model and query (`src/pages/Index.tsx`)**
- Add `company` and `location` fields to the `RoleCard` interface
- Update the Supabase query to join `companies(name)` and select `location`:
  ```
  .select("title, department, location, augmented_percent, automation_risk_percent, new_skills_percent, companies(name)")
  ```
- Map `companies.name` → `card.company` and `location` → `card.location`

**2. Update RoleCard interface (`src/components/RoleFeed.tsx`)**
- Add optional `company?: string` and `location?: string` to the `RoleCard` interface

**3. Show company + location on Desktop Grid cards**
- Below the title in the card's `p-3` section, show company name and location as a secondary line
- Format: `"Anthropic · Remote" or "Anthropic" or "San Francisco, CA"`

**4. Show company + location on Mobile Feed cards**
- Add below the title `h2` in the bottom-left metadata area
- Subtle white/50 text with company and location

**5. Show company + location in Detail Overlay**
- Add below the title in `RoleDetailOverlay`, and pass company to the "Full Analysis" link

**6. Update analysis navigation**
- Pass `company` name into the `/analysis` URL params where currently it's empty (`company=`)

### Files to modify
- `src/pages/Index.tsx` — query + mapping
- `src/components/RoleFeed.tsx` — interface + display in 3 places (grid, mobile, overlay)

