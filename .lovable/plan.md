## Profile & Settings Page — Scope Alignment

### Current State

The Settings page (`/settings`) has three sections: **Profile**, **Security**, and **Danger Zone**. The Profile section includes avatar picker, display name, username/public profile URL, career stage toggle, job title, company, school, LinkedIn, and CV upload. There's also a separate `ProfileSheet` slide-over panel (used from Navbar) that shows journey stats, milestones, and saved roles.

### What to Change

For an RPG skill-quest platform, the Settings page has too many traditional "job board" fields that don't match the game-first identity. Here's the recommended simplification:

#### 1. Remove fields that don't serve current scope

- **LinkedIn URL** — not relevant to gameplay
- **CV / Resume upload** — this is a job-board feature, not an RPG platform feature
- **Company** — only useful if user is "professional"; keep but make less prominent
- **Public profile username** — keep, this is good for sharing territory

#### 2. Keep and enhance

- **Avatar picker** — core RPG feature, already implemented
- **Display name** — essential
- **Career stage toggle** (student/professional) — drives content personalization
- **Job title / Target role** — needed for quest recommendations
- **School** — needed for student flow, autocomplete from our school database or can add custom

#### 3. Add a "Subscription" section

- Show current plan (Free / Pro / School) with badge
- Link to manage subscription (Stripe portal) or upgrade CTA

#### 4. Deprecate ProfileSheet

- The `ProfileSheet` slide-over duplicates journey stats that belong on the dashboard (`/` Index page), not in a profile drawer
- Replace the Navbar avatar click with a simple dropdown: **Settings**, **Sign out**
- Journey stats (roles explored, tasks practiced, milestones) already live on the dashboard

### Summary of Settings sections after cleanup

```text
Settings
├── Profile
│   ├── Avatar picker (10 mascots)
│   ├── Display name
│   ├── Username (public profile URL)
│   ├── Career stage (student / professional)
│   ├── Job title or Target role
│   ├── School (if student)
│   └── Save button
├── Subscription
│   ├── Current plan badge
│   └── Manage / Upgrade button
├── Security
│   └── Change password
└── Danger Zone
    └── Delete account
```

### Files to modify

- `**src/pages/Settings.tsx**` — Remove LinkedIn, CV upload fields; add Subscription section
- `**src/components/ProfileSheet.tsx**` — Can be deprecated (remove file) or kept minimal
- `**src/components/Navbar.tsx**` — Simplify avatar click behavior (dropdown instead of ProfileSheet)

### No database changes needed