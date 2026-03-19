

## Plan: School Admin Dashboard, Usage Gating, and Student Invite Flow

This plan covers three interconnected features that complete the B2C/B2B monetization system.

---

### 1. School Admin Dashboard (`/school`)

**New pages under a `/school` route group with a dedicated layout and sidebar:**

- **SchoolLayout** — sidebar layout (reuses SidebarProvider pattern from HRLayout) with a `SchoolAdminGate` that checks `is_school_admin` RPC. Sidebar links: Dashboard, Students, Invite, Analytics.

- **SchoolDashboard** (`/school`) — overview cards: total seats, used seats, remaining seats, license expiry. Quick actions: invite students, export usage.

- **SchoolStudents** (`/school/students`) — table of all `school_seats` for the admin's school, showing student name (from profiles), email, status (invited/active/revoked), activated date. Actions: revoke seat (set status to 'revoked'), resend invite.

- **SchoolInvite** (`/school/invite`) — two invite methods:
  1. **Email invite**: textarea for bulk emails (one per line), inserts rows into `school_seats` with `invite_email` and status='invited'. Validates against `total_seats - used_seats`.
  2. **Domain auto-match**: display the school's configured `domain` field. Students who sign up with a matching email domain get auto-provisioned a seat.

- **SchoolAnalytics** (`/school/analytics`) — cohort progress view using existing `get_workspace_progress`-style query but scoped to school seats. Shows: avg XP, simulations completed per student, skill distribution chart.

**Database changes:**
- New RPC `get_school_students(_school_id uuid)` — returns seat + profile data, accessible only to school admins.
- New RPC `get_school_analytics(_school_id uuid)` — aggregates completed_simulations for students with active seats.
- Update `used_seats` on school_accounts via a trigger when school_seats status changes.

**Auth integration:**
- Add `schoolId` and `isSchoolAdmin` to AuthContext by querying `school_admins` on login.
- Add "School Admin" link to Navbar when `isSchoolAdmin` is true.

---

### 2. Usage Gating Enforcement

**The DB functions `check_usage_limit` and `increment_usage` already exist.** The UpgradeModal exists but points to a contact page. Changes needed:

- **Create a `useUsageGate` hook** that:
  1. If `isPro` → always allowed.
  2. Otherwise, calls `check_usage_limit` RPC.
  3. Returns `{ allowed, used, limit, showUpgrade }`.

- **Gate simulation start** in `SimulatorModal.tsx`: before compiling a session, check usage. If not allowed, show UpgradeModal instead. On success, call `increment_usage('simulation')`.

- **Gate analysis** in `Analysis.tsx`: before calling the AI analysis, check usage. If not allowed, show UpgradeModal. On success, call `increment_usage('analysis')`.

- **Update UpgradeModal**: change copy to match new pricing ("Free tier includes 3 simulations and 3 analyses per month"), change CTA to navigate to `/pricing` instead of `/contact`.

- **Update `check_usage_limit` limits**: The DB function currently has limits of 1/1. Update to 3/3 to match the pricing page copy via a migration.

---

### 3. Student Invite + Domain-Matching Activation

**Edge function: `activate-school-seat`** — called on user signup/login:
1. Check if user's email domain matches any `school_accounts.domain` where `plan_status = 'active'`.
2. If match found, check for existing seat. If no seat and seats available, auto-provision: insert into `school_seats` with status='active', increment `used_seats`.
3. If an `invite_email` seat exists matching the user's email, activate it (set `user_id`, status='active', `activated_at`).

**Trigger approach** (simpler alternative): A database trigger on `profiles` INSERT that auto-matches email domains. This avoids needing a separate edge function.

**Implementation: DB trigger `on_signup_check_school_seat`:**
- Fires after INSERT on `profiles`.
- Looks up the user's email from `auth.users`.
- Extracts domain, checks `school_accounts` for a match.
- If match: inserts/activates a seat, increments `used_seats`.

**Invite email flow:**
- When a school admin adds invite emails, those students receive an email (using existing email infrastructure) with a link to sign up.
- On signup, the `activate-school-seat` logic matches their email to the invited seat.

---

### Files to Create
| File | Purpose |
|------|---------|
| `src/layouts/SchoolLayout.tsx` | Layout with sidebar for school admin |
| `src/components/SchoolSidebar.tsx` | Sidebar nav for school admin |
| `src/pages/school/SchoolDashboard.tsx` | Overview + seat counts |
| `src/pages/school/SchoolStudents.tsx` | Student seat management table |
| `src/pages/school/SchoolInvite.tsx` | Bulk invite + domain config |
| `src/pages/school/SchoolAnalytics.tsx` | Cohort progress charts |
| `src/hooks/use-usage-gate.ts` | Usage limit check hook |

### Files to Modify
| File | Change |
|------|--------|
| `src/App.tsx` | Add `/school` route group with SchoolAdminGate |
| `src/contexts/AuthContext.tsx` | Add `schoolId`, `isSchoolAdmin` |
| `src/components/Navbar.tsx` | Show "School Admin" link for school admins |
| `src/components/UpgradeModal.tsx` | Update copy + CTA to /pricing |
| `src/components/SimulatorModal.tsx` | Add usage gate before sim start |
| `src/pages/Analysis.tsx` | Add usage gate before analysis |

### Migrations
1. Update `check_usage_limit` to use 3/3 limits
2. Create `get_school_students` and `get_school_analytics` RPCs
3. Create trigger to auto-update `used_seats` count
4. Create trigger/function for domain-based seat auto-provisioning on signup

