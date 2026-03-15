

## Launch Cleanup: Route Audit & Superadmin Sidebar Section

### Full Route Audit

| Route | Page | Verdict |
|-------|------|---------|
| `/` | Enterprise landing | **Keep** -- public marketing homepage |
| `/analyze` | Index (role analyzer) | **Move to superadmin** -- internal dev/debug tool |
| `/analysis` | Analysis results | **Keep** -- user-facing results page |
| `/team-analysis` | TeamAnalysis | **Keep** -- session-based team results viewer |
| `/auth` | Auth | **Keep** |
| `/dashboard` | Dashboard | **Keep** -- personal user dashboard |
| `/settings` | Settings | **Keep** |
| `/tools` | ToolsMarketplace | **Keep** -- useful public page, add to nav |
| `/contact-org` | ContactOrg | **Remove** -- duplicate of `/contact` with extra org fields; merge into `/contact` |
| `/contact` | Contact | **Keep** -- general contact form |
| `/pricing` | Pricing | **Keep** |
| `/project-staffing` | ProjectStaffing | **Remove** -- orphaned demo, not linked anywhere meaningful |
| `/products/simulation-builder` | SimulationBuilder | **Keep** -- canonical product page |
| `/products/upskilling` | SimulationBuilder (dupe) | **Remove** |
| `/products/candidate-assessment` | SimulationBuilder (dupe) | **Remove** |
| `/products/workforce-planning` | SimulationBuilder (dupe) | **Remove** |
| `/products/career-transition` | SimulationBuilder (dupe) | **Remove** |
| `/products/ld-content-engine` | SimulationBuilder (dupe) | **Remove** |
| `/how-it-works` | SimulationDesign | **Keep** -- public educational page |
| `/simulation-design` | SimulationDesign (dupe) | **Remove** -- redirect or just drop, `/how-it-works` is canonical |
| `/roadmap` | Roadmap checklist | **Move to superadmin** -- internal build tracker |
| `/simulations` | Simulations | **Keep** -- user simulation library |
| `/learning-path` | LearningPath | **Keep** -- user learning dashboard |
| `/join` | JoinWorkspace | **Keep** |
| `/hr/*` | HR Dashboard | **Keep** all sub-routes |

**Orphaned files** (no route): `Heatmap.tsx`, `RolesChart.tsx` -- **Delete**

### Footer Cleanup

- Remove dead `/company-dashboard` link
- Remove `/roadmap` link (superadmin only)
- Replace "Enterprise > Company Dashboard" with "Enterprise > How It Works"
- Keep Product, Account, Company columns clean

### Navbar Cleanup

- Add "Analyze" and "Dashboard" links for authenticated users
- Add "Tools" link for all users
- Keep Products dropdown for unauthenticated users

### Superadmin Sidebar Section

Add a new `SidebarGroup` labeled "Superadmin" at the bottom of `HRSidebar.tsx`:
- Gate visibility on a hardcoded list of superadmin user IDs (checked via `useAuth().user.id`)
- Items: **Roadmap** (`/hr/roadmap`) and **Analyze Tool** (`/hr/analyze`)
- Move these routes under the `/hr` layout so they get the sidebar
- Icon: `Shield` for the group, `Target` for Roadmap, `Search` for Analyze

### Implementation Steps

1. **Clean up routes in `App.tsx`**
   - Remove: `/contact-org`, `/project-staffing`, 5 duplicate `/products/*` routes, `/simulation-design`
   - Move `/roadmap` and `/analyze` under `/hr` as nested routes
   - Delete orphaned files: `Heatmap.tsx`, `RolesChart.tsx`, `ContactOrg.tsx`, `ProjectStaffing.tsx`

2. **Update `HRSidebar.tsx`**
   - Add superadmin section gated by user ID
   - Two items: Roadmap, Analyze Tool

3. **Update `Footer.tsx`**
   - Fix dead `/company-dashboard` link to `/how-it-works`
   - Remove `/roadmap` from public footer

4. **Update `Navbar.tsx`**
   - Add "Analyze" + "Dashboard" for logged-in users
   - Add "Tools" to nav items

5. **Merge `/contact-org` fields into `/contact`**
   - Add optional company/team-size fields to Contact page
   - Delete `ContactOrg.tsx`

