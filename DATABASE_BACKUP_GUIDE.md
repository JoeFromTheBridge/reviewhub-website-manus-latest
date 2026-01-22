# Database Backup Configuration Guide

## Overview

This guide explains how to configure and maintain automated database backups for the ReviewHub PostgreSQL database hosted on Render.

## Render PostgreSQL Automatic Backups

### Current Database

- **Database**: reviewhub
- **Provider**: Render PostgreSQL
- **Region**: Ohio (dpg-d2vckqnfte5s73bvoje0-a)

### Configuring Automated Backups

Render provides automated backups for paid PostgreSQL plans:

1. **Navigate to Database Dashboard**
   - Go to https://dashboard.render.com
   - Select your PostgreSQL database (reviewhub)

2. **Enable Automated Backups**
   - Click on the "Backups" tab
   - Automated daily backups are included with paid plans
   - Render automatically retains:
     * Daily backups: 7 days
     * Weekly backups: 4 weeks
     * Monthly backups: 3 months

3. **Backup Schedule**
   - Backups run automatically during low-traffic hours
   - No action required once enabled
   - Backups are stored in Render's secure S3-compatible storage

### Manual Backups

For critical deployments or before major migrations:

1. **Create Manual Backup**
   ```bash
   # Using Render dashboard
   Navigate to: Database → Backups → "Create Backup"
   ```

2. **Using pg_dump (Alternative)**
   ```bash
   # Export DATABASE_URL from your .env file
   source reviewhub-backend/.env

   # Create backup
   pg_dump $DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

3. **Backup before migrations**
   ```bash
   # Always backup before running Alembic migrations
   pg_dump $DATABASE_URL > pre_migration_backup.sql
   flask db upgrade
   ```

### Restore from Backup

#### Option 1: Render Dashboard

1. Go to Database → Backups
2. Select the backup to restore
3. Click "Restore" (This will restore to current database)
4. **WARNING**: This will overwrite current data!

#### Option 2: Manual Restore

```bash
# Restore from a pg_dump file
psql $DATABASE_URL < backup_file.sql

# Or create a new database first
psql $DATABASE_URL -c "DROP DATABASE IF EXISTS reviewhub_restored"
psql $DATABASE_URL -c "CREATE DATABASE reviewhub_restored"
psql -d reviewhub_restored -f backup_file.sql
```

## Backup Best Practices

### 1. Regular Testing

Test your restore process monthly:

```bash
# 1. Download latest backup
# 2. Restore to local PostgreSQL
createdb reviewhub_test
psql reviewhub_test < latest_backup.sql

# 3. Verify data integrity
psql reviewhub_test -c "SELECT COUNT(*) FROM users;"
psql reviewhub_test -c "SELECT COUNT(*) FROM reviews;"
psql reviewhub_test -c "SELECT COUNT(*) FROM products;"

# 4. Clean up
dropdb reviewhub_test
```

### 2. Pre-Deployment Backups

Always backup before:
- Database migrations
- Major feature deployments
- Schema changes
- Data cleanup operations

### 3. Off-Site Backup Copy (Optional)

For extra security, store periodic backups off Render:

```bash
# Monthly backup script
#!/bin/bash
BACKUP_FILE="reviewhub_backup_$(date +%Y%m%d).sql"
pg_dump $DATABASE_URL > $BACKUP_FILE

# Upload to your own S3 bucket (optional)
aws s3 cp $BACKUP_FILE s3://your-backup-bucket/reviewhub/$BACKUP_FILE

# Or compress and store locally
gzip $BACKUP_FILE
```

### 4. Monitor Backup Status

- Check Render dashboard weekly
- Verify backup timestamps
- Set up alerts for backup failures (Render Pro plans)

## Disaster Recovery Plan

### Scenario 1: Accidental Data Deletion

1. Identify the time before deletion occurred
2. Find the most recent backup before that time
3. Restore to a new database
4. Extract only the deleted data
5. Re-insert into production database

### Scenario 2: Database Corruption

1. Stop the application immediately (prevent further writes)
2. Create a snapshot of current state (even if corrupted)
3. Restore from the latest good backup
4. Verify data integrity
5. Resume application

### Scenario 3: Complete Database Loss

1. Provision a new PostgreSQL database on Render
2. Restore from the latest backup
3. Update DATABASE_URL in application
4. Run migrations to ensure schema is current
5. Verify all tables and data

## Backup Checklist

- [ ] Automated daily backups enabled in Render
- [ ] Tested restore process at least once
- [ ] Pre-migration backup script in place
- [ ] Documented DATABASE_URL in secure location
- [ ] Backup retention policy reviewed (7 days/4 weeks/3 months)
- [ ] Team knows how to access backups
- [ ] Disaster recovery plan documented and tested

## Security Notes

1. **Never commit DATABASE_URL to git** - Use .env files (excluded from git)
2. **Backup files contain sensitive data** - Encrypt before storing locally
3. **Limit access to backups** - Only authorized team members
4. **Use read-only database replicas** - For analytics/reporting (reduces load on primary)

## Cost Considerations

- Free Render PostgreSQL plan: **No automated backups**
- Starter plan ($7/month): 7 days of daily backups
- Standard plan ($20/month): Extended retention (4 weeks + 3 months)
- Manual backups using pg_dump: Free (requires local storage)

## Monitoring & Alerts

### Recommended Monitoring

1. **Backup Success Rate**
   - Check Render dashboard weekly
   - Ensure backups are completing successfully

2. **Database Size Growth**
   - Monitor disk usage
   - Plan for storage limits

3. **Query Performance**
   - Use Render's built-in monitoring
   - Identify slow queries before they cause issues

## Troubleshooting

### Backup Failed

1. Check Render status page
2. Verify database is accessible
3. Check disk space
4. Contact Render support

### Restore Failed

1. Verify backup file integrity
2. Check PostgreSQL version compatibility
3. Ensure target database has enough space
4. Review error logs

### Connection Issues

```bash
# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# If connection fails, check:
# - DATABASE_URL is correct
# - Database is running (Render dashboard)
# - Network/firewall issues
```

## Additional Resources

- [Render PostgreSQL Documentation](https://render.com/docs/databases)
- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [pg_dump Manual](https://www.postgresql.org/docs/current/app-pgdump.html)
- [Alembic Migrations Guide](https://alembic.sqlalchemy.org/en/latest/)

## Emergency Contacts

- **Render Support**: support@render.com
- **Database Admin**: [Your contact info]
- **On-Call Engineer**: [Your contact info]

---

**Last Updated**: 2026-01-21
**Next Review**: 2026-04-21 (Quarterly)
