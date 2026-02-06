ReviewHub — Technical Specification & Project State Transfer

Status: Phase 0 complete · Phase 1 in progress
Purpose of this document:
Serve as the single source of truth for continuing development in a new AI environment (Claude), without relying on prior chat context.

1. Project Overview

ReviewHub is a product review platform (not a blog) focused on structured reviews, community trust, and scalable discovery.

Core Principles

Trust > Features

Stability > Speed

Performance is a feature

Avoid premature complexity

Everything user-facing must be auditable and reversible

2. Tech Stack (Locked)
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

3. Roadmap (Completed vs Pending)
✅ Phase 0 — Stabilization (COMPLETE)

Milestone: M0 — Stable FE + BE deployed

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

Planned:

Product detail page polish

Search & filters (category, sort, tags)

Auth UX polish (signup/login/reset)

Admin basics (product CRUD, review moderation)

Basic analytics (page views, top products)

⏳ Phase 2 — Advanced & Ops (PENDING)

Planned:

Recommendation engine

Caching layer (Redis/CDN)

Monitoring & alerts

Data export / privacy tooling

Voice search proof-of-concept

4. Key Architectural Decisions (ADR Summary)
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

5. Major Brainstorming Outcomes
Smart Product Suggestion Pipeline (Approved Concept)

Problem:
Users want to review products that don’t exist yet.

Solution:
Users can suggest a product while submitting a review — not create it.

Flow:

User searches for product

Product not found → “Suggest product”

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

6. Privacy & Compliance Direction

GDPR-first design

Explicit consent tracking

Data export support

Right-to-be-forgotten flows

No dark patterns

Admin visibility into deletion/export requests

Privacy is not optional and must be first-class.

7. Future Upgrades (Approved but Not Started)
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

8. Coding Preferences & Standards (CRITICAL)

This section must be followed by any AI or contributor.

General Rules

Prefer clarity over cleverness

No premature abstractions

No “magic” helpers without justification

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

No “WIP” commits on main

Snapshots used as working memory

GitHub is the source of truth for code

Documentation drives development

9. Deployment Reality (Non-Negotiable)

Frontend: Vercel auto-deploy on push

Backend: Render Docker deploy

Backend must be healthy before frontend reflects changes

Always validate:

/healthz

Auth flows

Email links

Image loading

10. How Claude Should Use This Document

Claude should:

Treat this file as authoritative

Not re-architect unless explicitly asked

Not re-open Phase 0 tasks

Ask before introducing new dependencies

Update roadmap/tasks when work is completed

Optimize for long-term maintainability

Final Note

This project is intentionally methodical.
Speed is acceptable only when it does not sacrifice correctness.

If a decision feels clever instead of boring — it’s probably wrong.
