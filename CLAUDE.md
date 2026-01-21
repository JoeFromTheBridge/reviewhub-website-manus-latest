ReviewHub — Full Project Implant Document

(Authoritative Source of Truth for a Fresh Project)

1. Project Identity
Project Name

ReviewHub

What This Is (Very Important)

ReviewHub is a product review platform, not a blog.

Users come to:

Submit structured reviews (rating, text, images; later video)

Read and compare community reviews

Discover products via search, filters, and recommendations

Eventually compare prices and access affiliate links

This is a data-driven, trust-centric review system, designed to scale into advanced discovery and recommendation tooling.

2. High-Level Goals
Near-Term (MVP Stability)

Stable frontend + backend deployment

Auth flows that work end-to-end

Reviews display correctly

Images load reliably

Clean infrastructure foundation

Mid-Term (Core Product)

Polished product pages

Search, filters, and sorting

Admin moderation tools

Basic analytics

Long-Term (Platform)

Recommendation engine

Performance optimization and caching

Privacy tooling (export, deletion)

Advanced discovery (voice search POC)

Monetization readiness (affiliate integrations)

3. Technology Stack (Locked)
Frontend

React 18

Vite

Tailwind CSS

shadcn/ui

lucide-react

React Router

Context API for auth & global state

Deployed on Vercel

Backend

Flask

SQLAlchemy

Flask-JWT-Extended

Alembic for migrations

PostgreSQL (production)

SQLite allowed only for local fallback

Dockerized

Deployed on Render

Supporting Services

SMTP email (SendGrid or Gmail-style SMTP)

Optional S3-compatible object storage for images

Environment-variable–driven configuration

4. Environment Variables (Patterns Matter)
Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_ENV=production

Backend
FLASK_ENV=production
SECRET_KEY=***
JWT_SECRET_KEY=***
DATABASE_URL=postgresql+psycopg2://...
APP_BASE_URL=https://yourfrontend.com

Email
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM="ReviewHub <no-reply@yourdomain.com>"

CORS
CORS_ALLOWED_ORIGINS=https://yourfrontend.com

5. Architecture Decisions (Do Not Re-Litigate)
ADR-001 — Stack Choice

Decision: SPA frontend + Flask backend
Why: Simple mental model, sufficient scale, easy deployment
Consequence: Explicit API contracts, clean separation

ADR-002 — Auth

Decision: JWT-based auth with email verification
Why: Stateless, frontend-friendly, scalable
Consequence: CORS and cookie/header handling must be correct

ADR-003 — Data

Decision: Postgres in prod, SQLite only for dev
Why: Avoid production surprises
Consequence: Alembic migrations are mandatory

6. Repository & Project Structure
GitHub

GitHub is the permanent source of truth for code

Commits are done manually

No automation assumptions

ChatGPT Project Files (Planning Memory)

These act as working memory, not production truth:

00_README-Project-Workspace.txt

01_ROADMAP.txt

02_DEPLOYMENT_NOTES.txt

03_ENV_VARS.sample.txt

04_CHANGELOG.txt

05_ARCH_DECISIONS.txt

06_TASKS_BACKLOG.txt

FRONTEND_SNAPSHOT_YYYY-MM-DD.txt

BACKEND_SNAPSHOT_YYYY-MM-DD.txt

7. Workflow Rules (Hard Requirements)

These rules must be followed in all future work.

Code Updates

Always return complete file replacements

Never return snippets or partial diffs

Preserve:

File name

Import order

Formatting style

Every Code Response Must Include

One-line commit message (plain text)

Then the full file in a code block

Snapshots

One snapshot per day per side (frontend/backend)

Full files only when changed

Date-stamped filenames

Snapshots are for memory and rollback, not deployment

8. CHANGELOG Rules (Strict)

CHANGELOG entries must be:

Factual

Concise

Completed work only

No TODOs

No future plans

No implementation details

Format:

## YYYY-MM-DD
- Bullet
- Bullet

9. Current Project State (At Time of Transplant)
Phase 0 — Stabilization (Active)

Goal: Make the system boring and reliable.

Known Issues Being Fixed

Frontend:

Incorrect image paths (Vite static handling)

Minor auth/header UI inconsistencies

Backend:

Email verification links pointing to wrong domain

CORS + JWT alignment issues

Alembic baseline not fully locked

Infra:

/healthz endpoint missing or inconsistent

Environment parity between local / prod

These are blocking issues before moving forward.

10. Roadmap (Authoritative)
Phase 0 — Stabilization

Fix image paths

Fix email verification URLs

Add /healthz endpoint

Alembic baseline + migration sanity

Smoke tests

Milestone M0: Stable FE + BE deployed

Phase 1 — Core Product Polish

Product detail page UX

Search, filters, sorting

Full auth flows

Admin basics (product CRUD, review moderation)

Analytics basics

Milestone M1: Core UX feels complete

Phase 2 — Advanced & Operations

Recommendation engine

Performance & caching

Monitoring & alerts

Data export & privacy tooling

Voice search proof-of-concept

Milestone M2: Scalable platform

11. Ideas Already Brainstormed (Do Not Re-Discover)

Community-driven trust signals (verified purchases, reputation)

Recommendation engine (trending + cold start)

Price comparison & affiliate monetization

Voice search as discovery enhancer (not core)

Privacy tooling (export/delete) as trust differentiator

Performance as a feature, not an afterthought

These are validated directions, not random ideas.

12. How to Think About This Project

This is not a content site

This is a structured data platform

Stability beats speed

Shipping clean phases beats shipping features

Trust is the core differentiator

13. How This Document Should Be Used

If this project is:

Restarted

Migrated

Handed off

Re-embedded into a new AI project

This document is the bootstrap memory.

Nothing outside this file should be assumed.
