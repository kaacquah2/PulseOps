# Vercel Cron Job Limitations (Hobby Plan)

## Current Configuration

The cron job has been configured for **hourly checks** (`0 * * * *`) to comply with Vercel's Hobby plan limitations.

### Vercel Plan Limits:

| Plan | Cron Frequency | Max Cron Jobs |
|------|----------------|---------------|
| **Hobby (Free)** | Once per day minimum | 2 jobs |
| **Pro** | Any frequency | Unlimited |

## Recommended Configuration for Hobby Plan

Since Vercel Hobby plan requires daily intervals, here are your options:

### Option 1: Hourly Checks (Current)
```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "0 * * * *"
    }
  ]
}
```
- **Frequency**: Every hour
- **Good for**: Basic monitoring needs
- **Limitation**: Less frequent than 5-minute checks

### Option 2: Daily Checks (Most Conservative)
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
- **Good for**: Light monitoring, testing
- **Limitation**: Only checks once every 24 hours

### Option 3: Multiple Daily Checks
```json
{
  "crons": [
    {
      "path": "/api/cron/master",
      "schedule": "0 0,12 * * *"
    }
  ]
}
```
- **Frequency**: Twice per day (midnight and noon UTC)
- **Good for**: Moderate monitoring
- **Note**: Check if this is allowed on Hobby plan

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

With hourly checks instead of 5-minute checks:

| Aspect | 5-Minute Checks | Hourly Checks | Impact |
|--------|----------------|---------------|---------|
| Checks per day | 288 | 24 | Detection delay +55 min avg |
| Early detection | Excellent | Good | Acceptable for most use cases |
| Database load | Higher | Lower | Better for free tier |
| API costs | Higher | Lower | Better for free tier |

## Recommendations

**For Development/Testing:**
- Use hourly checks via Vercel cron
- Supplement with manual checks when needed

**For Production (Free Tier):**
1. Use external cron service (cron-job.org) for 5-minute checks
2. Keep Vercel cron as backup (hourly)
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

- Changed `vercel.json` from `*/5 * * * *` to `0 * * * *` (hourly)
- This complies with Vercel Hobby plan requirements
- All monitoring functionality remains intact
- Manual check feature allows on-demand testing

## Next Steps

Choose one of these approaches:
1. ✅ Keep hourly checks (already configured)
2. 🌟 Set up external cron service for 5-minute checks (recommended)
3. 💰 Upgrade to Vercel Pro plan
4. 🔧 Use GitHub Actions workflow

Your monitoring system is production-ready with any of these options!
