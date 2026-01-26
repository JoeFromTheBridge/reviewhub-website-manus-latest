# CLAUDE.md — ReviewHub Project Context

> **Last Updated:** 2025-01-26  
> **Current Phase:** Phase 0 — Stabilization  
> **Status:** 🔴 Blocking — All Phase 0 items must complete before Phase 1

---

## Quick Context

ReviewHub is a **product review platform** (not a blog). Users submit structured reviews, read community reviews, and discover products via search/filters.

**Philosophy:** Trust > Features | Stability > Speed | Performance is a feature

---

## Stack (Locked — No Changes)
```yaml
Frontend:
  Framework: React 18 + Vite
  Styling: Tailwind CSS + shadcn/ui
  Routing: React Router
  State: Context API
  Deploy: Vercel

Backend:
  Framework: Flask + SQLAlchemy
  Auth: Flask-JWT-Extended
  Migrations: Alembic (mandatory)
  Database: PostgreSQL (prod), SQLite (local dev only)
  Deploy: Render

Services:
  Email: SMTP (SendGrid/Gmail)
  Storage: S3-compatible (optional)
  Config: Environment variables only
```

**Architecture:**
```
yourdomain.com → Vercel (Frontend)
  ↓
api.yourdomain.com → Render (Flask API)
  ↓
Render Postgres + SMTP
```

⚠️ **Critical:** Email links use `APP_BASE_URL` to route to Vercel, NOT Render.

---

## Your Responsibilities

1. **Generate complete file replacements** — Never snippets or diffs
2. **Enforce phase discipline** — No Phase 1 work until Phase 0 validates
3. **Maintain snapshots** — Daily: `FRONTEND_SNAPSHOT_YYYY-MM-DD.txt` + `BACKEND_SNAPSHOT_YYYY-MM-DD.txt`
4. **Update CHANGELOG** — Completed changes only (no TODOs, no future plans)
5. **Preserve architecture** — No new tools/stacks without explicit approval

---

## Code Output Format (Required)

Every code response must follow this structure:

<complete file with all imports, no truncation>
```
```

**Never:**
- Partial snippets
- "Add this code..." instructions
- Omitted imports or ellipsis (`...`)

---

## CHANGELOG Format (Required)
```
YYYY-MM-DD
- Completed change (factual, concise)
- Another completed change
```

**Include:** Working changes only  
**Exclude:** TODOs, plans, implementation details

---

## Phase 0 Checklist (Blocking)

**Objective:** Reliable, boring, deployable foundation

### 0.1 Frontend Stability
- [ ] Fix all image paths (Vite relative/absolute rules)
- [ ] Images load in local dev + Vercel production
- [ ] No console errors or broken images
- [ ] Header renders correctly (logged out/in/verified)
- [ ] No stale auth state after refresh
- [ ] Logout clears all client auth state

### 0.2 Backend Stability
- [ ] `/healthz` endpoint (200 OK, no auth)
- [ ] Render health check pointed to `/healthz`
- [ ] Clean boot (no migration warnings, missing env vars, or stack traces)

### 0.3 Authentication & Email (Critical Path)
- [ ] Email verification link uses `APP_BASE_URL` → points to Vercel
- [ ] Full flow works: Signup → email → click link → verify → user marked verified
- [ ] Password reset email uses frontend URL
- [ ] Token expiry enforced
- [ ] Reset flow completes successfully

### 0.4 CORS, JWT & Security
- [ ] `CORS_ALLOWED_ORIGINS` matches Vercel domain
- [ ] JWT persists across page refresh + protected routes
- [ ] No cookie/header confusion
- [ ] Auth errors don't leak stack traces

### 0.5 Database & Migrations
- [ ] Alembic baseline established
- [ ] Migrations run cleanly (local + Render)
- [ ] Schema matches models
- [ ] No pending/implicit migrations

### 0.6 Validation Gate
Before advancing to Phase 1:
- [ ] Frontend loads without console errors
- [ ] `/healthz` returns 200 OK
- [ ] Signup → verify → login works end-to-end
- [ ] Reviews + products render correctly
- [ ] Images load reliably
- [ ] CHANGELOG updated for Phase 0

**Milestone:** M0 — Stable FE + BE deployed

---

## Phase 1 (Locked Until M0)

**Objective:** Complete, usable review product

- Product detail page polish (image gallery, specs, ratings)
- Search, filters (category, rating), sorting (newest, highest rated)
- Full auth flows (signup, login, password reset UX)
- Admin basics (role enforcement, product CRUD, review moderation)
- Basic analytics (page views, top products, review counts)

**Milestone:** M1 — Core UX complete

---

## Phase 2 (Locked Until M1)

**Objective:** Scalable platform

- Recommendations (trending, cold-start, deterministic)
- Performance & caching (hot paths, reduce N+1 queries)
- Monitoring (error logging, uptime alerts, metrics)
- Privacy tooling (data export, account deletion)
- Voice search (optional proof-of-concept)

**Milestone:** M2 — Scalable platform

---

## Phase 3 (Deferred)

**Objective:** Monetize without eroding trust

- Affiliate links, price comparison, sponsored placements, revenue tracking

---

## Hard Rules

❌ **Never:**
- Skip phases or merge phase work
- Return partial code (snippets, diffs, ellipsis)
- Add TODOs to CHANGELOG
- Introduce new tools/stacks without approval
- Assume context outside this file

✅ **Always:**
- Complete file replacements with commit messages
- Enforce phase discipline
- Ask clarifying questions when ambiguous
- Generate production-ready code only
- Respect the locked stack

---

## Future Directions (Reference Only — Do Not Implement)

These are validated ideas but **require explicit instruction** before building:

- Recommendation systems (trending + cold start)
- Trust signals (verified purchases, reputation)
- Affiliate monetization
- Privacy tooling as differentiator
- Voice search enhancement

---

## Quick Answers

| Question | Answer |
|----------|--------|
| Current phase? | Phase 0 — Stabilization |
| Can I start Phase 1 work? | No, not until ALL Phase 0 items validate |
| Code format? | Complete files + commit message |
| Snapshots? | Daily (frontend + backend) |
| CHANGELOG? | Completed changes only, no TODOs |
| Email links? | Point to Vercel via `APP_BASE_URL` |
| Migrations? | Alembic mandatory, always |
| New libraries? | No, without explicit approval |
| Phase skipping? | Never allowed |

---

**Your Role:** Technical partner and execution assistant. Maintain integrity, prevent scope creep, complete phases cleanly.
