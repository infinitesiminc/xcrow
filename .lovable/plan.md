

## Integrate Leadgen into Flash Account Map

### What

Add a "Find Contacts" button to the account detail panel. When clicked, it calls the existing `leadgen-chat` edge function (via Apollo) scoped to that account's domain, and displays the resulting decision-maker contacts inline in the detail panel.

### How It Works

1. User clicks an account on the map to open the detail panel
2. A new "Find Contacts" button appears below the existing account info
3. Clicking it calls `leadgen-chat` with a direct `run_lead_search` intent, passing the account's website domain, name, and industry context (focusArea)
4. Results stream in via SSE using the existing `parseSSEStream` utility
5. Contacts appear as a compact list in the detail panel: name, title, LinkedIn link, email

### Implementation

| File | Change |
|------|--------|
| `src/pages/FlashParkingMap.tsx` | Add state for `accountLeads` (map of account ID to leads array) and `loadingLeads` set. Add "Find Contacts" button to `DetailPanel`. On click, invoke `leadgen-chat` edge function with the account's website/domain. Parse SSE stream with `parseSSEStream` from `@/lib/sse-parser`. Render leads inline below account details. |

### Detail Panel Addition

```text
┌─────────────────────────────┐
│  Account Name           [X] │
│  Austin, TX  ● Whitespace   │
│  ┌───────┐  ┌───────┐       │
│  │Spaces │  │Facils │       │
│  └───────┘  └───────┘       │
│  Focus: ...                 │
│  Current Vendor: T2 Systems │
│  Differentiator: ...        │
│  Website | Case Study       │
│─────────────────────────────│
│  [👤 Find Decision-Makers]  │  ← NEW
│                             │
│  Loading... or:             │
│  ┌─────────────────────────┐│
│  │ John Smith              ││
│  │ VP Parking Ops          ││
│  │ 📧 john@co.com  🔗 LI  ││
│  ├─────────────────────────┤│
│  │ Jane Doe                ││
│  │ Director, Technology    ││
│  │ 📧 jane@co.com  🔗 LI  ││
│  └─────────────────────────┘│
└─────────────────────────────┘
```

### Technical Details

- Reuses `parseSSEStream` from `src/lib/sse-parser.ts` for SSE handling
- Calls `supabase.functions.invoke("leadgen-chat", ...)` with `stream: true` option to get raw response
- Passes context: `{ website: account.website, messages: [{ role: "user", content: "Find 5 decision-makers at {account.name} who would buy parking management software" }] }`
- Apollo seniority filters (Director, VP, C-Suite, Owner) are already enforced server-side
- Leads cached in component state keyed by account ID so re-opening the panel shows previous results
- No auth required for the search itself (edge function handles it), but results are ephemeral (not persisted to `saved_leads`)

### Files Modified

| File | Change |
|------|--------|
| `src/pages/FlashParkingMap.tsx` | ~80 lines: contact search state, API call, lead list UI in DetailPanel |

