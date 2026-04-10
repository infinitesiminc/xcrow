

## Plan: Account Score Overview + Dual-Purpose Contact Discovery

### What We're Building

1. **Account Score card with explanation** — Add a visible score display (reusing the `accountScore` function) at the top of the account detail view, with a breakdown explaining why this account is worth pursuing for lead generation (stage weight, data completeness, revenue, vendor situation).

2. **Dual "Find" buttons** — Replace the single "Find Decision-Makers" button with two purpose-specific buttons:
   - **Find Solution Buyers** — Targets Flash platform buyers (VP/Dir of Parking Ops, CTO, COO) for sales/partnerships
   - **Find M&A Contacts** — Targets corporate development & finance roles (CFO, Corp Dev, CEO, Board) for acquisition conversations

### File Changes

**`src/components/enterprise/AccountDetailInline.tsx`**
- Export `accountScore` from `AccountListView.tsx` (already exported via the file)
- Add an **Account Score** section after the stage badge, showing:
  - Score ring (same style as list view) with numeric value
  - Text explanation: "Why this account?" with bullet points derived from the scoring factors (e.g., "Active customer (+20)", "Revenue data available (+10)", "Known vendor intel (+5)")
- Split the Contacts section header to show two buttons:
  - "Find Solution Buyers" — calls `onFindContacts(account, "solution")`
  - "Find M&A Contacts" — calls `onFindContacts(account, "ma")`

**`src/pages/FlashParkingMap.tsx`**
- Update `handleFindContacts` to accept a `mode: "solution" | "ma"` parameter
- For `"solution"` mode: keep current prompt targeting parking/ops/tech decision-makers
- For `"ma"` mode: change target titles to CFO, VP Corporate Development, CEO, General Counsel, VP Strategy
- Update the props interface to pass the mode through

**`src/components/enterprise/AccountListView.tsx`**
- Export `accountScore` function (already usable as it's defined at module level — just add `export`)

### Score Explanation Logic

The score breakdown will show which factors contributed:
- Stage bonus (Active +20, Target +15, Competitor +10, Whitespace +0)
- Priority score base value
- Revenue data (+10)
- Employee data (+5)
- Vendor intel (+5)
- Founded year (+5)

Each factor shown as a small chip with its contribution, giving users confidence in why this account deserves attention.

