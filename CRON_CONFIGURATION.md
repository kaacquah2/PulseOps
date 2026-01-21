# Cron Job Configuration

## Overview

PulseOps uses a **unified master cron job** to handle all periodic tasks. This approach:
- ✅ Fits within Vercel's free plan limit (2 cron jobs max)
- ✅ Simplifies deployment and management
- ✅ Reduces cold starts and execution costs
- ✅ Provides centralized logging and monitoring

## Master Cron Endpoint

**Endpoint:** `/api/cron/master`  
**Schedule:** Every 5 minutes (`*/5 * * * *`)  
**Authentication:** Bearer token using `CRON_SECRET`

### Tasks Performed

The master cron job executes three types of tasks:

#### 1. Monitor Health Checks ⏱️

**Frequency:** Every 5 minutes (respects individual monitor intervals)

- Checks all enabled monitors
- Performs health checks based on monitor type (HTTP, TCP, DNS, Ping)
- Records metrics (response time, status code, success/failure)
- Updates monitor status (online, offline, degraded)
- Creates incidents for failures
- Resolves incidents for recoveries
- Sends email and Slack notifications

#### 2. Database Cleanup 🧹

**Frequency:** Every run (automatic date-based filtering)

- Deletes metrics older than 30 days
- Keeps database size manageable
- Maintains query performance
- Prevents storage bloat

**Configuration:**
- Retention period: 30 days (hardcoded)
- To change: Edit `thirtyDaysAgo` calculation in `app/api/cron/master/route.ts`

#### 3. Incident Auto-Close 📝

**Frequency:** Every run (automatic date-based filtering)

- Auto-closes resolved incidents after 7 days
- Keeps incident list clean
- Maintains historical data
- Status transition: `resolved` → `closed`

**Configuration:**
- Auto-close period: 7 days (hardcoded)
- To change: Edit `sevenDaysAgo` calculation in `app/api/cron/master/route.ts`

## Deployment Options

### Option 1: Vercel Cron (Recommended)

**File:** `vercel.json`

```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

**Setup:**
1. Deploy to Vercel
2. Cron automatically configured
3. No additional setup needed

**Limits:**
- Free plan: Up to 2 cron jobs
- Pro plan: Up to 10 cron jobs
- Current usage: 1 cron job ✅

### Option 2: External Cron Service

Use services like:
- [cron-job.org](https://cron-job.org) (Free)
- [EasyCron](https://www.easycron.com) (Free tier available)
- [Uptime Robot](https://uptimerobot.com) (Free tier available)

**Setup:**

1. **Create HTTP Request:**
   - Method: `GET`
   - URL: `https://your-domain.com/api/cron/master`
   - Headers: `Authorization: Bearer YOUR_CRON_SECRET`

2. **Schedule:**
   - Interval: Every 5 minutes
   - Expression: `*/5 * * * *`

3. **Security:**
   - Ensure `CRON_SECRET` is strong and secret
   - Enable HTTPS only
   - Monitor for unauthorized access

### Option 3: GitHub Actions

**File:** `.github/workflows/cron.yml`

```yaml
name: Cron Jobs

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  run-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Master Cron
        run: |
          curl -X GET \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}" \
            https://your-domain.com/api/cron/master
```

**Setup:**
1. Add `CRON_SECRET` to GitHub Secrets
2. Commit workflow file
3. Enable Actions in repository settings

## Response Format

### Success Response

```json
{
  "success": true,
  "timestamp": "2026-01-21T12:00:00.000Z",
  "tasks": {
    "monitorsChecked": 5,
    "metricsDeleted": 1250,
    "incidentsClosed": 3
  },
  "executionTime": "2450ms",
  "details": {
    "monitorResults": [
      {
        "monitorId": "abc123",
        "name": "Production API",
        "success": true,
        "responseTime": 245
      }
    ]
  }
}
```

### Error Response

```json
{
  "error": "Failed to execute cron tasks",
  "message": "Database connection failed"
}
```

## Testing

### Manual Testing

Test the cron job manually:

```bash
# Using curl (PowerShell)
curl -X GET `
  -H "Authorization: Bearer YOUR_CRON_SECRET" `
  https://pulse-ops-blue.vercel.app/api/cron/master

# Using curl (bash/Linux/Mac)
curl -X GET \
  -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://pulse-ops-blue.vercel.app/api/cron/master
```

### Expected Output

```json
{
  "success": true,
  "timestamp": "...",
  "tasks": {
    "monitorsChecked": 3,
    "metricsDeleted": 0,
    "incidentsClosed": 0
  },
  "executionTime": "1234ms",
  "details": { ... }
}
```

## Monitoring

### Vercel Logs

1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Filter by `/api/cron/master`

### Check Cron Execution

```sql
-- Check recent metrics (confirms monitors are running)
SELECT 
  m.name,
  COUNT(*) as checks_today,
  AVG(mt.responseTime) as avg_response_time
FROM Monitor m
JOIN Metric mt ON m.id = mt.monitorId
WHERE mt.timestamp > NOW() - INTERVAL '24 HOURS'
GROUP BY m.id, m.name;

-- Check incidents created today
SELECT 
  title,
  severity,
  status,
  startedAt
FROM Incident
WHERE startedAt > NOW() - INTERVAL '24 HOURS'
ORDER BY startedAt DESC;
```

## Troubleshooting

### Issue: Cron Not Running

**Check:**
1. Verify `vercel.json` is deployed
2. Check Vercel dashboard for cron status
3. Ensure `CRON_SECRET` is set in environment variables
4. Check Vercel logs for errors

**Solution:**
```bash
# Redeploy with cron configuration
vercel --prod
```

### Issue: Authentication Failed

**Error:** `401 Unauthorized`

**Cause:** Invalid or missing `CRON_SECRET`

**Solution:**
1. Check `CRON_SECRET` in Vercel environment variables
2. Ensure it matches `.env.local`
3. Redeploy after changes

### Issue: Monitors Not Being Checked

**Possible Causes:**
1. Monitors are disabled
2. Monitor interval hasn't elapsed
3. Database connection issues

**Debug:**
```typescript
// Check monitor last checked time
const monitor = await prisma.monitor.findUnique({
  where: { id: 'monitor-id' }
});
console.log('Last checked:', monitor.lastChecked);
console.log('Interval:', monitor.interval);
```

### Issue: High Execution Time

**Threshold:** > 5 seconds

**Causes:**
- Too many monitors
- Slow external services
- Database queries

**Solutions:**
1. Reduce number of monitors
2. Increase monitor intervals
3. Optimize database queries
4. Consider upgrading Vercel plan for better performance

## Customization

### Change Check Frequency

Edit `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "*/1 * * * *"  // Every 1 minute
    }
  ]
}
```

**Common Schedules:**
- Every 1 minute: `*/1 * * * *`
- Every 5 minutes: `*/5 * * * *` (default)
- Every 15 minutes: `*/15 * * * *`
- Every hour: `0 * * * *`
- Every day at midnight: `0 0 * * *`

### Adjust Cleanup Retention

Edit `app/api/cron/master/route.ts`:

```typescript
// Change metrics retention from 30 to 90 days
const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

const deletedMetrics = await prisma.metric.deleteMany({
  where: {
    timestamp: {
      lt: ninetyDaysAgo,
    },
  },
});
```

### Disable Specific Tasks

Comment out tasks you don't need:

```typescript
// ============================================================================
// TASK 2: Database Cleanup (Optional - runs daily)
// ============================================================================
// Comment out to disable cleanup
/*
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
const deletedMetrics = await prisma.metric.deleteMany({
  where: { timestamp: { lt: thirtyDaysAgo } },
});
*/
```

## Best Practices

1. **Monitor Execution Time**: Keep under 10 seconds on Vercel
2. **Log Important Events**: Use console.log for debugging
3. **Handle Errors Gracefully**: Don't let one task failure stop others
4. **Secure Your Endpoint**: Always use strong `CRON_SECRET`
5. **Test Locally First**: Use curl to test before deploying
6. **Monitor Costs**: Watch Vercel function execution time
7. **Set Alerts**: Use monitoring tools to track cron failures

## Migration from Old Cron

If you were using `/api/cron/check-monitors`:

**Old Configuration:**
```json
{
  "crons": [
    { "path": "/api/cron/check-monitors", "schedule": "*/5 * * * *" }
  ]
}
```

**New Configuration:**
```json
{
  "crons": [
    { "path": "/api/cron/master", "schedule": "*/5 * * * *" }
  ]
}
```

**Changes:**
- ✅ All functionality preserved
- ✅ Added database cleanup
- ✅ Added incident auto-close
- ✅ Better logging and response format
- ✅ Same execution frequency

**Note:** The old endpoint still exists for backward compatibility but is no longer called by Vercel cron.

## Performance Metrics

Typical execution times (5 monitors):
- Monitor checks: ~1-3 seconds
- Database cleanup: ~100-500ms
- Incident cleanup: ~50-200ms
- **Total:** ~2-4 seconds

Vercel free tier limits:
- Function timeout: 10 seconds ✅
- Function invocations: 100,000/month ✅
- With 5-minute intervals: ~8,640 invocations/month ✅

## Support

For issues or questions:
1. Check Vercel logs
2. Test endpoint manually with curl
3. Verify environment variables
4. Check database connectivity
5. Review monitor configurations
