# S3 Image Storage Migration Guide

## Overview

This guide explains how to migrate from local filesystem image storage to S3-compatible cloud storage (AWS S3, Cloudflare R2, DigitalOcean Spaces, etc.).

**Why migrate?**
- ✅ Images persist across container restarts/redeploys
- ✅ Scalable storage (no disk space limits)
- ✅ CDN integration for faster image delivery
- ✅ Automatic backups and redundancy
- ✅ No server disk usage

## Supported Services

Your file_storage.py supports any S3-compatible service:

| Service | Cost (approx) | Notes |
|---------|---------------|-------|
| **AWS S3** | $0.023/GB/month | Industry standard, global regions |
| **Cloudflare R2** | $0.015/GB/month | Free egress, fast globally |
| **DigitalOcean Spaces** | $5/month (250GB) | Simple pricing, includes CDN |
| **Backblaze B2** | $0.005/GB/month | Cheapest option |
| **Wasabi** | $5.99/TB/month | Flat rate, no egress fees |

**Recommendation**: Cloudflare R2 (free egress + competitive pricing) or DigitalOcean Spaces (predictable cost).

## Pre-Migration Checklist

- [ ] Choose S3 provider (see table above)
- [ ] Create S3 bucket/space
- [ ] Generate access credentials (Access Key ID + Secret Key)
- [ ] Test bucket accessibility
- [ ] Backup local images folder
- [ ] Backup database
- [ ] Schedule maintenance window (optional)

## Step 1: Create S3 Bucket

### AWS S3

```bash
# Using AWS CLI
aws s3 mb s3://reviewhub-images --region us-east-1

# Set public read access
aws s3api put-bucket-acl --bucket reviewhub-images --acl public-read

# Or use AWS Console:
# 1. Go to https://console.aws.amazon.com/s3
# 2. Create bucket → reviewhub-images
# 3. Uncheck "Block all public access"
# 4. Enable versioning (recommended)
```

### Cloudflare R2

```bash
# Using Wrangler CLI
npx wrangler r2 bucket create reviewhub-images

# Or use Cloudflare Dashboard:
# 1. Go to R2 section in Cloudflare dashboard
# 2. Create bucket → reviewhub-images
# 3. Configure public access settings
```

### DigitalOcean Spaces

```bash
# Using doctl
doctl compute space create reviewhub-images --region nyc3

# Or use DigitalOcean Console:
# 1. Create → Spaces
# 2. Choose region
# 3. Name: reviewhub-images
# 4. Enable CDN
```

## Step 2: Generate Access Credentials

### AWS S3

1. Go to IAM → Users → Create User
2. Attach policy: `AmazonS3FullAccess` (or create custom policy)
3. Create access key → Save credentials

**Custom Policy (Recommended)**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::reviewhub-images",
        "arn:aws:s3:::reviewhub-images/*"
      ]
    }
  ]
}
```

### Cloudflare R2

1. R2 → Manage R2 API Tokens
2. Create API Token
3. Set permissions: Object Read & Write
4. Save Access Key ID and Secret Access Key

### DigitalOcean Spaces

1. API → Tokens/Keys → Spaces access keys
2. Generate New Key
3. Save Access Key and Secret Key

## Step 3: Configure Environment Variables

Update your `.env` file in `reviewhub-backend/`:

```bash
# Change storage type from local to s3
STORAGE_TYPE=s3

# S3 Configuration
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key
AWS_S3_BUCKET=reviewhub-images
AWS_S3_REGION=us-east-1

# For AWS S3, leave AWS_S3_ENDPOINT empty or remove it
# For S3-compatible services, set the endpoint:

# Cloudflare R2
# AWS_S3_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com

# DigitalOcean Spaces (replace nyc3 with your region)
# AWS_S3_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Backblaze B2
# AWS_S3_ENDPOINT=https://s3.us-west-002.backblazeb2.com

# Wasabi
# AWS_S3_ENDPOINT=https://s3.wasabisys.com
```

## Step 4: Test S3 Connection

Test your credentials before migrating:

```bash
cd reviewhub-backend

# Test with Python
python3 << EOF
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

s3 = boto3.client(
    's3',
    aws_access_key_id=os.getenv('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.getenv('AWS_SECRET_ACCESS_KEY'),
    region_name=os.getenv('AWS_S3_REGION'),
    endpoint_url=os.getenv('AWS_S3_ENDPOINT')  # None for AWS S3
)

bucket = os.getenv('AWS_S3_BUCKET')

try:
    s3.head_bucket(Bucket=bucket)
    print(f"✅ Successfully connected to bucket: {bucket}")
except Exception as e:
    print(f"❌ Connection failed: {e}")
EOF
```

## Step 5: Run Migration Script

The migration script will:
1. Upload all local images to S3
2. Update database URLs
3. Preserve folder structure

```bash
cd reviewhub-backend

# First, run a dry-run to see what will happen
python migrate_images_to_s3.py --dry-run

# Review the output, then run actual migration
python migrate_images_to_s3.py
```

**Expected Output:**
```
==============================================================
  Image Migration to S3
==============================================================

Step 1: Validating configuration...
✅ Configuration validated

Step 2: Connecting to S3...
✅ S3 client created

Step 3: Testing S3 bucket access...
✅ S3 bucket 'reviewhub-images' is accessible

Step 4: Scanning local images in 'uploads'...
Found 47 images

Step 5: Uploading images to S3...
  ✅ Uploaded: reviews/review_1_20260115_abc123.jpg
  ✅ Uploaded: thumbnails/thumb_1_20260115_abc123.jpg
  ...

Step 6: Updating database URLs...
✅ Updated 47 image records in database

==============================================================
  Migration Complete
==============================================================
  ✅ Successful: 47
  ❌ Failed: 0
  📁 Total: 47
```

## Step 6: Verify Migration

### Test Image Uploads

```bash
# Restart your application with STORAGE_TYPE=s3
# Try uploading a new review image from the frontend
# Verify the image appears correctly
```

### Check Database URLs

```bash
psql $DATABASE_URL -c "SELECT main_url, thumbnail_url FROM image LIMIT 5;"

# URLs should now be S3 URLs like:
# https://reviewhub-images.s3.amazonaws.com/reviews/...
```

### Test Image Loading

1. Open your ReviewHub frontend
2. Navigate to a product with review images
3. Verify images load correctly
4. Check browser devtools network tab for S3 URLs

## Step 7: Update Production

### On Render

1. Go to your Render backend service
2. Navigate to "Environment" tab
3. Add/update these variables:
   ```
   STORAGE_TYPE=s3
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   AWS_S3_BUCKET=reviewhub-images
   AWS_S3_REGION=us-east-1
   AWS_S3_ENDPOINT=...  (if using S3-compatible service)
   ```
4. Click "Save Changes" (this will redeploy)

### On Vercel (Frontend)

No changes needed! The frontend uses relative URLs that the backend resolves.

## Step 8: Cleanup (After Verification)

**Wait 1-2 weeks before deleting local files** to ensure everything works correctly.

```bash
# After verifying S3 migration is successful:
# 1. Backup local images one last time
tar -czf uploads_backup_$(date +%Y%m%d).tar.gz uploads/

# 2. Remove local uploads folder
rm -rf uploads/

# 3. Update Dockerfile to remove volume mounts (if any)
```

## Troubleshooting

### Images Not Loading

**Symptom**: Broken image links after migration

**Solutions**:
1. Check S3 bucket has public-read ACL
   ```bash
   aws s3api get-bucket-acl --bucket reviewhub-images
   ```

2. Verify CORS configuration (if images load on backend but not frontend)
   ```json
   {
     "CORSRules": [
       {
         "AllowedOrigins": ["*"],
         "AllowedMethods": ["GET", "HEAD"],
         "AllowedHeaders": ["*"],
         "MaxAgeSeconds": 3000
       }
     ]
   }
   ```

   Apply with:
   ```bash
   aws s3api put-bucket-cors --bucket reviewhub-images --cors-configuration file://cors.json
   ```

### Access Denied Errors

**Symptom**: `AccessDenied` or `403 Forbidden`

**Solutions**:
1. Verify access keys are correct
2. Check IAM policy allows s3:PutObject and s3:GetObject
3. Verify bucket policy allows public reads

### Wrong URLs in Database

**Symptom**: Database still has `/api/uploads/` URLs

**Solution**: Manually update URLs
```sql
-- For AWS S3
UPDATE image
SET
  main_url = REPLACE(main_url, '/api/uploads/', 'https://reviewhub-images.s3.amazonaws.com/'),
  thumbnail_url = REPLACE(thumbnail_url, '/api/uploads/', 'https://reviewhub-images.s3.amazonaws.com/');

-- For Cloudflare R2 (replace ACCOUNT_ID)
UPDATE image
SET
  main_url = REPLACE(main_url, '/api/uploads/', 'https://ACCOUNT_ID.r2.cloudflarestorage.com/reviewhub-images/'),
  thumbnail_url = REPLACE(thumbnail_url, '/api/uploads/', 'https://ACCOUNT_ID.r2.cloudflarestorage.com/reviewhub-images/');
```

### Slow Image Loading

**Symptom**: Images take too long to load

**Solutions**:
1. Enable CDN (CloudFront for AWS, automatic for Cloudflare R2)
2. Set proper cache headers in file_storage.py
3. Consider using a closer S3 region

## CDN Configuration (Optional but Recommended)

### CloudFront (AWS S3)

1. Create CloudFront distribution
2. Origin: Your S3 bucket
3. Update main_url in file_storage.py to use CloudFront URL

### Cloudflare R2

CDN is automatically included! Just use the public URL.

### DigitalOcean Spaces

CDN is automatically enabled. Use the CDN endpoint:
```
https://reviewhub-images.nyc3.cdn.digitaloceanspaces.com/
```

## Cost Estimation

### For 1000 users, 10GB storage, 50GB transfer/month

| Provider | Storage | Transfer | Total/Month |
|----------|---------|----------|-------------|
| AWS S3 | $0.23 | $4.50 | **$4.73** |
| Cloudflare R2 | $0.15 | $0.00 | **$0.15** ⭐ |
| DO Spaces | $5.00 | $0.00 | **$5.00** |
| Backblaze B2 | $0.05 | $0.50 | **$0.55** |

**Winner**: Cloudflare R2 (free egress) or Backblaze B2 (cheapest)

## Rollback Plan

If migration fails and you need to rollback:

```bash
# 1. Stop the application
# 2. Restore local uploads folder from backup
tar -xzf uploads_backup_YYYYMMDD.tar.gz

# 3. Restore database URLs
psql $DATABASE_URL << EOF
UPDATE image
SET
  main_url = REPLACE(main_url, 'https://s3-url/', '/api/uploads/'),
  thumbnail_url = REPLACE(thumbnail_url, 'https://s3-url/', '/api/uploads/');
EOF

# 4. Set STORAGE_TYPE=local in .env
# 5. Restart application
```

## Best Practices

1. **Use separate buckets** for dev/staging/production
2. **Enable versioning** in S3 bucket (recover deleted images)
3. **Set lifecycle policies** to archive old images to cheaper storage
4. **Monitor costs** regularly (set billing alerts)
5. **Use CDN** for faster global image delivery
6. **Backup bucket** periodically (cross-region replication)

## Security Considerations

1. **Never commit credentials** to git (use .env)
2. **Use IAM roles** in production (not access keys)
3. **Restrict bucket policy** to only necessary permissions
4. **Enable bucket logging** for audit trail
5. **Use HTTPS** for all image URLs (enforce SSL)

## Support & Resources

- **AWS S3**: https://docs.aws.amazon.com/s3/
- **Cloudflare R2**: https://developers.cloudflare.com/r2/
- **DigitalOcean Spaces**: https://docs.digitalocean.com/products/spaces/
- **boto3 (Python S3 client)**: https://boto3.amazonaws.com/v1/documentation/api/latest/index.html

---

**Last Updated**: 2026-01-21
**Migration Script**: `reviewhub-backend/migrate_images_to_s3.py`
**Questions?**: Check troubleshooting section or contact DevOps team
