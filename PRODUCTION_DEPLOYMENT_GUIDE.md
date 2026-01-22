# Production Deployment Verification Guide

## Overview

This guide helps you verify that your ReviewHub production deployment is correctly configured and working.

**Your Production URLs:**
- 🌐 **Frontend (Custom Domain)**: https://thereviewhub.ca
- 🌐 **Frontend (Vercel)**: https://reviewhub-website-manus-latest.vercel.app
- ⚙️ **Backend (Render)**: https://reviewhub-website-manus-latest.onrender.com

---

## Step 1: Verify Render Backend Environment Variables

### Required Environment Variables in Render

Go to **Render Dashboard → Your Web Service → Environment**

Ensure these variables are set:

```bash
# Flask Core
FLASK_ENV=production
SECRET_KEY=446495e723123786312720e65b5eedf02f1ba8777a21ca4969c7144ef5ac4bd2
JWT_SECRET_KEY=fc7fcc44caeb1a0b4162e821c3d908b7bec1efaf80e1a21eca66bc581a12a5bc

# Database (should already be set)
DATABASE_URL=postgresql://reviewhub_user:sAdp3wUgo0CeZAzA3VrAsssNKNzoS2sv@dpg-d2vckqnfte5s73bvoje0-a.ohio-postgres.render.com/reviewhub_eva5

# CORS - CRITICAL for frontend/backend communication
CORS_ALLOWED_ORIGINS=https://thereviewhub.ca,https://reviewhub-website-manus-latest.vercel.app
APP_BASE_URL=https://thereviewhub.ca

# Email Configuration (REQUIRED for user registration)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
FROM_EMAIL=no-reply@thereviewhub.ca
FROM_NAME=ReviewHub

# Image Storage
IMAGE_STORAGE_TYPE=local
UPLOAD_FOLDER=uploads

# Optional but recommended
REDIS_URL=<your-redis-url>  # If you have Redis addon
```

### How to Set Environment Variables in Render

1. Go to your Render dashboard
2. Click on your web service
3. Go to **Environment** tab
4. Click **Add Environment Variable**
5. Add each variable one by one
6. Click **Save Changes** (this will trigger a redeploy)

---

## Step 2: Verify Vercel Frontend Environment Variables

### Required Environment Variables in Vercel

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables**

Set this variable for **Production, Preview, and Development**:

```bash
VITE_API_URL=https://reviewhub-website-manus-latest.onrender.com/api
```

### How to Set Environment Variables in Vercel

1. Go to Vercel dashboard
2. Select your project
3. Go to **Settings → Environment Variables**
4. Add:
   - **Key**: `VITE_API_URL`
   - **Value**: `https://reviewhub-website-manus-latest.onrender.com/api`
   - **Environments**: Check all (Production, Preview, Development)
5. Click **Save**
6. Redeploy: Go to **Deployments** → Click **···** on latest → **Redeploy**

---

## Step 3: Verify Custom Domain Configuration

### Vercel Domain Setup

1. Go to **Vercel Dashboard → Your Project → Settings → Domains**
2. Verify `thereviewhub.ca` is listed and has a green checkmark ✅
3. If not configured:
   - Click **Add Domain**
   - Enter `thereviewhub.ca`
   - Follow Vercel's instructions to update your DNS records

### DNS Records (at your domain registrar)

Your DNS should have these records:

```
Type    Name    Value
A       @       76.76.21.21  (Vercel's IP)
CNAME   www     cname.vercel-dns.com
```

Or:

```
Type    Name    Value
CNAME   @       cname.vercel-dns.com
CNAME   www     cname.vercel-dns.com
```

**Note:** DNS changes can take 24-48 hours to propagate.

---

## Step 4: Test Backend Health

### Test 1: Wake Up the Backend (if on free tier)

Render free tier spins down after 15 minutes of inactivity. Wake it up first:

```bash
# Visit in browser (wait 30-60 seconds for cold start)
https://reviewhub-website-manus-latest.onrender.com/healthz
```

**Expected Response:** `ok`

### Test 2: Detailed Health Check

```bash
# Visit in browser
https://reviewhub-website-manus-latest.onrender.com/api/health
```

**Expected Response:**
```json
{
  "status": "ok",
  "service": "reviewhub-backend",
  "timestamp": "2026-01-22T...",
  "environment": "production"
}
```

### Test 3: Test CORS

Open browser console on `https://thereviewhub.ca` and run:

```javascript
fetch('https://reviewhub-website-manus-latest.onrender.com/api/health')
  .then(r => r.json())
  .then(d => console.log('✅ CORS working:', d))
  .catch(e => console.error('❌ CORS failed:', e))
```

**Expected:** Should log the health response without CORS errors.

---

## Step 5: Test Frontend-Backend Connectivity

### Test 1: Frontend Loads

Visit: https://thereviewhub.ca

**Expected:** HomePage should load with products, categories visible.

### Test 2: Check Browser Console

Open DevTools (F12) → Console tab

**Should NOT see:**
- ❌ CORS errors
- ❌ Failed to fetch errors
- ❌ 404 on API calls

**Should see:**
- ✅ Successful API calls to `/api/products`, `/api/categories`

### Test 3: Check Network Tab

Open DevTools (F12) → Network tab → Reload page

**Expected:**
- API calls go to `reviewhub-website-manus-latest.onrender.com/api/*`
- Status codes are `200 OK` (not 404 or 500)
- Response previews show JSON data

---

## Step 6: Test Authentication Flow

### Test 1: Register New User

1. Go to https://thereviewhub.ca
2. Click **Register** or **Sign Up**
3. Fill in:
   - Username: `testuser123`
   - Email: `your-email@example.com` (use a real email you can check)
   - Password: `TestPassword123!`
4. Submit

**Expected Results:**

✅ **If SMTP is configured:**
- "Please check your email to verify your account"
- You receive an email at the address you provided
- Email contains verification link

❌ **If SMTP is NOT configured:**
- User registered but email not sent (check Render logs)
- Backend logs will show SMTP connection error

### Test 2: Email Verification Link

If you received the email:

1. Click the verification link in the email
2. **CRITICAL:** Link should point to `https://thereviewhub.ca/verify-email?token=...`
   - ❌ If it points to `http://localhost:3000/verify-email?token=...` → `APP_BASE_URL` not set correctly in Render
3. Should redirect to login page with success message

### Test 3: Login

1. Go to https://thereviewhub.ca
2. Click **Login**
3. Enter your username/email and password
4. Submit

**Expected:**
- Successful login
- Redirected to homepage or profile
- User menu shows your username

---

## Step 7: Test Review Creation

### Test 1: Create a Review (Without Email Verification)

1. Try to create a review without verifying email

**Expected:**
- ❌ Should fail or show "Email not verified" error

### Test 2: Create a Review (After Email Verification)

1. Log in with a verified account
2. Navigate to a product page
3. Click **Write a Review**
4. Fill in:
   - Rating: 5 stars
   - Title: "Test Review"
   - Content: "This is a test review"
5. Submit

**Expected:**
- ✅ Review created successfully
- Review appears on product page

---

## Step 8: Test Image Upload

1. Create a review
2. Upload an image

**Expected:**

✅ **If using local storage:**
- Image uploads successfully
- ⚠️ **WARNING:** Image will be lost on next Render redeploy (see S3 migration guide)

✅ **If using S3:**
- Image uploads to S3
- Image persists across redeploys

---

## Step 9: Run Automated Smoke Tests

Once backend is awake and responding:

```bash
cd reviewhub-backend

# Install test dependencies (if not already installed)
pip install -r requirements-dev.txt

# Run smoke tests against production
TEST_BASE_URL=https://reviewhub-website-manus-latest.onrender.com pytest test_smoke.py -v
```

**Expected:** Most tests should pass. Some may fail if:
- SMTP not configured (email tests)
- No products in database (product tests)

---

## Troubleshooting

### Issue: Frontend shows "Failed to fetch"

**Cause:** Backend is sleeping or CORS not configured

**Fix:**
1. Wake up backend: Visit https://reviewhub-website-manus-latest.onrender.com/healthz
2. Check `CORS_ALLOWED_ORIGINS` in Render environment includes `https://thereviewhub.ca`
3. Redeploy backend after changing environment variables

### Issue: Email verification links point to localhost

**Cause:** `APP_BASE_URL` not set in Render

**Fix:**
1. Go to Render → Environment
2. Set `APP_BASE_URL=https://thereviewhub.ca`
3. Redeploy

### Issue: CORS errors in browser console

**Cause:** CORS not configured correctly

**Fix:**
```bash
# In Render, ensure CORS_ALLOWED_ORIGINS includes:
CORS_ALLOWED_ORIGINS=https://thereviewhub.ca,https://reviewhub-website-manus-latest.vercel.app
```

### Issue: 403 Forbidden on API calls

**Cause:** Rate limiting triggered or authentication issue

**Fix:**
1. Check if you're making too many requests (rate limit)
2. Check if endpoint requires authentication
3. Check Render logs for details

### Issue: Images not loading

**Cause 1:** Using local storage and backend redeployed

**Fix:** Migrate to S3 (see `S3_MIGRATION_GUIDE.md`)

**Cause 2:** CORS on image URLs

**Fix:** Ensure images are served from same origin or CORS is configured

### Issue: Database connection errors

**Cause:** DATABASE_URL incorrect or database not accessible

**Fix:**
1. Verify DATABASE_URL in Render matches your PostgreSQL instance
2. Check PostgreSQL is running (Render dashboard)
3. Check database credentials

---

## Email Setup Guide (Critical for Production)

### Option 1: Gmail SMTP

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to https://myaccount.google.com/security
   - Search for "App passwords"
   - Generate password for "Mail"
3. **Set in Render:**
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=<generated-app-password>
   FROM_EMAIL=no-reply@thereviewhub.ca
   FROM_NAME=ReviewHub
   ```

### Option 2: SendGrid (Recommended for Production)

1. Sign up at https://sendgrid.com (free tier: 100 emails/day)
2. Create API key
3. **Set in Render:**
   ```bash
   SENDGRID_API_KEY=your-api-key
   FROM_EMAIL=no-reply@thereviewhub.ca
   FROM_NAME=ReviewHub
   ```

### Option 3: Other SMTP Providers

- **Mailgun**: https://www.mailgun.com
- **Amazon SES**: https://aws.amazon.com/ses/
- **Postmark**: https://postmarkapp.com

---

## Production Deployment Checklist

Before announcing your site is live:

- [ ] Backend health endpoint responding (`/healthz` returns "ok")
- [ ] CORS configured correctly (no console errors)
- [ ] `APP_BASE_URL` set to `https://thereviewhub.ca` in Render
- [ ] `CORS_ALLOWED_ORIGINS` includes custom domain in Render
- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] Custom domain `thereviewhub.ca` configured in Vercel
- [ ] DNS records pointing to Vercel (green checkmark)
- [ ] Email service configured (SMTP or SendGrid)
- [ ] Email verification links point to correct domain (not localhost)
- [ ] Users can register, verify email, and login
- [ ] Users can create reviews
- [ ] Database backups enabled in Render
- [ ] Smoke tests passing against production
- [ ] Images loading correctly (or S3 migration planned)
- [ ] Admin account created for moderation

---

## Monitoring & Maintenance

### Daily Checks

- [ ] Visit https://thereviewhub.ca - site loads
- [ ] Check Render logs for errors
- [ ] Check database size (Render dashboard)

### Weekly Checks

- [ ] Run smoke tests against production
- [ ] Check email delivery (test registration)
- [ ] Review Render metrics (response times, errors)
- [ ] Check database backups exist

### Monthly Tasks

- [ ] Review user feedback
- [ ] Check for security updates (Python packages)
- [ ] Test disaster recovery (restore from backup)
- [ ] Review and clean up old data/images

---

## Next Steps After Verification

Once everything above is verified and working:

1. **Phase 1:** Start adding features:
   - Product detail page UX improvements
   - Search and filtering enhancements
   - Admin moderation tools
   - User analytics

2. **S3 Migration:** Move images to cloud storage (see `S3_MIGRATION_GUIDE.md`)

3. **Performance:** Add caching, CDN for images

4. **Monitoring:** Set up error tracking (Sentry)

---

**Last Updated:** 2026-01-22
**Status:** Phase 0 complete, ready for production verification
**Next Phase:** Phase 1 - Core Product Polish
