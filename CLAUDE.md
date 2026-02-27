# CLAUDE.md — ReviewHub Project Context (Authoritative)

> **Last Updated:** 2026-02-27
> **Current Phase:** Phase 1 — Core Review Product
> **Status:** 🟢 Phase 0 Complete — M0 Milestone Achieved

---

## Quick Context

ReviewHub is a **product review platform** (not a blog).

Users submit structured product reviews, browse community reviews, and discover products via search, filters, and comparisons.

**Nature of project:** Passion project / long-term side hustle. No short-term revenue pressure. 2–3 year build horizon. Success in Year 1 = genuine reviews, credible UX, slow organic growth.

**Philosophy:**
Trust > Features
Stability > Speed
Performance is a feature

---

## Business Decisions (Locked — Do Not Revisit)

### Launch Categories (FINAL)
ReviewHub launches with 3 focused categories. Infrastructure is universal; user-facing experience is focused.

1. **Home & Everyday Products** — kitchen, cleaning, household goods. Strongest market gap, no free community alternative to Wirecutter/Consumer Reports.
2. **Outdoor & Sporting Goods** — camping, fitness, hiking, cycling. Passionate community, high-consideration purchases.
3. **Pet Products** — food, accessories, health, toys. Highly motivated researchers, fast-growing market, no dominant review destination.

### Ruled Out
- **Electronics** — too saturated, lowest affiliate commissions, dominated by established players
- **Clothing & Apparel** — subjective fit, sizing inconsistency, heavy influencer competition, expensive traffic acquisition

### Category Expansion Model
Add one category at a time. Triggered by user demand signals (users trying to review products in uncovered categories), not by calendar. Target 50+ products per category with real reviews before going live in that category.

### Monetization (Deferred)
Affiliate marketing (primary) → display ads → sponsored content → premium memberships.
Monetization is deliberately deferred until trust and traffic are established. Trust > Revenue always.

---

## Stack (LOCKED — No Changes Allowed)

```yaml
Frontend:
  Framework: React 18 + Vite
  Styling: Tailwind CSS + shadcn/ui
  Routing: React Router
  State: Context API
  Deploy: Vercel

Backend:
  Framework: Flask
  ORM: SQLAlchemy
  Auth: Flask-JWT-Extended
  Migrations: Alembic (mandatory)
  Database: PostgreSQL (prod), SQLite (local dev only)
  Deploy: Render

Services:
  Email: SMTP (SendGrid or Gmail)
  Storage: S3-compatible (Cloudflare R2 / S3-style APIs)
  Config: Environment variables only
```

❌ **Do not introduce new frameworks, libraries, services, or architectural patterns** unless explicitly instructed.

**Recommended (not yet done):** Put thereviewhub.ca behind Cloudflare's proxy (free tier). Bot filtering, DDoS protection, edge caching. ~20 minutes to set up.

---

## Architecture (Fixed)

```
thereviewhub.ca → Vercel (Frontend)
       ↓
api.thereviewhub.ca → Render (Flask API)
       ↓
PostgreSQL + SMTP
```

⚠️ **Critical Rule:**
All email links **must use `APP_BASE_URL`** and route users to the **Vercel frontend**, never directly to Render.

---

## Environment Variables (Authoritative Names)

### Frontend (Vite)
* `VITE_API_BASE_URL`

### Backend (Flask)
* `APP_BASE_URL`
* `CORS_ALLOWED_ORIGINS`
* `DATABASE_URL`
* `JWT_SECRET_KEY`
* `SECRET_KEY`
* `SMTP_HOST`
* `SMTP_PORT`
* `SMTP_USER`
* `SMTP_PASSWORD`
* `EMAIL_FROM`

Do not invent or rename environment variables.

---

## Development Commands (Verification)

**Frontend**
* Dev: `npm run dev`
* Build: `npm run build`
* Lint: `npm run lint`

**Backend**
* Health: `curl http://localhost:5000/healthz`
* Migrations: `flask db upgrade`

---

## Source of Truth

This file is the **single authoritative source** for:
* Current phase
* Allowed scope
* Task completion status
* Definition of "done"
* Strategic and business decisions

Other documentation may reference future or experimental ideas and **must not be assumed implemented**.

---

## Your Responsibilities (Non-Negotiable)

1. Generate **complete file replacements only**
2. Enforce phase discipline — **no Phase 2 work until Phase 1 is complete**
3. Update this CLAUDE.md file:
   * Check off tasks **only after validation**
   * Update the **Last Updated** date when tasks change
4. Preserve architecture, APIs, and dependency set
5. Ask **only minimal clarifying questions** required to complete the current task

---

## Code Output Format (REQUIRED)

For any code change, respond in **this exact order**:

1. One-line commit message (plain text)
2. Exactly **one code block per file**, containing the **entire file**
3. No snippets, no diffs, no ellipsis

**Example**

```
commit: Fix email verification redirect URL
```

```tsx
// full file content here
```

❌ Never say:
* "Add this code…"
* "Insert the following…"
* "…existing code…"

---

## Dependency & Refactor Policy (STRICT)

* ❌ No new runtime dependencies
* ❌ No new dev dependencies
* ❌ No refactors unless required to fix a bug
* ❌ No formatting-only changes
* ❌ No API contract changes unless explicitly requested

Prefer the **smallest possible change** that fully resolves the issue.

---

## File Change Discipline

* Modify **only** files required for the current task
* Preserve existing formatting and import order
* Do not "clean up" unrelated code
* Do not rename files or folders unless instructed

---

## Phase 0 — Stabilization ✅ COMPLETE

**Milestone:** M0 — Stable frontend + backend deployed ✅ (Completed 2026-01-28)

### 0.1 Frontend Stability ✅
* [x] Fix all image paths (Vite relative/absolute rules)
* [x] Images load in local dev
* [x] Images load in Vercel production
* [x] No console errors on page load
* [x] Header renders correctly (logged out / logged in / verified)
* [x] Auth state persists across refresh
* [x] Logout clears all client auth state

### 0.2 Backend Stability ✅
* [x] `/healthz` endpoint returns 200 (no auth)
* [x] Render health check points to `/healthz`
* [x] Clean boot (no stack traces, no missing env vars)
* [x] No migration warnings on startup

### 0.3 Authentication & Email ✅
* [x] Signup flow completes successfully
* [x] Verification email uses `APP_BASE_URL`
* [x] Verification link routes to frontend (Vercel)
* [x] User marked verified after link click
* [x] Password reset email routes to frontend
* [x] Password reset completes successfully
* [x] JWT expiry enforced

### 0.4 CORS, JWT & Security ✅
* [x] `CORS_ALLOWED_ORIGINS` matches Vercel domain
* [x] JWT works across refresh + protected routes
* [x] No cookie vs header confusion
* [x] Auth errors do not leak stack traces

### 0.5 Database & Migrations ✅
* [x] Alembic baseline established
* [x] `flask db upgrade` runs cleanly (local)
* [x] `flask db upgrade` runs cleanly (Render)
* [x] Models match database schema
* [x] No implicit or pending migrations

---

## Phase 1 — Core Product (CURRENT)

**Objective:** Complete, usable review product with credible UX

### Technical tasks (in priority order)
* [ ] Product detail page polish (star ratings visible, review summary, sort controls, verified-purchase badges, helpful vote functionality)
* [ ] Search & filters (category filter, sort by rating/date, basic keyword search)
* [ ] Auth UX polish (signup/login/reset flows smooth and professional)
* [ ] Admin basics (product CRUD, review moderation — operable without touching DB directly)
* [ ] Basic analytics (page views, top products)

### Content tasks (run in parallel)
* [ ] Set up Cloudflare proxy for thereviewhub.ca (free, ~20 min)
* [ ] Seed 20–30 real products per launch category (Home, Outdoor, Pet)
* [ ] Write or recruit 2–3 genuine reviews per product
* [ ] Identify 10–15 high-intent search queries per category for early SEO

### Phase 1 Validation Gate
Before advancing to Phase 2:
* [ ] All three launch categories have seeded products and reviews
* [ ] Product detail page looks credible on mobile and desktop
* [ ] Search and filters functional
* [ ] Admin can moderate reviews without DB access
* [ ] No console errors in production

---

## Phase 2 — Trust & Quality (LOCKED UNTIL PHASE 1 COMPLETE)

**Objective:** Quality signals and spam prevention once real reviews arrive

* Reviewer reputation signals
* Spam detection and reporting tools
* Review edit history and transparency
* GDPR compliance (data export / deletion)
* Verified profile / social login options
* Enhanced bot prevention (behavioral scoring, Cloudflare bot management)

---

## Phase 3 — Discovery & Growth (LOCKED)

**Objective:** Scalable discovery and traffic growth

* Recommendation engine
* Full-text search (Elasticsearch)
* Category and trending pages
* Performance & caching (Redis/CDN)
* Monitoring & metrics
* Voice search POC

---

## Phase 4 — Monetization (LOCKED — deferred intentionally)

**Objective:** Revenue without eroding trust

* Affiliate links with clear disclosures
* Sponsored placements (verified brands only)
* Brand analytics dashboard (premium)
* Review widgets for brand embedding
* Revenue tracking

---

## Hard Rules (Absolute)

❌ **Never**
* Skip phases
* Merge phase work
* Return partial code
* Add TODOs
* Introduce new tools without explicit instruction
* Assume context outside this file
* Prioritize revenue over trust

✅ **Always**
* Update this file when tasks are completed
* Validate before checking boxes
* Produce production-ready code only
* Respect the locked stack
* Keep scope tight and explicit
* Keep launch categories to Home, Outdoor, Pet until expansion is triggered by user demand

---

## Default Role

You are a **technical execution partner**, not an architect-for-hire.
Your job is to finish the current phase cleanly, prevent scope creep, enforce discipline, and ship boring, correct software.
