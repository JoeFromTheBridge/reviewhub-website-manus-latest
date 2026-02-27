ReviewHub — Technical Specification & Project State Transfer

Status: Phase 0 complete · Phase 1 in progress
Purpose of this document:
Serve as the single source of truth for continuing development in a new AI environment (Claude), without relying on prior chat context.

Last Updated: 2026-02-27

---

1. Project Overview

ReviewHub is a product review platform (not a blog) focused on structured reviews, community trust, and scalable discovery.

Core Principles

Trust > Features

Stability > Speed

Performance is a feature

Avoid premature complexity

Everything user-facing must be auditable and reversible

---

2. Business Context (Strategic Decisions — Locked)

Nature of Project

ReviewHub is a passion project and long-term side hustle. There is no short-term revenue pressure. The timeline to meaningful income is 2–3 years, and that is acceptable. Success in Year 1 is measured by: genuine reviews from real users, credible UX, and slow but real organic search growth — not revenue.

Market Positioning

The gap is real: Amazon reviews are compromised by fakes, Consumer Reports is paywalled and expert-driven, and niche review sites are too fragmented. ReviewHub's value proposition is being the trusted, community-first alternative — a universal review destination built on authentic user reviews.

Monetization Plan (Long-Term)

Primary: Affiliate marketing (product links)
Secondary: Display advertising (once meaningful traffic exists)
Future: Sponsored content, premium memberships
Note: Monetization must never compromise review integrity. Trust > Revenue at all times.

---

3. Launch Category Strategy (DECIDED — Do Not Revisit)

ReviewHub will launch with 3 focused categories and expand deliberately from there. The infrastructure is universal, but the user-facing experience launches focused to build trust and depth before breadth.

Launch Categories (Phase 1)

1. Home & Everyday Products
   Reason: Strongest market gap. No free community alternative to Wirecutter/Consumer Reports.
   Includes: Kitchen, cleaning, household goods, small appliances.

2. Outdoor & Sporting Goods
   Reason: Passionate community, high-consideration purchases, fragmented niche competition.
   Includes: Camping gear, fitness equipment, hiking, cycling.

3. Pet Products
   Reason: Highly motivated researchers, fast-growing market, no dominant trusted review destination.
   Includes: Food, accessories, health products, toys.

Ruled Out for Launch

Electronics: Too saturated, lowest affiliate commissions (1–4%), dominated by established players (Rtings, Wirecutter, CNET).

Clothing & Apparel: Structural challenges. Fit is subjective and body-type dependent, sizing varies by brand, heavy influencer competition, expensive traffic acquisition.

Category Expansion Model

New categories are added one at a time, triggered by user demand signals — not a calendar date. The right trigger is users attempting to review products in categories that don't exist yet. Target depth before launch: 50+ products per category with real reviews.

---

4. Tech Stack (Locked)
Frontend

React 18

Vite

Tailwind CSS

shadcn/ui

lucide-react

React Router

Context API (no Redux)

Backend

Flask

SQLAlchemy ORM

Flask-JWT-Extended (JWT auth)

Alembic (migrations)

PostgreSQL (production)

SQLite (local dev fallback)

Infrastructure

Frontend: Vercel

Backend + DB: Render

Images: Cloudflare R2 (S3-compatible)

Email: SendGrid / SMTP provider

Domains/DNS: EasyDNS

Note: Get the thereviewhub.ca domain behind Cloudflare's proxy (free tier). Provides bot filtering, DDoS protection, and edge caching. Low effort, high value.

---

5. Roadmap (Completed vs Pending)

✅ Phase 0 — Stabilization (COMPLETE)

Milestone: M0 — Stable FE + BE deployed (Completed 2026-01-28)

Completed:

Image paths fixed (Vite config)

CORS correctly configured

Email verification links working (APP_BASE_URL)

/healthz endpoint live

Alembic baseline + stable migrations

Environment parity (local/staging/prod)

JWT auth stable

Security hardening

Production smoke tests passed

Phase 0 is considered DONE and should not be revisited unless regressions occur.

🔄 Phase 1 — Core Product (IN PROGRESS)

Primary goals:

Solid, boring, reliable core UX

No experimental features

Planned (in priority order):

[ ] Product detail page polish (star ratings, review summary, sort controls, verified badges, helpful votes)
[ ] Search & filters (category filter, sort by rating/date, keyword search)
[ ] Auth UX polish (signup/login/reset flows feel smooth and professional)
[ ] Admin basics (product CRUD, review moderation — must be operable without touching DB)
[ ] Basic analytics (page views, top products)

Content tasks running in parallel with Phase 1:

[ ] Seed 20–30 real products per launch category
[ ] Write or recruit 2–3 genuine reviews per product
[ ] Identify 10–15 high-intent search queries per category to target for SEO

⏳ Phase 2 — Trust & Quality (PENDING)

Planned:

Reviewer reputation signals

Spam detection and reporting tools

Review edit history and transparency

GDPR compliance (data export/deletion)

Verified-profile / social login options

⏳ Phase 3 — Discovery & Growth (PENDING)

Planned:

Recommendation engine

Caching layer (Redis/CDN)

Full-text search (Elasticsearch)

Category and trending pages

Monitoring & alerts

Voice search proof-of-concept

⏳ Phase 4 — Monetization (PENDING)

Planned:

Affiliate link framework with clear disclosures

Sponsored placements (verified brands only, strict guidelines)

Brand analytics dashboard (premium)

Review widgets for brand embedding

Note: Monetization is deliberately deferred until trust and traffic are established.

---

6. Bot Prevention Strategy

Layer 1 — Active Now

Email verification strictly enforced before any review can be submitted (already implemented)

Rate limiting on review submission and product suggestion routes (extend from auth endpoints)

Honeypot fields on signup and review forms (hidden input; bots fill it, humans don't)

Layer 2 — When Traffic Grows

Cloudflare proxy (free tier) — bot score detection, IP reputation, challenge pages

Self-declared ownership signal on reviews ("I own this product" checkbox) — lightweight but filters lazy bots

Layer 3 — When Scale Justifies It

Behavioral scoring: flag accounts with no profile completeness, reviews submitted within 10 minutes of account creation, identical review text patterns

Admin panel flags for manual review of suspicious accounts

---

7. Key Architectural Decisions (ADR Summary)

ADR-001 — Tech Stack

Decision: React + Flask monolith with clear FE/BE separation
Reason: Simple mental model, easy debugging, scalable enough
Consequence: Avoids microservices and unnecessary infra complexity

ADR-002 — Authentication

Decision: JWT (access + refresh), email verification via signed URLs
Reason: Stateless, FE/BE friendly, well understood
Consequence: Must be precise with CORS, cookies, and headers

ADR-003 — Product Creation Control

Decision: Users cannot directly create products
Reason: Prevent duplicates, spam, and low-quality entries
Consequence: Requires a controlled suggestion pipeline (see below)

---

8. Major Brainstorming Outcomes

Smart Product Suggestion Pipeline (Approved Concept)

Problem:
Users want to review products that don't exist yet.

Solution:
Users can suggest a product while submitting a review — not create it.

Flow:

User searches for product

Product not found → "Suggest product"

Minimal form:

Product name (required)

Retailer link (required)

Brand/category (optional)

Optional image

Review + suggestion submitted together

Backend:

Temporary product record

Deduplication check

Auto-approve or queue for admin review

Product becomes real only after verification

Status: Planned (Phase 1–2 boundary)

Aesthetics vs Functionality Decision

Decision:

Finish core functionality first, then do visual polish.

Reasoning:

UI will change once flows are finalized

Avoid rework

Phase 1 completes UX logic, Phase 2+ handles aesthetics

---

9. Privacy & Compliance Direction

GDPR-first design

Explicit consent tracking

Data export support

Right-to-be-forgotten flows

No dark patterns

Admin visibility into deletion/export requests

Privacy is not optional and must be first-class.

---

10. Future Upgrades (Approved but Not Started)

Platform Enhancements

Recommendation engine (collaborative + trending)

Advanced analytics dashboard

Search relevance tuning

Visual comparison tools

Infra / Ops

Redis caching

Background jobs (image processing, email)

Uptime monitoring

Alerting on Render health

UX / Growth

Saved searches

Product follow/watch

Review helpfulness voting

Affiliate links (future monetization)

---

11. Coding Preferences & Standards (CRITICAL)

This section must be followed by any AI or contributor.

General Rules

Prefer clarity over cleverness

No premature abstractions

No "magic" helpers without justification

Fewer dependencies > more dependencies

Frontend Standards

Functional components only

Hooks over classes

Explicit state flows

Tailwind utilities preferred over custom CSS

shadcn/ui for base components

Components should be boring and readable

Backend Standards

Explicit routes

No hidden side effects

Service logic separated from routes

SQLAlchemy models kept simple

Alembic migrations reviewed before running

Never auto-generate destructive migrations

Environment Variables

Follow existing naming conventions exactly:

VITE_API_URL

APP_BASE_URL

CORS_ALLOWED_ORIGINS

No secrets committed to git

.env files are local only

Git & Workflow Preferences

Full file replacements preferred over patches

Clear commit messages

No "WIP" commits on main

Snapshots used as working memory

GitHub is the source of truth for code

Documentation drives development

---

12. Deployment Reality (Non-Negotiable)

Frontend: Vercel auto-deploy on push

Backend: Render Docker deploy

Backend must be healthy before frontend reflects changes

Always validate:

/healthz

Auth flows

Email links

Image loading
