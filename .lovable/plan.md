

## Single-Screen GTM Explorer with Product→Person Traceability

**Core insight**: The current pipeline treats each step as isolated text. For a company with 10 products, you can't trace "this LinkedIn profile is the decision maker for THIS product line." The fix requires threading product IDs through the entire chain so the final output maps each person back to the specific product they buy.

### Layout

```text
┌─────────────────────────────────────────────────┐
│  Company Header  |  Overall Progress  | Reset   │
├─────────────────────────────────────────────────┤
│  ▼ Company DNA              ✓                   │
│    3-4 bullet summary                           │
│  ▼ Product Lines            ✓                   │
│    Compact cards per product                    │
│  ▼ Product-Market Fit       ✓                   │
│    Pain/Buyer/Entry per product                 │
│  ▼ ICP Tree                 ✓                   │
│    Vertical→Segment→Persona per product         │
│  ▼ Decision Makers          ⏳                   │
│    Grouped by product line                      │
│  ▼ LinkedIn Profiles        🔒                   │
│    Each profile tagged: Product + Role (DM/Champ)│
└─────────────────────────────────────────────────┘
```

### Changes

**1. Frontend — `CompanyExplorer.tsx`** (full rewrite of results view)

- Replace step-by-step wizard with Accordion (Radix, already installed) showing all 6 sections
- After company pick, auto-run all steps sequentially — each step triggers the next on completion
- All sections default expanded; completed ones show checkmark, in-progress shows spinner, pending shows lock icon
- Auto-scroll to currently-analyzing section via `useRef` + `scrollIntoView`
- Remove prev/next buttons, step tab bar, and `currentStep` navigation logic
- Keep industry picker and company picker screens unchanged

**2. Edge Function — `gtm-analyze/index.ts`** (prompt restructure for traceability)

- Add conciseness instruction to ALL step prompts: "Be concise. Use bullets. Under 250 words."
- **product-map**: Instruct AI to assign each product a short ID (P1, P2, P3...) for cross-referencing
- **pmf-matrix**: Reference product IDs from product-map step (passed via `previousResults`)
- **icp-tree**: Build tree PER product ID, not globally — "For P1: Vertical→Segment→Persona"
- **buyer-id**: Group buyers by product ID, tag each as DM/Champion/Influencer
- **linkedin-reveal**: 
  - Extract product-tagged buyer titles from buyer-id output
  - Search Apollo with those titles
  - AI formatting step explicitly maps each found person to: which product (P1/P2/etc), their role (Decision Maker vs Champion), and why
  - Output format per profile:
    ```
    **Name** — Title at Company
    📦 Product: P2 (Cash Offer Upgrade)
    🎯 Role: Decision Maker — controls broker partnerships budget
    🔗 LinkedIn: url
    📧 Email: email
    ```

**3. No other files change** — Academy page, routing, UI components all stay the same.

### How traceability flows

```text
product-map → assigns P1, P2, P3...
     ↓ (previousResults)
pmf-matrix → pain/buyer per P1, P2, P3
     ↓
icp-tree → personas grouped by product
     ↓
buyer-id → "VP Sales (DM for P1), Office Manager (Champion for P2)"
     ↓
linkedin-reveal → real profiles tagged to specific products + roles
```

Each step receives all prior results via `previousResults`, which already works. The key change is making prompts reference product IDs so the chain stays connected.

