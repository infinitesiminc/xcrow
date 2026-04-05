

# Lead Hunter: 5-Step Sequential UX

## Current State
The flow currently is: pick industry → pick company → run all analysis + lead gen → show results. The "confirm location" step was added but is still a static form. There's no chat integration in the lead hunter flow.

## Proposed 5-Phase Flow

```text
Phase 1: Website Input
  └─ URL entry (already works via homepage → /leadhunter?website=...)

Phase 2: ICP Framework (no leads yet)
  └─ Run steps 1-3 (products, customers, icp-buyers)
  └─ Show GTMTreeView with products + verticals + named customers
  └─ BUT no leads column — just the ICP framework map
  └─ Clear "Ready to generate leads" CTA at bottom

Phase 3: Chat-Guided Strategy
  └─ Inline chat panel opens (not floating dock)
  └─ Pre-populated with ICP summary context
  └─ User can: type location, upload brochure/file, describe niche
  └─ Chat supports file/image upload via existing chat infra
  └─ AI confirms strategy and triggers lead gen

Phase 4: First Batch (5 leads)
  └─ Leads appear in the tree view
  └─ Pipeline runs linkedin-profiles step with chat-derived context

Phase 5: Continued Lead Gen
  └─ "+5 More" buttons per vertical (existing)
  └─ Strategy buttons: "Target competitor customers", "Lookalike search"
  └─ Chat remains available for ad-hoc direction
```

## Technical Plan

### 1. Update ExplorerPhase type and flow control
- Change phases to: `"input" | "icp-mapping" | "strategy-chat" | "first-batch" | "explore"`
- Remove `pick-industry` and `pick-company` phases (homepage handles input)
- Remove `confirm-location` phase (replaced by chat)

### 2. Show ICP framework without leads (Phase 2)
- After steps 1-3 complete, assemble partial tree data (products, customers, mappings) but with empty `leads: []`
- Render GTMTreeView in a "framework-only" mode — hide the leads column, show products + verticals + named customers
- Add a prominent CTA: "Define your lead strategy →"

### 3. Inline strategy chat (Phase 3)
- Add a chat panel below the ICP framework (not a floating dock)
- Pre-seed with a system message summarizing the ICP: "I've mapped [company]'s products and buyer profiles. Tell me where to focus: location, specific vertical, competitor to target, or upload a brochure."
- Support file/image upload via a file input button (uploads to storage, sends URL to edge function)
- Wire to existing `leadgen-chat` edge function with ICP context injected
- When user confirms direction, extract location/vertical/priority and trigger Phase 4

### 4. First batch generation (Phase 4)
- Call `gtm-analyze` linkedin-profiles step with chat-derived parameters
- Transition GTMTreeView to full mode showing leads
- Show "Generating first 5 leads..." inline status

### 5. Continued lead gen (Phase 5)
- Keep existing "+5 More" per vertical
- Add strategy action buttons below the lead list:
  - "Target competitor customers" — filters conquest targets
  - "Find lookalikes" — uses existing lead context
  - "Refine with chat" — reopens/scrolls to chat panel
- Chat panel remains visible and contextual

### Files to modify
- **`src/components/academy/CompanyExplorer.tsx`** — Restructure phases, add chat panel, remove industry/company pickers
- **`src/components/academy/GTMTreeView.tsx`** — Add `frameworkOnly` prop to hide leads column, add strategy action buttons
- **`src/components/academy/gtm-types.ts`** — No changes needed
- **`supabase/functions/gtm-analyze/index.ts`** — Minor: accept chat-derived context (vertical filter, competitor focus) in linkedin-profiles step
- **New: `src/components/academy/StrategyChatPanel.tsx`** — Inline chat component with file upload, wired to leadgen-chat function with ICP context

### Chat panel details
- Simple message list + input with file upload button
- Files uploaded to Supabase storage bucket, URL passed to edge function
- Edge function uses document content (via AI vision for images, text extraction for PDFs) to refine lead search parameters
- Chat messages stored in component state (not persisted — session-only)

