# Environment Variables Quick Setup Guide

## 🎯 Quick Reference

Copy-paste these values into your production environments.

---

## 📦 Render Backend Environment Variables

Go to: **Render Dashboard → reviewhub-backend service → Environment tab**

Click **Add Environment Variable** for each:

```bash
# Flask Core (CRITICAL - Generated securely)
FLASK_ENV=production
SECRET_KEY=446495e723123786312720e65b5eedf02f1ba8777a21ca4969c7144ef5ac4bd2
JWT_SECRET_KEY=fc7fcc44caeb1a0b4162e821c3d908b7bec1efaf80e1a21eca66bc581a12a5bc

# CORS & Frontend URL (CRITICAL - Must match your domains)
CORS_ALLOWED_ORIGINS=https://thereviewhub.ca,https://reviewhub-website-manus-latest.vercel.app
APP_BASE_URL=https://thereviewhub.ca

# Image Storage
IMAGE_STORAGE_TYPE=local
UPLOAD_FOLDER=uploads

# Database (should already be set automatically by Render)
# DATABASE_URL=<automatically set by Render PostgreSQL addon>
```

### Optional but Recommended:

```bash
# Email Configuration (Required for user registration emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
FROM_EMAIL=no-reply@thereviewhub.ca
FROM_NAME=ReviewHub

# Redis (for rate limiting - if you have Redis addon)
# REDIS_URL=<provided by Render Redis addon>

# Error Tracking (if using Sentry)
# SENTRY_DSN=<your-sentry-dsn>
```

After adding all variables:
1. Click **Save Changes**
2. Wait for automatic redeploy (~2-3 minutes)
3. Verify: Visit `https://reviewhub-website-manus-latest.onrender.com/healthz`

---

## 🎨 Vercel Frontend Environment Variables

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

Add this variable:

| Key | Value | Environments |
|-----|-------|--------------|
| `VITE_API_URL` | `https://reviewhub-website-manus-latest.onrender.com/api` | ✅ Production<br>✅ Preview<br>✅ Development |

After adding:
1. Click **Save**
2. Go to **Deployments** tab
3. Click **···** on latest deployment
4. Click **Redeploy**
5. Wait ~1-2 minutes
6. Verify: Visit `https://thereviewhub.ca`

---

## ✅ Verification Commands

### Test Backend

```bash
# Simple health check
curl https://reviewhub-website-manus-latest.onrender.com/healthz
# Expected: "ok"

# Detailed health check
curl https://reviewhub-website-manus-latest.onrender.com/api/health
# Expected: {"status":"ok","service":"reviewhub-backend",...}
```

### Test CORS

Open browser console on `https://thereviewhub.ca`:

```javascript
fetch('https://reviewhub-website-manus-latest.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS OK:', d))
  .catch(e => console.error('❌ CORS FAIL:', e))
```

---

## 🔐 Gmail App Password Setup (for SMTP)

If using Gmail for sending emails:

1. Go to https://myaccount.google.com/security
2. Enable **2-Step Verification** (if not already enabled)
3. Search for **"App passwords"**
4. Select:
   - App: **Mail**
   - Device: **Other (Custom name)** → "ReviewHub"
5. Click **Generate**
6. Copy the 16-character password
7. Use this password for `SMTP_PASSWORD` in Render

**Example:**
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=abcd efgh ijkl mnop  # (16-char app password from Google)
FROM_EMAIL=no-reply@thereviewhub.ca
FROM_NAME=ReviewHub
```

---

## 📋 Checklist

### Render Setup
- [ ] `SECRET_KEY` set (64 characters)
- [ ] `JWT_SECRET_KEY` set (64 characters)
- [ ] `CORS_ALLOWED_ORIGINS` includes `https://thereviewhub.ca`
- [ ] `APP_BASE_URL` = `https://thereviewhub.ca`
- [ ] `DATABASE_URL` present (auto-set by Render)
- [ ] Saved changes and redeployed

### Vercel Setup
- [ ] `VITE_API_URL` set to backend URL
- [ ] Applied to Production, Preview, Development
- [ ] Redeployed after setting variable

### Optional Email Setup
- [ ] Gmail app password generated
- [ ] `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD` set in Render
- [ ] `FROM_EMAIL` and `FROM_NAME` set
- [ ] Tested registration flow

### Verification
- [ ] `/healthz` endpoint returns "ok"
- [ ] `/api/health` returns JSON
- [ ] Frontend loads at https://thereviewhub.ca
- [ ] No CORS errors in browser console
- [ ] Can register and login
- [ ] Email verification links point to thereviewhub.ca (not localhost)

---

## 🚨 Common Issues

### Issue: Email verification links point to localhost

**Fix:**
```bash
# In Render, ensure:
APP_BASE_URL=https://thereviewhub.ca  # NOT http://localhost:3000
```

### Issue: CORS errors in browser console

**Fix:**
```bash
# In Render, ensure:
CORS_ALLOWED_ORIGINS=https://thereviewhub.ca,https://reviewhub-website-manus-latest.vercel.app
```

### Issue: Frontend can't reach backend

**Fix:**
```bash
# In Vercel, ensure:
VITE_API_URL=https://reviewhub-website-manus-latest.onrender.com/api
```

Then redeploy Vercel.

### Issue: Email not sending

**Possible Causes:**
1. SMTP credentials not set in Render
2. Gmail app password incorrect
3. 2-Step Verification not enabled on Gmail

**Debug:**
- Check Render logs for SMTP errors
- Test Gmail credentials manually:
  ```python
  import smtplib
  server = smtplib.SMTP('smtp.gmail.com', 587)
  server.starttls()
  server.login('your@gmail.com', 'your-app-password')
  print("✅ Login successful")
  ```

---

## 📞 Support

If you're stuck:
1. Check `PRODUCTION_DEPLOYMENT_GUIDE.md` for detailed troubleshooting
2. Check Render logs: Dashboard → Service → Logs tab
3. Check browser console for frontend errors (F12 → Console)
4. Run manual tests: `MANUAL_TESTING_CHECKLIST.md`

---

**Last Updated:** 2026-01-22
**For:** thereviewhub.ca production deployment
