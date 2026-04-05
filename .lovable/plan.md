

## Option A: Right-side Sheet Panel for Full Details

Replace the fixed-width Detail column (col 5) with a slide-out `Sheet` panel that opens when any card is clicked. The 4 remaining columns can now be wider, reducing truncation. The Sheet shows full untruncated text at 400px width.

### Changes

**`src/components/academy/GTMTreeView.tsx`**:

1. **Remove column 5 (Detail)** — delete the `w-56` detail column entirely
2. **Add Sheet state** — `detailItem` state holding the type (`product | vertical | company | lead`) and the data object
3. **Widen remaining columns** — change from `w-48`/`w-44` to `min-w-[180px] flex-1` so they share available space
4. **Wire clicks to open Sheet** — clicking any card sets `detailItem` and opens the Sheet; clicking the same card again closes it
5. **Render Sheet content contextually**:
   - **Product**: full name, target user, all competitors listed, lead count
   - **Vertical**: full segment, DM title, champion title, customer list
   - **Company**: full name, domain, industry, type badge, evidence text, competitor info
   - **Lead**: photo, full name, full title, company, role/type badges, LinkedIn button, email button, product + vertical context
6. **Remove `truncate`** from text inside the Sheet — all text wraps freely at 400px width
7. **Keep `truncate` on column cards** — cards stay compact and scannable

### No other files change. No backend changes.

