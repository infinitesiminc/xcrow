# Xcrow Platform Pivot: Tool-First Career Intelligence

## Vision
Pivot from skill-theory-first to **tool-mastery-first**. Users learn real AI tools relevant to their job, earning durable skill credentials as a byproduct. B2C volume creates demand signals that power B2B enterprise monetization and tool vendor partnerships — a self-reinforcing flywheel.

---

## Phase 1: Tool Atlas — The B2C Magnet (Weeks 1–3)

### 1.1 Tool Data Layer
- [ ] Expand `gtc-tools-registry.ts` into a full `tools` database table (name, company, category, description, logo, website, use_cases, pricing_model, skill_mappings)
- [ ] Create `tool_skill_mappings` junction table linking tools → canonical skills (many-to-many)
- [ ] Seed with 50+ GTC tools already extracted from keynote transcript
- [ ] Add tool categorization: Coding, Agentic, Data/Analytics, Robotics/Physical AI, Security, Infrastructure, Vertical (Healthcare/Auto/etc)
- [ ] Create `user_tool_progress` table (user_id, tool_id, mastery_level, sims_completed, last_practiced)

### 1.2 Tool Atlas UI (Map Integration)
- [ ] Add "Tools" as primary tab in map sidebar (already started in ToolsPanel)
- [ ] Build Tool Atlas grid view — filterable by category, company, relevance to user's role
- [ ] Tool detail drawer: description, what it does, which skills it trains, "Start Practicing" CTA
- [ ] Tool → Skill reverse mapping: clicking a skill shows which tools train it
- [ ] Visual: tool nodes inside territory map (tools live within skill territories)

### 1.3 Stack Builder
- [ ] "My Stack" panel where users curate their personal tool stack
- [ ] Stack recommendations based on job title/role ("Marketing Managers typically use these 8 tools")
- [ ] Stack completeness score: "Your AI toolkit is 40% complete for your role"
- [ ] Shareable stack profile (public URL)

### 1.4 Tool Simulations
- [ ] Adapt existing sim engine to be tool-contextual ("Practice using Cursor for code review" instead of "Practice AI Code Audit skill")
- [ ] Tool-specific scenario templates: each tool gets 3-5 practical scenarios
- [ ] Sim completion → awards XP to both the tool AND mapped skills simultaneously
- [ ] Quick-start: "Try this tool in 2 minutes" lightweight sim format

---

## Phase 2: Enterprise Dashboard — B2B Monetization (Weeks 4–6)

### 2.1 Enterprise Onboarding
- [ ] Enterprise signup flow (separate from individual): company name, size, industry
- [ ] Tool stack upload: CSV import or manual selection of tools the company uses/plans to adopt
- [ ] Department/team structure setup
- [ ] Employee roster import (CSV with email, department, role)

### 2.2 Workforce Readiness Dashboard
- [ ] Readiness heatmap: departments × tool categories, color-coded by proficiency
- [ ] Gap alerts: "Engineering has 12% proficiency in Agentic tools — 3 tools recommended"
- [ ] Per-employee drill-down: individual tool mastery profiles
- [ ] Benchmark against industry averages ("Your team vs. avg Tech company")

### 2.3 Learning Path Deployment
- [ ] Admin creates learning paths: select tools → auto-generates sim sequence
- [ ] Assign paths to teams/departments with deadlines
- [ ] Progress tracking: completion rates, score distributions, time-to-proficiency
- [ ] Automated nudge system: reminders for incomplete paths

### 2.4 Enterprise Pricing & Billing
- [ ] Seat-based pricing: $25/seat/mo (adjust based on market feedback)
- [ ] Stripe integration for enterprise checkout (already have Stripe infra)
- [ ] Admin seat management: add/remove employees
- [ ] Usage analytics: ROI metrics ("Your team's tool proficiency increased 34% this quarter")

---

## Phase 3: Tool Vendor Partnerships — The Third Revenue Stream (Weeks 7–9)

### 3.1 Vendor Analytics Dashboard
- [ ] Demand signals page: "X users explored your tool this month", "Y completed a simulation"
- [ ] Demographic breakdown: by role, industry, company size
- [ ] Conversion funnel: explored → tried sim → added to stack → daily user

### 3.2 Sponsored Placements
- [ ] "Featured Tool" slots in Tool Atlas (marked as sponsored)
- [ ] Sponsored simulations: vendor-funded sims that give users free credits
- [ ] "Recommended by [Vendor]" badge on tool cards
- [ ] CPL (cost-per-lead) model: vendor pays when user clicks through to their product

### 3.3 Vendor Self-Serve Portal
- [ ] Vendor account creation and tool listing management
- [ ] Campaign builder: set budget, target audience (by role/industry), duration
- [ ] Performance reporting: impressions, clicks, sim completions, stack additions

---

## Phase 4: Flywheel Amplification (Weeks 10–12)

### 4.1 Demand Intelligence Reports
- [ ] Monthly "AI Tool Demand Index" — aggregated, anonymized trend data
- [ ] Sellable to analysts, VCs, enterprises as market intelligence
- [ ] Auto-generated from platform usage data

### 4.2 Talent Marketplace Signals
- [ ] Enterprise can flag roles they're hiring for
- [ ] Users with matching tool mastery get "opportunity matched" notifications
- [ ] Privacy-first: users opt-in to be discoverable

### 4.3 Community & Virality
- [ ] Tool review system: users rate and review tools after practicing
- [ ] "Stack of the Week" — featured user stacks
- [ ] Leaderboards by tool category
- [ ] Referral program: "Invite a colleague, both get 5 free credits"

---

## Data Model Changes Summary

### New Tables
| Table | Purpose |
|---|---|
| `tools` | Master tool registry |
| `tool_skill_mappings` | Tool ↔ Skill junction |
| `user_tool_progress` | User's mastery per tool |
| `user_tool_stacks` | User's curated stack |
| `enterprise_accounts` | Enterprise customer accounts |
| `enterprise_tool_stacks` | Company's official tool stack |
| `enterprise_learning_paths` | Assigned learning sequences |
| `tool_vendor_accounts` | Vendor partnership accounts |
| `tool_vendor_campaigns` | Sponsored placement campaigns |

### Modified Tables
| Table | Change |
|---|---|
| `completed_simulations` | Add `tool_id` foreign key |
| `sim_checkpoints` | Add `tool_id` foreign key |

---

## Skill Role Reclassification

The 183 skills shift from **curriculum** to **credential**:

| Before (Skill-First) | After (Tool-First) |
|---|---|
| User picks a skill → theory quiz | User picks a tool → practical task |
| Skills are the game | Skills are the scoreboard |
| "Learn Prompt Engineering" | "Master ChatGPT, Claude, Cursor" |
| 183 learning paths | 183 achievement dimensions |

Skills become:
1. **Achievement badges** earned through tool mastery
2. **Cross-tool connective tissue** linking related tools
3. **Employer-readable proof** (durable signal vs. perishable tool names)
4. **Gap detector** showing which tool categories are underdeveloped

---

## Success Metrics

| Metric | Target (90 days) |
|---|---|
| Tool Atlas MAU | 5,000 |
| Avg tools explored per user | 8+ |
| Stacks created | 2,000 |
| Enterprise pilots signed | 3-5 |
| Tool vendor partnerships | 5-10 |
| B2C → B2B conversion | 2% of active users' employers contacted |

---

## Build Priority (What to Code First)

1. **Tool database table + seed data** (foundation for everything)
2. **Tool Atlas UI in map sidebar** (immediate user value)
3. **Tool → Skill mapping** (connects new system to existing 183 skills)
4. **Tool-contextual simulations** (the "aha moment")
5. **Stack Builder** (engagement + shareable)
6. **Enterprise dashboard MVP** (first B2B revenue)

---

## Legacy Plan (Archived)

### Investors Page — $1M Seed Round
| Bucket | % | Amount | Focus |
|---|---|---|---|
| Engineering | 35% | $350K | AI sim engine, skill graph, infra |
| B2C Growth / Ads | 20% | $200K | User acquisition, paid channels, content |
| B2B School GTM | 20% | $200K | University pilots, partnerships |
| B2B Enterprise Recruiting GTM | 15% | $150K | Employer/recruiter partnerships, ATS integrations, enterprise sales |
| Team | 10% | $100K | Key hires (eng, growth, partnerships) |
