# Cloudflare R2 Setup Guide for ReviewHub

## Why Cloudflare R2?

- **Free Tier**: 10GB storage, 1M reads/month, 1M writes/month
- **Zero Egress Fees**: No charges for bandwidth (unlike AWS S3)
- **S3-Compatible API**: Works with existing boto3 code
- **Fast Global CDN**: Built-in CloudFlare CDN for image delivery
- **Simple Setup**: Easier than AWS, cheaper than DigitalOcean Spaces

---

## Step 1: Create Cloudflare R2 Bucket

### 1.1 Sign Up / Log In to Cloudflare

1. Go to https://dash.cloudflare.com
2. Sign up or log in with your Cloudflare account
3. In the dashboard, click **R2** in the left sidebar

### 1.2 Create a Bucket

1. Click **Create bucket**
2. **Bucket name**: `reviewhub-images` (must be globally unique)
3. **Location**: Choose closest to your users (e.g., `WNAM` for North America West, `ENAM` for North America East)
4. Click **Create bucket**

### 1.3 Configure Public Access (Optional but Recommended)

For direct image serving without authentication:

1. Open your bucket (`reviewhub-images`)
2. Go to **Settings** tab
3. Under **Public access**, click **Allow Access**
4. Copy the **Public bucket URL** (looks like: `https://pub-abc123.r2.dev`)
5. Save this URL for later

---

## Step 2: Generate R2 API Credentials

### 2.1 Create API Token

1. In R2 dashboard, click **Manage R2 API Tokens** (top right)
2. Click **Create API token**
3. **Token name**: `reviewhub-backend`
4. **Permissions**:
   - ✅ Admin Read & Write (for full bucket access)
   - Or if you prefer limited scope: Object Read & Write
5. **Buckets**:
   - Select **Apply to specific buckets only**
   - Choose `reviewhub-images`
6. Click **Create API Token**

### 2.2 Save Credentials

You'll see a screen with:

```
Access Key ID: <32-character string>
Secret Access Key: <64-character string>
```

**CRITICAL**: Copy both values immediately. You won't be able to see the Secret Access Key again.

Example format:
```
Access Key ID: 4a7f8b2c9d1e3f5g6h8i9j0k1l2m3n4o
Secret Access Key: A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6a7b8c9d0e1f2
```

---

## Step 3: Update Backend Environment Variables

### 3.1 Add R2 Configuration to Render

Go to **Render Dashboard → reviewhub-backend service → Environment tab**

Add these environment variables:

```bash
# Image Storage Type
IMAGE_STORAGE_TYPE=s3

# S3 Configuration (Cloudflare R2)
AWS_ACCESS_KEY_ID=<your-r2-access-key-id>
AWS_SECRET_ACCESS_KEY=<your-r2-secret-access-key>
AWS_S3_BUCKET=reviewhub-images
AWS_S3_REGION=auto
AWS_S3_ENDPOINT_URL=https://<your-account-id>.r2.cloudflarestorage.com

# Optional: Public URL for direct image serving
AWS_S3_PUBLIC_URL=https://pub-abc123.r2.dev
```

### 3.2 Find Your Account ID and Endpoint

Your **Account ID** is in the R2 dashboard URL:
- URL format: `https://dash.cloudflare.com/<account-id>/r2`
- Example: `https://dash.cloudflare.com/a1b2c3d4e5f6g7h8i9j0/r2`
- Account ID: `a1b2c3d4e5f6g7h8i9j0`

Your **Endpoint URL** format:
```
https://<account-id>.r2.cloudflarestorage.com
```

Example:
```
https://a1b2c3d4e5f6g7h8i9j0.r2.cloudflarestorage.com
```

### 3.3 Complete Environment Variable Example

```bash
IMAGE_STORAGE_TYPE=s3
AWS_ACCESS_KEY_ID=4a7f8b2c9d1e3f5g6h8i9j0k1l2m3n4o
AWS_SECRET_ACCESS_KEY=A1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6a7b8c9d0e1f2
AWS_S3_BUCKET=reviewhub-images
AWS_S3_REGION=auto
AWS_S3_ENDPOINT_URL=https://a1b2c3d4e5f6g7h8i9j0.r2.cloudflarestorage.com
AWS_S3_PUBLIC_URL=https://pub-abc123.r2.dev
```

---

## Step 4: Install boto3 Dependency

### 4.1 Update requirements.txt

Boto3 should already be in your `requirements.txt`. Verify:

```bash
cd reviewhub-backend
grep boto3 requirements.txt
```

If not present, add:

```
boto3==1.34.34
```

---

## Step 5: Deploy and Test

### 5.1 Trigger Render Redeploy

After adding environment variables in Render:

1. Click **Save Changes**
2. Wait for automatic redeploy (~2-3 minutes)
3. Check logs for any errors

### 5.2 Test Image Upload

1. Go to https://www.thereviewhub.ca
2. Log in with your account
3. Navigate to a product page
4. Click **Write a Review**
5. Fill in rating, title, content
6. **Upload an image** (JPG or PNG, under 5MB)
7. Submit the review

### 5.3 Verify Image Appears

1. Check that the uploaded image displays in the review
2. Open browser DevTools (F12) → Network tab
3. Look for image request
4. **Expected URL format**:
   - With AWS_S3_PUBLIC_URL: `https://pub-abc123.r2.dev/reviews/abc123.jpg`
   - Without: `https://reviewhub-website-manus-latest.onrender.com/api/uploads/reviews/abc123.jpg` (proxied through backend)

### 5.4 Verify Persistence

1. Go to Render Dashboard
2. Manually trigger a redeploy:
   - Go to **Manual Deploy** → **Deploy latest commit**
3. Wait for redeploy to complete
4. Go back to the review with the uploaded image
5. **Expected**: Image still loads (proves it's on R2, not local filesystem)

---

## Step 6: Migrate Existing Images (Optional)

If you have old images in the database that were lost from local storage:

**Note**: The actual image files are already gone (lost on previous Render redeploys). The migration script can only migrate files that still exist in `/app/uploads/`.

Since your images are already lost, you have two options:

### Option A: Clean Up Database

Remove references to missing images:

```python
# Run this in a Python shell with database access
from app_enhanced import db, Image

# Find images with local URLs
images = Image.query.filter(Image.image_url.like('/api/uploads/%')).all()

print(f"Found {len(images)} images with local storage URLs")

# Delete them (files are already gone anyway)
for img in images:
    db.session.delete(img)
    print(f"Deleted: {img.image_url}")

db.session.commit()
print("Database cleaned")
```

### Option B: Do Nothing

Leave the database as-is. Old images won't load (404), but new uploads will work fine.

---

## Troubleshooting

### Issue: "Access Denied" errors in Render logs

**Cause**: Incorrect API credentials

**Fix**:
1. Verify `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` in Render
2. Check API token permissions in Cloudflare R2
3. Ensure token has access to the specific bucket

### Issue: "Bucket not found" errors

**Cause**: Incorrect bucket name or endpoint URL

**Fix**:
1. Verify `AWS_S3_BUCKET=reviewhub-images` matches your actual bucket name
2. Verify `AWS_S3_ENDPOINT_URL` uses your correct account ID
3. Check bucket name is exactly as created (case-sensitive)

### Issue: Images upload but don't display

**Cause**: Public access not enabled or incorrect public URL

**Fix**:
1. Enable public access on your R2 bucket (Settings → Public access → Allow Access)
2. Verify `AWS_S3_PUBLIC_URL` matches the public bucket URL from Cloudflare
3. Or remove `AWS_S3_PUBLIC_URL` to serve images through backend proxy

### Issue: CORS errors when loading images

**Cause**: R2 bucket CORS not configured

**Fix**:
1. In R2 bucket settings, go to **Settings** → **CORS policy**
2. Add this CORS policy:

```json
[
  {
    "AllowedOrigins": [
      "https://www.thereviewhub.ca",
      "https://thereviewhub.ca",
      "https://reviewhub-website-manus-latest.vercel.app"
    ],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

3. Click **Save**

---

## Cost Monitoring

### Free Tier Limits

- **Storage**: 10 GB/month
- **Class A Operations** (writes): 1 million/month
- **Class B Operations** (reads): 10 million/month
- **Egress**: Unlimited (always free)

### How to Monitor Usage

1. Go to R2 dashboard in Cloudflare
2. Click on your bucket
3. Go to **Metrics** tab
4. Check storage used and operation counts

### What Happens If You Exceed Free Tier?

**Pricing beyond free tier**:
- Storage: $0.015/GB-month (~$1.50 per 100GB)
- Class A Operations: $4.50 per million
- Class B Operations: $0.36 per million
- Egress: Free forever

**For ReviewHub scale**: You'd need 100,000+ images to exceed free tier.

---

## Custom Domain Setup (Optional, Phase 2)

Instead of `pub-abc123.r2.dev`, use your own domain:

1. In R2 bucket settings, go to **Settings** → **Custom Domains**
2. Click **Connect Domain**
3. Enter: `images.thereviewhub.ca`
4. Follow DNS instructions to add CNAME record
5. Update `AWS_S3_PUBLIC_URL=https://images.thereviewhub.ca` in Render

**Benefits**:
- Branded URLs
- Better SEO
- Custom caching rules

---

## Verification Checklist

After completing setup:

- [ ] R2 bucket created and public access enabled
- [ ] API token created with correct permissions
- [ ] All environment variables added to Render
- [ ] Backend redeployed successfully
- [ ] Test image upload works
- [ ] Uploaded image displays in review
- [ ] Redeploy backend → image still loads (persistence verified)
- [ ] Check R2 dashboard → files visible in bucket
- [ ] No CORS errors in browser console

---

## Phase 0 Completion

Once images are uploading to R2 and persisting across redeploys:

✅ **Phase 0 - Stabilization is COMPLETE**

You can now proceed to:
- **Phase 1 - Core Product Polish**
  - Product detail page UX improvements
  - Search and filtering enhancements
  - Admin moderation tools
  - User analytics

---

## Support Resources

- **Cloudflare R2 Docs**: https://developers.cloudflare.com/r2/
- **R2 API Reference**: https://developers.cloudflare.com/r2/api/s3/api/
- **boto3 S3 Docs**: https://boto3.amazonaws.com/v1/documentation/api/latest/reference/services/s3.html

---

**Last Updated**: 2026-01-23
**Status**: Ready for implementation
**Estimated Setup Time**: 15-20 minutes
