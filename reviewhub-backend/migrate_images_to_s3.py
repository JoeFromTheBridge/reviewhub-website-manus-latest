#!/usr/bin/env python3
"""
Migration script to move images from local storage to S3-compatible storage.

Usage:
    python migrate_images_to_s3.py --dry-run  # Test without uploading
    python migrate_images_to_s3.py             # Perform migration

Prerequisites:
    - Configure S3 credentials in environment variables
    - Ensure S3 bucket exists and is accessible
    - Run from reviewhub-backend directory
"""

import os
import sys
import boto3
import mimetypes
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Load environment variables
load_dotenv()

# Configuration
AWS_ACCESS_KEY_ID = os.getenv('AWS_ACCESS_KEY_ID')
AWS_SECRET_ACCESS_KEY = os.getenv('AWS_SECRET_ACCESS_KEY')
AWS_S3_BUCKET = os.getenv('AWS_S3_BUCKET')
AWS_S3_REGION = os.getenv('AWS_S3_REGION', 'us-east-1')
AWS_S3_ENDPOINT = os.getenv('AWS_S3_ENDPOINT')  # Optional for S3-compatible services
DATABASE_URL = os.getenv('DATABASE_URL')
UPLOAD_FOLDER = os.getenv('UPLOAD_FOLDER', 'uploads')

def validate_configuration():
    """Validate required configuration"""
    missing = []

    if not AWS_ACCESS_KEY_ID:
        missing.append('AWS_ACCESS_KEY_ID')
    if not AWS_SECRET_ACCESS_KEY:
        missing.append('AWS_SECRET_ACCESS_KEY')
    if not AWS_S3_BUCKET:
        missing.append('AWS_S3_BUCKET')
    if not DATABASE_URL:
        missing.append('DATABASE_URL')

    if missing:
        print(f"❌ Missing required environment variables: {', '.join(missing)}")
        print("\nPlease configure these in your .env file:")
        for var in missing:
            print(f"  {var}=...")
        sys.exit(1)

    print("✅ Configuration validated")

def create_s3_client():
    """Create S3 client"""
    kwargs = {
        'aws_access_key_id': AWS_ACCESS_KEY_ID,
        'aws_secret_access_key': AWS_SECRET_ACCESS_KEY,
        'region_name': AWS_S3_REGION
    }

    # Add endpoint URL for S3-compatible services (Cloudflare R2, DigitalOcean Spaces, etc.)
    if AWS_S3_ENDPOINT:
        kwargs['endpoint_url'] = AWS_S3_ENDPOINT

    return boto3.client('s3', **kwargs)

def test_s3_connection(s3_client):
    """Test S3 bucket access"""
    try:
        s3_client.head_bucket(Bucket=AWS_S3_BUCKET)
        print(f"✅ S3 bucket '{AWS_S3_BUCKET}' is accessible")
        return True
    except Exception as e:
        print(f"❌ Cannot access S3 bucket '{AWS_S3_BUCKET}': {str(e)}")
        return False

def find_local_images():
    """Find all images in local upload folder"""
    upload_path = Path(UPLOAD_FOLDER)

    if not upload_path.exists():
        print(f"⚠️  Upload folder '{UPLOAD_FOLDER}' not found")
        return []

    image_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
    images = []

    for file_path in upload_path.rglob('*'):
        if file_path.is_file() and file_path.suffix.lower() in image_extensions:
            images.append(file_path)

    return images

def upload_to_s3(s3_client, local_path, s3_key, dry_run=False):
    """Upload a file to S3"""
    if dry_run:
        print(f"  [DRY RUN] Would upload: {local_path} → s3://{AWS_S3_BUCKET}/{s3_key}")
        return True

    try:
        content_type = mimetypes.guess_type(str(local_path))[0] or 'application/octet-stream'

        with open(local_path, 'rb') as f:
            s3_client.put_object(
                Bucket=AWS_S3_BUCKET,
                Key=s3_key,
                Body=f,
                ContentType=content_type,
                ACL='public-read'
            )

        print(f"  ✅ Uploaded: {s3_key}")
        return True

    except Exception as e:
        print(f"  ❌ Failed to upload {local_path}: {str(e)}")
        return False

def update_database_urls(dry_run=False):
    """Update image URLs in database from local paths to S3 URLs"""
    if dry_run:
        print("\n[DRY RUN] Would update database URLs from /api/uploads/ to S3 URLs")
        return

    try:
        engine = create_engine(DATABASE_URL)
        Session = sessionmaker(bind=engine)
        session = Session()

        # Determine S3 base URL
        if AWS_S3_ENDPOINT:
            # Custom endpoint (Cloudflare R2, DigitalOcean Spaces, etc.)
            s3_base = f"{AWS_S3_ENDPOINT.rstrip('/')}/{AWS_S3_BUCKET}"
        else:
            # Standard AWS S3
            s3_base = f"https://{AWS_S3_BUCKET}.s3.amazonaws.com"

        # Update image URLs
        # Note: This assumes your Image table has main_url and thumbnail_url fields
        update_query = f"""
        UPDATE image
        SET
            main_url = REPLACE(main_url, '/api/uploads/', '{s3_base}/'),
            thumbnail_url = REPLACE(thumbnail_url, '/api/uploads/', '{s3_base}/')
        WHERE
            main_url LIKE '/api/uploads/%'
            OR thumbnail_url LIKE '/api/uploads/%'
        """

        result = session.execute(update_query)
        updated_count = result.rowcount
        session.commit()

        print(f"\n✅ Updated {updated_count} image records in database")

        session.close()

    except Exception as e:
        print(f"\n❌ Database update failed: {str(e)}")
        print("You may need to update URLs manually")

def migrate_images(dry_run=False):
    """Main migration function"""
    print(f"\n{'='*60}")
    print(f"  Image Migration to S3 {'(DRY RUN)' if dry_run else ''}")
    print(f"{'='*60}\n")

    # Step 1: Validate configuration
    print("Step 1: Validating configuration...")
    validate_configuration()

    # Step 2: Create S3 client
    print("\nStep 2: Connecting to S3...")
    s3_client = create_s3_client()

    # Step 3: Test S3 access
    print("\nStep 3: Testing S3 bucket access...")
    if not test_s3_connection(s3_client):
        sys.exit(1)

    # Step 4: Find local images
    print(f"\nStep 4: Scanning local images in '{UPLOAD_FOLDER}'...")
    local_images = find_local_images()
    print(f"Found {len(local_images)} images")

    if not local_images:
        print("No images to migrate!")
        return

    # Step 5: Upload images
    print("\nStep 5: Uploading images to S3...")
    success_count = 0
    failed_count = 0

    for local_path in local_images:
        # Preserve folder structure in S3
        relative_path = local_path.relative_to(UPLOAD_FOLDER)
        s3_key = str(relative_path).replace('\\', '/')  # Windows compatibility

        if upload_to_s3(s3_client, local_path, s3_key, dry_run):
            success_count += 1
        else:
            failed_count += 1

    # Step 6: Update database
    print("\nStep 6: Updating database URLs...")
    update_database_urls(dry_run)

    # Summary
    print(f"\n{'='*60}")
    print(f"  Migration {'Preview' if dry_run else 'Complete'}")
    print(f"{'='*60}")
    print(f"  ✅ Successful: {success_count}")
    print(f"  ❌ Failed: {failed_count}")
    print(f"  📁 Total: {len(local_images)}")

    if not dry_run:
        print(f"\n⚠️  IMPORTANT: Update STORAGE_TYPE=s3 in your .env file")
        print(f"⚠️  IMPORTANT: Test image uploads before deleting local files")
        print(f"\nTo remove local files after verification:")
        print(f"  rm -rf {UPLOAD_FOLDER}/*")
    else:
        print(f"\nTo perform actual migration, run:")
        print(f"  python migrate_images_to_s3.py")

if __name__ == '__main__':
    import argparse

    parser = argparse.ArgumentParser(description='Migrate images from local storage to S3')
    parser.add_argument('--dry-run', action='store_true', help='Simulate migration without uploading')
    args = parser.parse_args()

    try:
        migrate_images(dry_run=args.dry_run)
    except KeyboardInterrupt:
        print("\n\n❌ Migration cancelled by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Migration failed: {str(e)}")
        sys.exit(1)
