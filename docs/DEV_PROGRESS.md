## ReviewHub – Dev Progress Log

### 2025-10-16

- **Task completed**: Reviewed `CURSOR_PROJECT_SUMMARY.md`; initialized dev progress log
- **Files modified**: `docs/DEV_PROGRESS.md` (new)
- **Next step**: Add backend `/healthz` endpoint and wire to Render health checks; then fix `APP_BASE_URL`/CORS configuration

### 2025-10-16 (later)

- **Task completed**: Enhanced backend health endpoint
- **Files modified**:
  - `reviewhub-backend/app_enhanced.py` (added `build_health_payload`, enriched `/api/health` JSON, kept `/healthz` plain text)
- **Notes**:
  - `/api/health` now returns status, service, version, revision, timestamp, environment
  - `/healthz` returns simple `ok` for container health checks

### 2025-10-16 (later)

- **Task completed**: CORS hardening and email link domains; Vercel API proxy
- **Files modified**:
  - `reviewhub-backend/app_enhanced.py` (CORS now includes `APP_BASE_URL`/`FRONTEND_URL` and env list)
  - `reviewhub-backend/email_service.py` (verification/reset URLs prefer `APP_BASE_URL` with fallback)
  - `reviewhub/vercel.json` (rewrite `/api/*` to Render backend)
- **Notes**:
  - Reduces production CORS by proxying via Vercel
  - Aligns email links with current app domain
