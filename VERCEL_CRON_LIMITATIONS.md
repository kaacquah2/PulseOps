# Vercel Cron Job Limitations (Hobby Plan)

## Current Configuration

The cron job has been configured for **daily checks** (`0 0 * * *`) to comply with Vercel's Hobby plan limitations.

### Vercel Plan Limits:

| Plan | Cron Frequency | Max Cron Jobs |
|------|----------------|---------------|
| **Hobby (Free)** | Once per day minimum | 2 jobs |
| **Pro** | Any frequency | Unlimited |

## Recommended Configuration for Hobby Plan

Since Vercel Hobby plan requires daily intervals, here are your options:

### Option 1: Daily Checks (Current - Hobby Plan Requirement)
```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "0 0 * * *"
    }
  ]
}
```
- **Frequency**: Once per day at midnight UTC
- **Good for**: Light monitoring, testing, backup for external cron
- **Limitation**: Only checks once every 24 hours
- **Status**: ✅ This is what's currently configured

## Alternative Solutions

### 1. Use External Cron Service (Recommended for Free Tier)

Use a free external service to call your endpoint more frequently:

**Option A: Cron-Job.org** (Free)
1. Sign up at https://cron-job.org
2. Create a job to call: `https://your-domain.vercel.app/api/cron/master`
3. Add header: `Authorization: Bearer YOUR_CRON_SECRET`
4. Set schedule: Every 5 minutes or as needed
5. Free tier includes unlimited jobs

**Option B: EasyCron** (Free tier available)
1. Sign up at https://www.easycron.com
2. Configure HTTP request to your endpoint
3. Free tier: Up to 100 executions/day

**Option C: UptimeRobot** (Free)
1. Sign up at https://uptimerobot.com
2. Create a monitor for your cron endpoint
3. Set check interval: 5 minutes
4. Free tier: 50 monitors

### 2. Use GitHub Actions (Free)

Create `.github/workflows/cron.yml`:

```yaml
name: PulseOps Cron
on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes
  workflow_dispatch:  # Allow manual trigger

jobs:
  trigger-cron:
    runs-on: ubuntu-latest
    steps:
      - name: Call Cron Endpoint
        run: |
          curl -X GET "https://your-domain.vercel.app/api/cron/master" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to GitHub repository secrets.

**Advantages:**
- Completely free
- Reliable
- 5-minute intervals possible
- Easy to configure

### 3. Manual Checks Feature (Already Implemented)

Users can manually trigger checks anytime:
- From the Monitors page: "Check All Now" button
- Individual monitor checks: Refresh icon on each monitor card

This works great with less frequent automated checks.

### 4. Upgrade to Vercel Pro

**Cost**: $20/month
**Benefits**:
- Unlimited cron frequency (5-minute checks)
- More function execution time
- Better performance
- Commercial use allowed

## Current Setup Impact

With daily checks instead of 5-minute checks:

| Aspect | 5-Minute Checks | Daily Checks | Impact |
|--------|----------------|---------------|---------|
| Checks per day | 288 | 1 | Detection delay up to 24 hours |
| Early detection | Excellent | Poor | **External cron required** |
| Database load | Higher | Minimal | Great for free tier |
| API costs | Higher | Minimal | Great for free tier |

**⚠️ Important**: Daily checks are NOT suitable for production monitoring. You MUST use an external cron service for real-time monitoring.

## Recommendations

**For Development/Testing:**
- Use daily checks via Vercel cron (current config)
- Supplement with manual checks when needed
- Consider external cron for more frequent testing

**For Production (Free Tier):**
1. **REQUIRED**: Use external cron service (cron-job.org) for 5-minute checks
2. Keep Vercel cron as backup (daily - already configured)
3. Enable manual check feature for on-demand testing

**For Production (Paid):**
- Upgrade to Vercel Pro for full 5-minute monitoring

## Implementation Steps

### Using External Cron Service (Recommended):

1. **Keep current Vercel cron** as fallback (hourly or daily)

2. **Sign up for Cron-Job.org**:
   - URL: `https://your-domain.vercel.app/api/cron/master`
   - Interval: Every 5 minutes
   - Headers: Add `Authorization: Bearer YOUR_CRON_SECRET`

3. **Test the setup**:
   ```bash
   # Test your endpoint manually
   curl -X GET "https://your-domain.vercel.app/api/cron/master" \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

4. **Monitor both systems**:
   - Check logs to ensure external cron is working
   - Vercel cron acts as backup if external service fails

## Configuration Changes Made

- Changed `vercel.json` from `*/5 * * * *` to `0 0 * * *` (daily at midnight UTC)
- This complies with Vercel Hobby plan **strict requirement** of max once-per-day
- All monitoring functionality remains intact
- **You MUST set up external cron for production use**
- Manual check feature allows on-demand testing

## Next Steps

**For Production Deployment, you MUST do ONE of these:**

1. 🌟 **Set up external cron service** (REQUIRED for Hobby plan - see instructions above)
   - Vercel cron runs daily as fallback only
   - External service provides real 5-minute monitoring
   
2. 💰 **Upgrade to Vercel Pro** ($20/month)
   - Unlock any cron frequency
   - Update vercel.json back to `*/5 * * * *`
   
3. 🔧 **Use GitHub Actions** (Free alternative)
   - See workflow example above
   - Same reliability as external cron

**Current Status:**
- ✅ Vercel config: Daily cron (compliant with Hobby plan)
- ⚠️ NOT suitable for production without external cron
- ✅ Manual checks available for testing
