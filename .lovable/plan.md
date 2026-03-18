

## Problem

The saved roles section currently renders a flat list capped at 8 items with a "+N more" label. With 50 saved jobs this means:
- 42 roles are completely hidden and inaccessible
- No search/filter to find a specific saved role
- No grouping — just a long list of titles
- The section dominates the sheet even at 8 items

## Plan

**Redesign the Saved Roles section in `ProfileSheet.tsx` to handle scale:**

1. **Compact default view** — show only the first 3-4 saved roles, with a "View all N saved" button
2. **Expandable list with search** — tapping "View all" expands to a scrollable sub-section with:
   - A small search/filter input at the top
   - Roles grouped by company (collapsible accordion-style)
   - Virtual scrolling not needed at 50 items, but capped height with overflow-y-auto
3. **Company grouping** — group saved roles by `company`, showing company name as a header with role count, and individual role titles underneath. Roles with no company go under "Other".
4. **Search filter** — simple text filter matching job title or company name, filtering the grouped list in real-time

### UI structure (expanded state)
```text
📚 SAVED ROLES · 50
┌─────────────────────────┐
│ 🔍 Filter saved roles…  │
├─────────────────────────┤
│ ▼ Anthropic (3)         │
│   Research Engineer      │
│   ML Engineer            │
│   Policy Analyst         │
│ ▼ Google (5)            │
│   Software Engineer      │
│   ...                    │
│ ▼ Other (2)             │
│   ...                    │
└─────────────────────────┘
```

### Changes
- **`src/components/ProfileSheet.tsx`**: 
  - Add `expandedSaved` state toggle and `savedSearch` filter state
  - Group `savedRoles` by company using a `useMemo`
  - Default: show 3 roles + "View all N" button
  - Expanded: show search input + grouped list in a max-height scrollable container
  - Each group is a collapsible section (company header + roles)

