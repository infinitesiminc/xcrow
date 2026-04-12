

# Public Pages Audit — Enterprise GTM Lead Gen Brand

## Current State Summary

Xcrow has **7 public pages** (Home, Auth, Privacy, Terms, Cookies, Unsubscribe, 404) and a **Footer/Navbar** shared across them. Here's what needs fixing:

---

## Critical Issues

### 1. Outdated Copy — Still References Old Product (Career/Education Platform)
- **Terms.tsx** (Section 2): Says "AI-powered career readiness tools including role analysis, skill mapping, AI simulations, and workforce analytics"
- **Terms.tsx** (Section 7): References "Schools and employers" purchasing seats
- **Privacy Policy** (Section 1): Mentions "Educational Data: Job titles, skills, career stage, and school affiliation"
- **Auth.tsx**: Says "Track your practice progress" (sign-up subtitle) and "Sign in to view your dashboard" — both remnants of an education product
- **robots.txt**: Still disallows `/school`

**These are brand-destroying for an enterprise B2B lead gen tool.**

### 2. Dead Footer Links
The Footer links to **16 pages that don't exist** — they all redirect to `/`:
- How It Works, Pricing, Blog, Demo (Product column)
- SaaS, Agencies, Recruiting, Consulting, E-commerce (Use Cases column)  
- vs Apollo, vs Clay, vs ZoomInfo, vs LinkedIn (Compare column)
- About (Company column)

Enterprise buyers clicking these get silently redirected home. This kills credibility.

### 3. Sitemap References Ghost Pages
`sitemap.xml` lists 27 URLs including blog posts, use cases, comparison pages, and contact — none of which exist. Google will crawl these and find redirects, hurting SEO.

### 4. SEO Domain Mismatch
- `SEOHead.tsx` uses `xcrow.ai` as canonical URL
- Welcome email uses `xcrow.lovable.app`
- Need to decide which is the production domain and standardize

### 5. Missing Enterprise Trust Signals on Landing Page
- No "How It Works" section (3-step visual)
- No social proof beyond company logo marquee (no testimonials, case studies, or metrics)
- No security/compliance mention (SOC2, GDPR, data handling)
- No pricing section on the landing page itself

### 6. Auth Page — Not Enterprise-Grade
- Generic copy ("Track your practice progress")
- No branding (no logo on the auth page)
- No link to terms/privacy during signup (compliance risk)

### 7. 404 Page — Bare Minimum
- No branding, no navigation, no search suggestion

---

## Implementation Plan

### Step 1: Fix Legal Pages (Terms, Privacy, Cookies)
Rewrite all three to accurately describe Xcrow as an **enterprise B2B lead generation platform**:
- Terms: Remove career/education/school references. Describe the service as AI-powered lead discovery and outreach. Remove "Institutional Accounts" section.
- Privacy: Replace "Educational Data" with "Business Data: company domain, job titles, lead contact information." Update data usage to reflect lead gen context.
- Cookies: Minor — mostly fine, just update any stale references.

### Step 2: Fix Auth Page
- Add Xcrow logo at top
- Update copy: "Create your account" / "Start generating leads"
- Add terms/privacy agreement checkbox or link below sign-up button
- Remove stale "practice progress" language

### Step 3: Clean Up Footer
Remove all dead links. Simplify to only pages that actually exist:
- **Product**: Lead Gen
- **Company**: Privacy, Terms, Cookies
- Add contact email (e.g., hello@xcrow.ai)

### Step 4: Fix robots.txt and sitemap.xml
- **robots.txt**: Remove `/school` disallow. Keep `/admin`.
- **sitemap.xml**: Strip all non-existent URLs. Keep only: `/`, `/privacy`, `/terms`, `/cookies`, `/auth`

### Step 5: Fix Navbar
- Remove "How It Works" and "Pricing" nav items for logged-out users (they redirect to `/` anyway)

### Step 6: Upgrade Landing Page
- Add a **"How It Works"** 3-step section (Paste URL → AI Analyzes → Get Leads)
- Add a **trust/security strip** (data encryption, GDPR-compliant, no data sharing)
- Add enterprise-grade language: "Trusted by GTM teams" instead of "Works with any B2B company"

### Step 7: Upgrade 404 Page
- Add logo, Navbar, and a proper "page not found" design with a CTA back to home

### Step 8: SEO Cleanup
- Standardize canonical URLs in SEOHead to match actual production domain
- Add `og:type`, `twitter:card` meta tags

---

## Files to Modify
| File | Change |
|---|---|
| `src/pages/Terms.tsx` | Full rewrite for B2B lead gen |
| `src/pages/PrivacyPolicy.tsx` | Full rewrite for B2B lead gen |
| `src/pages/Auth.tsx` | Add logo, fix copy, add legal links |
| `src/pages/NotFound.tsx` | Add branding and navigation |
| `src/pages/Index.tsx` | Add "How It Works" + trust section |
| `src/components/Footer.tsx` | Remove dead links, simplify |
| `src/components/Navbar.tsx` | Remove dead nav items |
| `src/components/SEOHead.tsx` | Add missing meta tags |
| `public/robots.txt` | Remove `/school` |
| `public/sitemap.xml` | Strip non-existent URLs |

**Estimated scope**: 10 files, mostly copy/content changes with some structural additions to the landing page.

