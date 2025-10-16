# 🧱 ReviewHub – Cursor Project Summary

---

## 1. Project Overview

**Purpose:**  
ReviewHub is a consumer product review platform that lets users browse, review, and discuss products.  
It blends structured product listings, verified user reviews, and admin moderation with future plans for analytics and recommendations.

**Tech Stack:**  
- **Frontend:** React 18 + Vite + Tailwind + shadcn/ui + lucide-react  
- **Backend:** Flask 3 + SQLAlchemy + JWT + Alembic + modular services  
- **Database:** PostgreSQL (prod) / SQLite (dev fallback)  
- **Deployment:** Frontend on **Vercel**, Backend (Dockerized) on **Render**  
- **Environment Config:** `.env` templates defined in `03_ENV_VARS.sample.txt`

**Current Status:**  
Phase 0 (Stabilization) in progress — both FE/BE deployed and connected; working on CORS + migrations + email verification.

---

## 2. Completed Work

- ✅ **Architecture Decisions:** ADR-001 (Stack), ADR-002 (Auth)  
- ✅ **Backend Setup:** Flask app, Dockerfile, requirements, modular services  
- ✅ **Frontend Setup:** Header, homepage, routing, favicon/logo  
- ✅ **Deployment:** Vercel (FE) + Render (BE) functional  
- ✅ **Documentation:** Roadmap, Changelog, Backlog, Deployment Notes  
- ✅ **Environment Templates:** `.env` example covers FE/BE vars  
- ✅ **Snapshot System:** FRONTEND_ and BACKEND_ snapshot files for version tracking

---

## 3. Partially Implemented / In-Progress Work

- 🔄 Authentication flow (signup → verify → login) — partially working  
- 🔄 Email verification link — domain mismatch (`APP_BASE_URL` + CORS)  
- 🔄 Alembic baseline — schema migration pending  
- 🔄 Admin service + RBAC — backend ready, UI not implemented  
- 🔄 Search service — stubbed, not connected to frontend  
- 🔄 Header/auth dropdown polish — UI partially done  
- 🔄 `/healthz` endpoint — not yet added

---

## 4. Outstanding Tasks / To-Do List

- [ ] Fix CORS & `APP_BASE_URL` configuration  
- [ ] Add `/healthz` endpoint  
- [ ] Run Alembic baseline + migration  
- [ ] Complete JWT auth flow + password reset  
- [ ] Implement review submission & display  
- [ ] Admin CRUD for products/reviews  
- [ ] Connect frontend search filters  
- [ ] Add error handling + analytics  
- [ ] Verify staging deploy + smoke tests

---

## 5. Known Issues / Bugs

- Homepage images 404 (path issue)  
- CORS origin mismatch  
- Email verification redirects to old domain  
- JWT cookies missing `Secure` / `SameSite` flags  
- Alembic baseline missing  
- Incomplete `get_user_reviews` route  
- Admin RBAC not enforced  
- Search UI not connected  
- No Render monitoring or alerts configured  
- Placeholder code in snapshot files

---

## 6. Planned Phases (with Timeframes)

### Phase 1 — Launch MVP (~2–3 weeks)
- Finish auth flow, admin CRUD, and core product pages  
- Stable live deployment (Vercel + Render)  

### Phase 2 — Reviews & Search (~3–4 weeks)
- Review system (submit/edit/display)  
- Search + filtering integration  
- Responsive UI polish and lazy loading  

### Phase 3 — Analytics & Monitoring (~3–4 weeks)
- Page views, top products, uptime monitoring  
- Build domain + deployment documentation  

### Phase 4 — Advanced Features (~4–6 weeks)
- Recommendation engine  
- Voice/visual search prototype  
- GDPR export/delete tools  

---

## 7. Immediate Next Steps (1–2 Hour Tasks)

1. Add `/healthz` route in `app.py`  
2. Fix `APP_BASE_URL` and CORS origin config  
3. Run Alembic init → migrate → upgrade  
4. Verify frontend `.env` → correct API URL  
5. Replace placeholder snapshot code with current working files

---

## 8. Recommendations for Transition to Cursor

- **Include Context Files:**  
  `/docs/01_ROADMAP.txt`, `/docs/05_ARCH_DECISIONS.txt`, `/docs/06_TASKS_BACKLOG.txt`, `/frontend/src`, `/backend/app.py`, `/backend/email_service.py`

- **Prep Repo Before Opening in Cursor:**  
  - Commit all recent changes  
  - Verify `.env.example` aligns with prod setup  
  - Remove “paste latest code here” placeholders  
  - Push updated `requirements.txt`, `Dockerfile`, and Vite config  

- **In Cursor:**  
  - Begin with backend fixes (auth, CORS, `/healthz`)  
  - Move to frontend auth pages + API calls  
  - Use Cursor’s “Explain Code” and “Fix Error” tools to test endpoints and align env vars  

---

🧭 **Goal:** Reach Phase 1 (MVP Launch) with stable signup/login, admin product control, and working review system — then iterate toward analytics and recommendations.
