# Cron Job Consolidation - Summary

## What Changed?

Your cron jobs have been consolidated into a single **master cron endpoint** to fit within Vercel's free plan limit (2 cron jobs maximum).

## Before vs After

### Before ❌
```json
{
  "crons": [
    {
      "path": "/api/cron/check-monitors",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

- Only handled monitor checks
- Would require separate cron jobs for cleanup tasks
- Limited scalability on free plan

### After ✅
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

- Handles ALL periodic tasks in one job
- Monitor health checks
- Database cleanup (30-day retention)
- Auto-close resolved incidents (after 7 days)
- Room for future tasks without adding more cron jobs

## What Tasks Are Included?

### 1. Monitor Health Checks ⏱️
**Runs:** Every 5 minutes (respects individual monitor intervals)

- Checks all enabled monitors
- Records metrics (response time, status code)
- Updates monitor status
- Creates/resolves incidents
- Sends email and Slack notifications

### 2. Database Cleanup 🧹
**Runs:** Every execution (with date filtering)

- Deletes metrics older than 30 days
- Keeps database size manageable
- Improves query performance
- Prevents storage bloat

### 3. Incident Auto-Close 📝
**Runs:** Every execution (with date filtering)

- Auto-closes resolved incidents after 7 days
- Keeps incident list clean
- Status: `resolved` → `closed`
- Maintains historical data

## Files Created/Modified

### New Files ✨
- `app/api/cron/master/route.ts` - Unified cron endpoint
- `CRON_CONFIGURATION.md` - Detailed documentation
- `CRON_MIGRATION_SUMMARY.md` - This file

### Modified Files 📝
- `vercel.json` - Updated to use master endpoint
- `README.md` - Updated automated monitoring section
- `app/api/cron/check-monitors/route.ts` - Marked as deprecated

### No Changes Required 🎯
- Old endpoint still works for backward compatibility
- No database changes needed
- No environment variable changes needed
- Existing monitors continue working

## Testing

### Test Locally

```powershell
# Test the new master cron endpoint
curl -X GET `
  -H "Authorization: Bearer YOUR_CRON_SECRET" `
  http://localhost:3000/api/cron/master
```

### Expected Response

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
    "monitorResults": [...]
  }
}
```

## Deployment Steps

### Option 1: Automatic (Vercel) ✅ RECOMMENDED

1. **Commit Changes:**
   ```bash
   git add .
   git commit -m "Consolidate cron jobs into master endpoint"
   git push
   ```

2. **Deploy:**
   - Vercel auto-deploys on push
   - Cron is automatically configured from `vercel.json`
   - No manual setup required

3. **Verify:**
   - Check Vercel Dashboard → Your Project → Cron
   - Should see: `/api/cron/master` scheduled for `*/5 * * * *`

### Option 2: Manual (External Cron Service)

1. **Update Your Cron Service:**
   - Change URL from `/api/cron/check-monitors` to `/api/cron/master`
   - Keep schedule: `*/5 * * * *`
   - Keep authorization: `Bearer YOUR_CRON_SECRET`

2. **Example Configuration:**
   ```
   URL: https://your-domain.com/api/cron/master
   Method: GET
   Schedule: */5 * * * *
   Headers: Authorization: Bearer YOUR_CRON_SECRET
   ```

## Verification Checklist

After deployment, verify everything works:

- [ ] Cron appears in Vercel Dashboard
- [ ] Monitors are being checked (check logs)
- [ ] Metrics are being recorded (check database)
- [ ] Incidents are created for failures
- [ ] Notifications are sent (email/Slack)
- [ ] Old metrics are cleaned up
- [ ] Resolved incidents are auto-closed

## Monitoring

### Check Cron Execution

**Vercel Dashboard:**
1. Go to your project
2. Click "Logs" tab
3. Filter by `/api/cron/master`
4. Check execution frequency and results

**Database Check:**
```sql
-- Check if monitors are being checked
SELECT 
  name,
  lastChecked,
  status
FROM Monitor
WHERE enabled = true
ORDER BY lastChecked DESC;

-- Check recent metrics
SELECT 
  COUNT(*) as total_checks_today
FROM Metric
WHERE timestamp > NOW() - INTERVAL '24 HOURS';
```

## Benefits

✅ **Fits Vercel Free Plan:** Uses only 1 of 2 available cron jobs  
✅ **Centralized Management:** All periodic tasks in one place  
✅ **Better Logging:** Single endpoint for monitoring  
✅ **Cost Efficient:** Fewer cold starts, less execution time  
✅ **Scalable:** Easy to add more tasks without adding cron jobs  
✅ **Backward Compatible:** Old endpoint still works  

## Customization

### Change Schedule

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
- Every 5 minutes: `*/5 * * * *` (current)
- Every 15 minutes: `*/15 * * * *`
- Every hour: `0 * * * *`

### Adjust Retention Periods

Edit `app/api/cron/master/route.ts`:

**Metrics Retention (currently 30 days):**
```typescript
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
// Change to 90 days:
const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
```

**Incident Auto-Close (currently 7 days):**
```typescript
const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
// Change to 30 days:
const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
```

## Troubleshooting

### Issue: Cron Not Running

**Solution:**
1. Check Vercel Dashboard → Cron tab
2. Verify `CRON_SECRET` is set in environment variables
3. Check Vercel logs for errors
4. Redeploy: `vercel --prod`

### Issue: Old Endpoint Still Being Called

**Solution:**
- Check your cron service configuration
- Update URL to `/api/cron/master`
- Old endpoint is deprecated but still functional

### Issue: High Execution Time

**Causes:**
- Too many monitors
- Slow external services
- Database queries

**Solutions:**
1. Reduce number of monitors
2. Increase monitor intervals
3. Upgrade Vercel plan for better performance

## FAQ

**Q: Will my existing monitors stop working?**  
A: No! All monitors continue working exactly as before.

**Q: Do I need to change environment variables?**  
A: No, all environment variables remain the same.

**Q: What happens to the old `/api/cron/check-monitors` endpoint?**  
A: It's still available for backward compatibility but deprecated.

**Q: Can I add more tasks to the master cron?**  
A: Yes! Edit `app/api/cron/master/route.ts` to add new tasks.

**Q: How much does this cost on Vercel?**  
A: Free! It uses 1 of 2 available cron jobs on the free plan.

**Q: What if I need more than 2 cron jobs?**  
A: Upgrade to Vercel Pro (10 cron jobs) or use external cron services.

**Q: Can I disable specific tasks?**  
A: Yes! Comment out tasks in `app/api/cron/master/route.ts`.

**Q: How do I test it locally?**  
A: Use curl with your CRON_SECRET to call the endpoint.

## Next Steps

1. ✅ Changes are complete and ready to deploy
2. 🚀 Push to Git and deploy to Vercel
3. ✅ Verify cron is running in Vercel Dashboard
4. 📊 Monitor execution in Vercel Logs
5. 🎉 Enjoy automated monitoring with a single cron job!

## Support

For detailed configuration options, see:
- `CRON_CONFIGURATION.md` - Complete configuration guide
- `README.md` - Updated automated monitoring section
- Vercel Docs: [Cron Jobs](https://vercel.com/docs/cron-jobs)

---

**Summary:** Your cron jobs are now consolidated into a single, efficient master endpoint that handles all periodic tasks. This fits perfectly within Vercel's free plan and provides room for future expansion! 🎉
