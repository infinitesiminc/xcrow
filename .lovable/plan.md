

## Plan: Multi-Tenant Enterprise Architecture for Xcrow

### The Problem

Everything is hardcoded to Flash Parking — account types (`airport`, `fleet_operator`), stage descriptions ("Flash customer"), discovery prompts ("Flash platform"), logos, data files, and even the DB hook (`useDBAccounts`) queries `flash_accounts` directly. A second client (Cliq.com) would need its own instance of all this.

### Architecture: Tenant Configuration Object

Instead of hardcoding per-client logic, we introduce a **tenant config** that drives the entire enterprise console. Each tenant is a JSON-like config object that defines:

```text
┌─────────────────────────────────────────────┐
│  TenantConfig                               │
├─────────────────────────────────────────────┤
│  slug: "flash" | "cliq"                     │
│  name: "Flash Parking" | "Cliq"             │
│  logo: import path or URL                   │
│  industry: "parking-tech" | "events-tech"   │
│  accountTypes: ["fleet_operator", ...]      │
│  stages: { active, target, whitespace, ... }│
│  contextPrompt: "You are prospecting for…"  │
│  scoringWeights: { revenue, employees, … }  │
│  dbTable: "flash_accounts" | "tenant_accts" │
│  mapCenter: { lat, lng, zoom }              │
│  featureFlags: { showMap, showMA, ... }     │
└─────────────────────────────────────────────┘
```

### File Changes

**1. `src/config/tenants.ts` (NEW)**
- Define a `TenantConfig` interface with all the fields above
- Export a `TENANTS` map keyed by slug
- Flash config = current hardcoded values extracted
- Cliq config = new tenant (we'll define once we analyze cliq.com)

**2. `src/config/tenants/flash.ts` (NEW)**
- Flash-specific config: logo, account types, stage labels, discovery prompt context, scoring weights, map center (Austin TX)

**3. `src/config/tenants/cliq.ts` (NEW)**  
- Cliq-specific config: to be populated after analyzing cliq.com

**4. `src/pages/EnterpriseLayout.tsx`**
- Add route parameter `:tenantSlug` to resolve which tenant is active
- Pass `TenantConfig` via React context (`TenantProvider`)

**5. `src/contexts/TenantContext.tsx` (NEW)**
- `TenantContext` providing the active `TenantConfig`
- `useTenant()` hook for child components

**6. `src/components/enterprise/EnterpriseSidebar.tsx`**
- Replace hardcoded `ENTERPRISE_ACCOUNTS` array with entries from `TENANTS` map
- Dynamic logo rendering per tenant

**7. `src/pages/FlashParkingMap.tsx` → `src/pages/TenantAccountMap.tsx` (RENAME)**
- Replace all Flash-specific references with `useTenant()` values
- `FLASH_CONTEXT` prompt → `tenant.contextPrompt`
- `flash_accounts` table → `tenant.dbTable` (or a unified `tenant_accounts` table with a `tenant_slug` column)
- Flash logo → `tenant.logo`
- Map center → `tenant.mapCenter`
- Conditionally show/hide map, M&A section, garage discovery via `tenant.featureFlags`

**8. `src/data/flash-prospects.ts`**
- Extract `AccountType`, `AccountStage`, `STAGE_CONFIG` into tenant config
- Keep Flash-specific seed data but tag with `tenant: "flash"`

**9. `src/components/enterprise/AccountDetailInline.tsx`**
- Replace Flash-specific strings ("Flash customer", "Flash platform") with `tenant.contextPrompt` / `tenant.name`
- M&A section visibility gated by `tenant.featureFlags.showMA`

**10. `src/components/enterprise/AccountListView.tsx`**
- No structural changes needed — already generic enough
- Scoring function uses tenant weights if provided

**11. `src/App.tsx` (routes)**
- Change `/admin/flash` to `/admin/:tenantSlug`
- `EnterpriseLayout` resolves tenant from URL param

**12. Database: `flash_accounts` → add `tenant_slug` column (MIGRATION)**
- Add `tenant_slug TEXT NOT NULL DEFAULT 'flash'` to `flash_accounts`
- Add index on `tenant_slug`
- All queries filter by tenant
- Rename table to `tenant_accounts` (optional, can keep current name)

### What Stays the Same
- Auth, RLS, superadmin gating — unchanged
- `useFlashAccountData` hook — works per-account, tenant-agnostic
- Contact discovery pipeline (leadgen-chat edge function) — already parameterized by prompt
- Account scoring logic — just reads weights from config

### Build Order
1. Create `TenantConfig` type + Flash config extraction
2. Create `TenantContext` + provider
3. Update routing (`/admin/:tenantSlug`)
4. Refactor `FlashParkingMap` → use `useTenant()`
5. Refactor sidebar + detail panel
6. DB migration (add `tenant_slug`)
7. Add Cliq tenant config (after analyzing cliq.com)

### What This Enables
- Spin up a new enterprise client by adding one config file
- Each tenant gets their own account pipeline, discovery prompts, scoring, and branding
- Shared infrastructure: auth, contact DB, activity logs, edge functions

