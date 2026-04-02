

## Plan: Remove WhatsApp, Optimize Pipeline Lead Cards

### Problem
1. LeadsPanel still has WhatsApp button and "Scale" button — these are obsolete since leads now flow directly into the Pipeline
2. Pipeline lead cards are minimal (just initials + name + status dropdown) — they should show person-level detail (title, company, email, phone, linkedin, reason)
3. LeadsPanel component appears unused since the dashboard now shows leads directly in LeadPipeline

### Changes

**1. Upgrade LeadPipeline lead cards (`src/components/leadgen/LeadPipeline.tsx`)**
- Replace the current minimal card (initials circle + name + status dropdown) with a richer person card:
  - Photo avatar (reuse `LeadAvatar` from LeadCard.tsx or inline the same logic)
  - Name, title @ company
  - Contact row: email, phone, linkedin link, website
  - ICP reason line if present
  - Source badge
  - Status dropdown + Draft Email button (keep existing)
- Remove the niche filter tabs at the top (redundant — the sidebar already filters by niche)
- Keep KPI cards, search bar, status filter, and CSV export

**2. Remove LeadsPanel (`src/components/leadgen/LeadsPanel.tsx`)**
- Delete the file — it's no longer used in the layout (LeadgenDashboard + NicheSidebar handle everything)
- Remove any remaining imports of LeadsPanel from Leadgen.tsx if present

**3. Clean up Leadgen.tsx**
- Remove any leftover WhatsApp-related code or state
- Remove LeadsPanel import if still present

### Files to Edit
- `src/components/leadgen/LeadPipeline.tsx` — redesign lead cards with full person detail
- `src/components/leadgen/LeadsPanel.tsx` — delete file
- `src/pages/Leadgen.tsx` — remove dead imports/state

