# Phase 0 Final Steps - Image Storage Migration

## Current Status

✅ **COMPLETED**:
- Backend health endpoints working
- Frontend/backend connectivity verified
- CORS configured correctly
- Email verification flow working with SMTP2GO
- Authentication flow complete
- All security fixes applied
- Production deployment verified

⚠️ **REMAINING**:
- Image persistence (images lost on Render redeploys)

---

## Task: Set Up Cloudflare R2 for Image Storage

**Time Required**: 15-20 minutes
**Guide**: See `CLOUDFLARE_R2_SETUP.md` for detailed instructions

### Quick Action Plan

#### 1. Create Cloudflare R2 Account & Bucket (5 min)

1. Go to https://dash.cloudflare.com
2. Click **R2** in left sidebar
3. Click **Create bucket**
4. Name: `reviewhub-images`
5. Location: Choose closest to your users (e.g., `ENAM` for North America East)
6. Under **Settings** → **Public access** → Click **Allow Access**
7. Copy the **Public bucket URL** (e.g., `https://pub-abc123.r2.dev`)

#### 2. Generate API Credentials (3 min)

1. Click **Manage R2 API Tokens** (top right)
2. Click **Create API token**
3. Name: `reviewhub-backend`
4. Permissions: **Admin Read & Write**
5. Buckets: **Apply to specific buckets only** → Select `reviewhub-images`
6. Click **Create API Token**
7. **SAVE BOTH VALUES** (you won't see the secret again):
   - Access Key ID: `<32-character string>`
   - Secret Access Key: `<64-character string>`

#### 3. Find Your Account ID (1 min)

Look at your R2 dashboard URL:
```
https://dash.cloudflare.com/<THIS-IS-YOUR-ACCOUNT-ID>/r2
```

Example:
```
https://dash.cloudflare.com/a1b2c3d4e5f6g7h8/r2
                            ^^^^^^^^^^^^^^^^
                            This is your Account ID
```

#### 4. Update Render Environment Variables (5 min)

Go to **Render Dashboard → reviewhub-backend → Environment**

Add these 6 variables:

```bash
IMAGE_STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=<your-access-key-from-step-2>
AWS_SECRET_ACCESS_KEY=<your-secret-key-from-step-2>
AWS_S3_BUCKET=reviewhub-images
AWS_S3_REGION=auto
AWS_S3_ENDPOINT_URL=https://<your-account-id>.r2.cloudflarestorage.com
```

Optional 7th variable (recommended):
```bash
AWS_S3_PUBLIC_URL=<public-bucket-url-from-step-1>
```

Click **Save Changes** → Wait for automatic redeploy (~2-3 minutes)

#### 5. Test Image Upload (5 min)

1. Go to https://www.thereviewhub.ca
2. Log in
3. Find a product and click **Write a Review**
4. Fill in rating, title, content
5. **Upload a test image** (JPG/PNG under 5MB)
6. Submit review
7. **Verify**: Image displays in the review

#### 6. Verify Persistence (2 min)

1. Go to Render Dashboard → Your service
2. Click **Manual Deploy** → **Deploy latest commit**
3. Wait for redeploy to complete (~2 minutes)
4. Go back to your review with the uploaded image
5. **Expected**: Image still loads ✅

If image still loads after redeploy, **persistence is verified** and Phase 0 is complete!

---

## Troubleshooting

### Issue: "Access Denied" in Render logs

**Fix**: Double-check your API credentials in Render environment match exactly what Cloudflare showed you

### Issue: "Bucket not found"

**Fix**:
1. Verify bucket name is exactly `reviewhub-images` (no typos)
2. Verify endpoint URL uses your correct Account ID

### Issue: Images upload but don't display

**Fix**:
1. Ensure public access is enabled on bucket (Step 1.6)
2. Check `AWS_S3_PUBLIC_URL` matches the public bucket URL from Cloudflare
3. Or remove `AWS_S3_PUBLIC_URL` to serve images through backend proxy

### Issue: CORS errors when loading images

**Fix**: Add CORS policy to R2 bucket (see CLOUDFLARE_R2_SETUP.md section "Troubleshooting → CORS errors")

---

## What Happens to Old Images?

**Short answer**: They're already gone (lost on previous Render redeploys).

**Options**:

**Option A - Do Nothing** (Recommended)
- Old reviews will show broken image placeholders
- New uploads will work perfectly
- Database still has references to missing files (harmless)

**Option B - Clean Database**
- Remove database entries for missing images
- Cleaner database, but takes manual work
- See CLOUDFLARE_R2_SETUP.md section "Step 6: Migrate Existing Images"

**Option C - Re-upload**
- Ask users to re-upload images to their old reviews
- Most thorough but requires user action

---

## After Completion

Once images persist across redeploys:

🎉 **Phase 0 - Stabilization is COMPLETE**

You can proceed to:

### Phase 1 - Core Product Polish
- Product detail page UX improvements
- Search and filtering enhancements
- Admin moderation tools
- User analytics
- Email template improvements (you mentioned these "may need sprucing up")

---

## Support

If you get stuck:
- Check `CLOUDFLARE_R2_SETUP.md` for detailed troubleshooting
- Check Render logs for specific error messages
- Check Cloudflare R2 dashboard → Bucket → Metrics to confirm files are uploading

---

**Created**: 2026-01-23
**Purpose**: Complete Phase 0 by fixing image persistence
**Next Phase**: Phase 1 - Core Product Polish
