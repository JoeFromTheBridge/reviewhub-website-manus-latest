# Manual Testing Checklist - Phase 0 Verification

**Site:** https://thereviewhub.ca
**Date:** _________
**Tester:** _________

Use this checklist to verify Phase 0 is complete and production is ready for Phase 1.

---

## ✅ Backend Health (5 min)

### 1.1 Health Endpoint
- [ ] Visit: https://reviewhub-website-manus-latest.onrender.com/healthz
- [ ] **Expected:** Page shows `ok`
- [ ] **Status:** ___________

### 1.2 API Health Endpoint
- [ ] Visit: https://reviewhub-website-manus-latest.onrender.com/api/health
- [ ] **Expected:** JSON with `{"status": "ok", "service": "reviewhub-backend", ...}`
- [ ] **Status:** ___________

### 1.3 CORS Test
- [ ] Open https://thereviewhub.ca
- [ ] Open browser DevTools (F12) → Console tab
- [ ] Paste and run:
  ```javascript
  fetch('https://reviewhub-website-manus-latest.onrender.com/api/health')
    .then(r => r.json())
    .then(d => console.log('✅ CORS working:', d))
    .catch(e => console.error('❌ CORS failed:', e))
  ```
- [ ] **Expected:** Console shows `✅ CORS working: {status: 'ok', ...}`
- [ ] **Status:** ___________

---

## ✅ Frontend Loading (5 min)

### 2.1 Homepage Loads
- [ ] Visit: https://thereviewhub.ca
- [ ] **Expected:** Homepage loads, no blank page
- [ ] **Expected:** Header, navigation visible
- [ ] **Status:** ___________

### 2.2 Products Visible
- [ ] **Expected:** Products display on homepage
- [ ] **Expected:** Product images load (if any products exist)
- [ ] **Status:** ___________

### 2.3 No Console Errors
- [ ] Open DevTools (F12) → Console tab
- [ ] Reload page
- [ ] **Expected:** No red errors about:
  - Failed to fetch
  - CORS policy
  - 404 on API calls
- [ ] **Status:** ___________

### 2.4 API Calls Working
- [ ] DevTools (F12) → Network tab
- [ ] Reload page
- [ ] Filter by "Fetch/XHR"
- [ ] **Expected:** Calls to `/api/products`, `/api/categories` show 200 status
- [ ] **Status:** ___________

---

## ✅ Authentication Flow (10 min)

### 3.1 Registration
- [ ] Click "Sign Up" or "Register"
- [ ] Fill in form:
  - Username: `phase0test`
  - Email: (your actual email)
  - Password: `TestPass123!`
- [ ] Submit
- [ ] **Expected Result:**

**If EMAIL IS CONFIGURED:** ✉️
- [ ] "Please verify your email" message appears
- [ ] Email received at your inbox
- [ ] **Status:** ___________

**If EMAIL NOT CONFIGURED:** ⚠️
- [ ] User registered but no email sent
- [ ] Check Render logs for SMTP error
- [ ] **Status:** ___________ (Expected failure - SMTP not configured)

### 3.2 Email Verification Link (if email received)
- [ ] Open the verification email
- [ ] **CRITICAL CHECK:** Email link should be:
  - ✅ `https://thereviewhub.ca/verify-email?token=...`
  - ❌ NOT `http://localhost:3000/verify-email?token=...`
- [ ] Click the verification link
- [ ] **Expected:** Redirected to login with success message
- [ ] **Status:** ___________

**If link points to localhost:**
- [ ] Go to Render → Environment → Set `APP_BASE_URL=https://thereviewhub.ca`
- [ ] Redeploy backend
- [ ] Test again

### 3.3 Login
- [ ] Go to homepage
- [ ] Click "Login"
- [ ] Enter:
  - Username/Email: `phase0test`
  - Password: `TestPass123!`
- [ ] Submit
- [ ] **Expected:** Logged in successfully, redirected to homepage
- [ ] **Expected:** User menu shows your username
- [ ] **Status:** ___________

### 3.4 Protected Route (Profile)
- [ ] While logged in, click Profile/Account
- [ ] **Expected:** Profile page loads with user info
- [ ] **Status:** ___________

### 3.5 Logout
- [ ] Click Logout
- [ ] **Expected:** Logged out, redirected to homepage
- [ ] **Expected:** User menu no longer shows username
- [ ] **Status:** ___________

---

## ✅ Review Creation (10 min)

### 4.1 Create Review (Logged In)
- [ ] Log in
- [ ] Navigate to a product page
- [ ] Click "Write a Review"
- [ ] Fill in:
  - Rating: 5 stars
  - Title: "Phase 0 Test Review"
  - Content: "Testing review creation in production"
- [ ] Submit
- [ ] **Expected:** Review created successfully
- [ ] **Expected:** Review appears on product page
- [ ] **Status:** ___________

### 4.2 Image Upload (Optional)
- [ ] Create a review
- [ ] Upload an image
- [ ] **Expected:** Image uploads successfully

**If using LOCAL storage:** ⚠️
- [ ] Image displays in review
- [ ] **WARNING:** Will be lost on next deploy
- [ ] **Action Required:** See S3_MIGRATION_GUIDE.md

**If using S3:** ✅
- [ ] Image persists across deploys
- [ ] **Status:** ___________

### 4.3 Review Without Login
- [ ] Log out
- [ ] Try to create a review
- [ ] **Expected:** Redirected to login or "Login required" message
- [ ] **Status:** ___________

---

## ✅ Admin Functions (5 min)

### 5.1 Admin Access (if admin account exists)
- [ ] Log in with admin account
- [ ] Navigate to `/admin` URL
- [ ] **Expected:** Admin dashboard loads
- [ ] **Status:** ___________

### 5.2 Non-Admin Access
- [ ] Log in with regular user account
- [ ] Try to access `/admin` URL
- [ ] **Expected:** 403 Forbidden or redirect
- [ ] **Status:** ___________

---

## ✅ Security Checks (5 min)

### 6.1 XSS Protection
- [ ] Create a review with content: `<script>alert('XSS')</script>`
- [ ] Submit
- [ ] View the review
- [ ] **Expected:** No alert popup, script tags stripped or escaped
- [ ] **Status:** ___________

### 6.2 Rate Limiting
- [ ] Log out
- [ ] Try to log in 10 times rapidly with wrong password
- [ ] **Expected:** After 5 attempts, should see "Too many requests" or similar
- [ ] **Status:** ___________

### 6.3 Email Verification Required
- [ ] Register a new user but DON'T verify email
- [ ] Try to log in
- [ ] **Expected:** "Email not verified" error
- [ ] **Status:** ___________

---

## ✅ Environment Variables Check (5 min)

### 7.1 Render Environment Variables
- [ ] Go to Render Dashboard → Your Web Service → Environment
- [ ] Verify these are set:
  - [ ] `SECRET_KEY` (64 characters)
  - [ ] `JWT_SECRET_KEY` (64 characters)
  - [ ] `CORS_ALLOWED_ORIGINS` (includes https://thereviewhub.ca)
  - [ ] `APP_BASE_URL` = https://thereviewhub.ca
  - [ ] `DATABASE_URL` (PostgreSQL connection string)
- [ ] **Status:** ___________

### 7.2 Vercel Environment Variables
- [ ] Go to Vercel Dashboard → Project → Settings → Environment Variables
- [ ] Verify:
  - [ ] `VITE_API_URL` = https://reviewhub-website-manus-latest.onrender.com/api
- [ ] **Status:** ___________

---

## ✅ Database & Backups (2 min)

### 8.1 Database Connection
- [ ] Products loading (proves DB connection works)
- [ ] Reviews loading (proves DB connection works)
- [ ] **Status:** ___________

### 8.2 Automated Backups
- [ ] Go to Render Dashboard → PostgreSQL Database → Backups tab
- [ ] Verify backups are enabled
- [ ] Verify at least one backup exists
- [ ] **Status:** ___________

---

## Summary

### Pass/Fail Criteria

**PASS** if:
- ✅ Backend health endpoints respond
- ✅ Frontend loads without errors
- ✅ Users can register and login
- ✅ CORS working (no console errors)
- ✅ Reviews can be created
- ✅ XSS protection working
- ✅ Environment variables set

**CONDITIONAL PASS** if:
- ⚠️ Email not configured (can deploy, but users can't verify emails)
  - **Action:** Set up SMTP in Render (see PRODUCTION_DEPLOYMENT_GUIDE.md)
- ⚠️ Images using local storage (can deploy, but images will be lost)
  - **Action:** Run S3 migration (see S3_MIGRATION_GUIDE.md)

**FAIL** if:
- ❌ CORS errors in console
- ❌ API calls failing (404, 500 errors)
- ❌ Cannot register or login
- ❌ Email verification links point to localhost
  - **Action:** Set `APP_BASE_URL=https://thereviewhub.ca` in Render

---

## Test Results

**Overall Status:** [ ] PASS  [ ] CONDITIONAL PASS  [ ] FAIL

**Blockers (must fix before Phase 1):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Warnings (can fix later):**
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

**Notes:**
_______________________________________________
_______________________________________________
_______________________________________________

---

## Next Steps

**If PASS or CONDITIONAL PASS:**
- [ ] Review warnings and plan fixes
- [ ] Proceed to Phase 1 - Core Product Polish

**If FAIL:**
- [ ] Fix blockers listed above
- [ ] Retest
- [ ] Do not proceed to Phase 1 until PASS

---

**Tested By:** ___________
**Date:** ___________
**Signature:** ___________
