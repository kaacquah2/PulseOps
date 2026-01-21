# Database Migration Instructions

## Important: Apply Database Indexes

The optimization includes new composite indexes in the Prisma schema that need to be applied to your database.

## Option 1: Using Prisma Migrate (Recommended for Production)

This creates a migration file that can be version-controlled and applied to other environments:

```bash
# Create migration
npx prisma migrate dev --name add_performance_indexes

# This will:
# 1. Generate a new migration file in prisma/migrations/
# 2. Apply the migration to your database
# 3. Regenerate the Prisma Client
```

## Option 2: Direct Push (Development Only)

For quick development testing, you can push directly without creating a migration file:

```bash
# Push schema changes directly to database
npx prisma db push

# Note: This doesn't create migration history
```

## Verify Migration

After applying the migration, verify the indexes were created:

```bash
# Open Prisma Studio to inspect the database
npx prisma studio
```

Or connect to your PostgreSQL database and run:

```sql
-- Check indexes on Monitor table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Monitor';

-- Check indexes on Incident table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Incident';

-- Check indexes on Metric table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Metric';

-- Check indexes on Session table
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Session';
```

## Expected New Indexes

You should see these new composite indexes:

### Monitor Table
- `Monitor_userId_status_idx`
- `Monitor_userId_enabled_idx`
- `Monitor_enabled_interval_lastChecked_idx`

### Incident Table
- `Incident_monitorId_status_idx`
- `Incident_status_resolvedAt_idx`

### Metric Table
- `Metric_monitorId_timestamp_idx` (updated with DESC)
- `Metric_timestamp_idx`

### Session Table
- `Session_userId_idx`

## Production Deployment

When deploying to production:

1. **Backup your database first**
   ```bash
   # Example for Neon
   # Create a branch/backup before migration
   ```

2. **Apply migration in production**
   ```bash
   # In production environment
   npx prisma migrate deploy
   ```

3. **Verify no downtime**
   - Index creation happens in the background in PostgreSQL
   - Should not cause significant downtime
   - Monitor application performance during migration

## Rollback (If Needed)

If you need to rollback the indexes:

```sql
-- Drop composite indexes
DROP INDEX IF EXISTS "Monitor_userId_status_idx";
DROP INDEX IF EXISTS "Monitor_userId_enabled_idx";
DROP INDEX IF EXISTS "Monitor_enabled_interval_lastChecked_idx";
DROP INDEX IF EXISTS "Incident_monitorId_status_idx";
DROP INDEX IF EXISTS "Incident_status_resolvedAt_idx";
DROP INDEX IF EXISTS "Metric_timestamp_idx";
DROP INDEX IF EXISTS "Session_userId_idx";

-- Note: The original indexes will remain
```

## Troubleshooting

### Migration Fails
If migration fails due to existing data:
1. Check for any constraint violations
2. Verify database connection
3. Try `npx prisma migrate reset` (WARNING: This will delete all data)

### Slow Migration
Index creation on large tables can take time:
- Monitor table: ~1-5 seconds per 100k records
- Metric table: ~5-10 seconds per 1M records
- Application should remain available during index creation

### Verify Performance Improvement
After migration, test query performance:

```sql
-- Test dashboard query (should use Monitor_userId_status_idx)
EXPLAIN ANALYZE 
SELECT * FROM "Monitor" 
WHERE "userId" = 'your-user-id' AND "status" = 'online';

-- Test cron query (should use Monitor_enabled_interval_lastChecked_idx)
EXPLAIN ANALYZE 
SELECT * FROM "Monitor" 
WHERE "enabled" = true;

-- Test incident query (should use Incident_monitorId_status_idx)
EXPLAIN ANALYZE 
SELECT * FROM "Incident" 
WHERE "monitorId" = 'your-monitor-id' AND "status" = 'open';
```

You should see "Index Scan" instead of "Seq Scan" in the query plans.

## After Migration

1. **Test the application thoroughly**
   - Dashboard loading
   - Monitor creation and listing
   - Incident management
   - Manual monitor checks

2. **Monitor performance metrics**
   - Check response times in browser DevTools
   - Monitor database query performance
   - Verify no errors in application logs

3. **Clean up old metrics (optional)**
   ```sql
   -- Delete metrics older than 30 days to improve performance
   DELETE FROM "Metric" 
   WHERE "timestamp" < NOW() - INTERVAL '30 days';
   ```

## Questions or Issues?

If you encounter any issues during migration:
1. Check Prisma logs: `npx prisma migrate status`
2. Verify database connection string
3. Ensure PostgreSQL version is 12+
4. Check database permissions for index creation

---

**Note**: These indexes are critical for the performance optimizations to take effect. The application will still work without them, but performance gains will be minimal.
