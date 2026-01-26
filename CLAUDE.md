
# CLAUDE.md — ReviewHub Project Context (Authoritative)

> **Last Updated:** 2026-01-26  
> **Current Phase:** Phase 0 — Stabilization  
> **Status:** 🔴 Blocking — All Phase 0 items must complete before Phase 1

---

## Quick Context

ReviewHub is a **product review platform** (not a blog).

Users submit structured product reviews, browse community reviews, and discover products via search, filters, and comparisons.

**Philosophy:**  
Trust > Features  
Stability > Speed  
Performance is a feature

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
````

❌ **Do not introduce new frameworks, libraries, services, or architectural patterns** unless explicitly instructed.

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
* Definition of “done”

Other documentation may reference future or experimental ideas and **must not be assumed implemented**.

---

## Your Responsibilities (Non-Negotiable)

1. Generate **complete file replacements only**
2. Enforce phase discipline — **no Phase 1 work until Phase 0 is complete**
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

* “Add this code…”
* “Insert the following…”
* “…existing code…”

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
* Do not “clean up” unrelated code
* Do not rename files or folders unless instructed

---

## Phase 0 — Stabilization (BLOCKING)

**Objective:** Reliable, boring, deployable foundation

Claude Code **must update this checklist** as tasks are completed.

### 0.1 Frontend Stability

* [ ] Fix all image paths (Vite relative/absolute rules)
* [ ] Images load in local dev
* [ ] Images load in Vercel production
* [ ] No console errors on page load
* [ ] Header renders correctly (logged out / logged in / verified)
* [ ] Auth state persists across refresh
* [ ] Logout clears all client auth state

### 0.2 Backend Stability

* [ ] `/healthz` endpoint returns 200 (no auth)
* [ ] Render health check points to `/healthz`
* [ ] Clean boot (no stack traces, no missing env vars)
* [ ] No migration warnings on startup

### 0.3 Authentication & Email (CRITICAL PATH)

* [ ] Signup flow completes successfully
* [ ] Verification email uses `APP_BASE_URL`
* [ ] Verification link routes to frontend (Vercel)
* [ ] User marked verified after link click
* [ ] Password reset email routes to frontend
* [ ] Password reset completes successfully
* [ ] JWT expiry enforced

### 0.4 CORS, JWT & Security

* [ ] `CORS_ALLOWED_ORIGINS` matches Vercel domain
* [ ] JWT works across refresh + protected routes
* [ ] No cookie vs header confusion
* [ ] Auth errors do not leak stack traces

### 0.5 Database & Migrations

* [ ] Alembic baseline established
* [ ] `flask db upgrade` runs cleanly (local)
* [ ] `flask db upgrade` runs cleanly (Render)
* [ ] Models match database schema
* [ ] No implicit or pending migrations

### 0.6 Phase 0 Validation Gate

Before advancing:

* [ ] Frontend loads with zero console errors
* [ ] `/healthz` returns 200 OK
* [ ] Signup → verify → login works end-to-end
* [ ] Products and reviews render correctly
* [ ] Images load reliably in production

**Milestone:** M0 — Stable frontend + backend deployed

---

## Phase 1 — LOCKED UNTIL M0

**Objective:** Complete, usable review product

* Product detail page polish
* Search, filters, sorting
* Auth UX polish
* Admin basics (roles, moderation)
* Basic analytics

---

## Phase 2 — LOCKED UNTIL M1

**Objective:** Scalable platform

* Recommendations
* Performance & caching
* Monitoring & metrics
* Privacy tooling
* Optional voice search POC

---

## Phase 3 — Deferred

**Objective:** Monetize without eroding trust

* Affiliate links
* Price comparison
* Sponsored placements
* Revenue tracking

---

## Hard Rules (Absolute)

❌ **Never**

* Skip phases
* Merge phase work
* Return partial code
* Add TODOs
* Introduce new tools
* Assume context outside this file

✅ **Always**

* Update this file when tasks are completed
* Validate before checking boxes
* Produce production-ready code only
* Respect the locked stack
* Keep scope tight and explicit

---

## Default Role

You are a **technical execution partner**, not an architect-for-hire.

Your job is to:

* Finish the current phase cleanly
* Prevent scope creep
* Enforce discipline
* Ship boring, correct software

```

---

If you want, next we can **start Phase 0 execution** and I’ll explicitly tell you *which checkbox I’m working toward* before touching any code.
```
