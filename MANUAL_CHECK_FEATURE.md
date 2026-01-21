# Manual Monitor Check Feature

## Overview

PulseOps now supports **both automatic and manual monitor checks**:

1. ✅ **Automatic Checks** - Cron job runs every 5 minutes (background)
2. ✅ **Manual Checks** - Users can click buttons to check monitors on-demand

## How It Works

### Automatic Monitoring (Cron)

**Frequency:** Every 5 minutes  
**Endpoint:** `/api/cron/master`  
**Authentication:** Bearer token (CRON_SECRET)

- Runs in the background via Vercel Cron
- Checks all enabled monitors based on their interval
- No user action required
- Perfect for continuous monitoring

### Manual Monitoring (On-Demand)

**Frequency:** Whenever user clicks  
**Endpoint:** `/api/monitors/check-now`  
**Authentication:** User session (NextAuth)

- Available via UI buttons
- Instant feedback
- Bypasses interval waiting
- Great for testing and verification

## User Interface

### 1. Check All Monitors Button

**Location:** `/monitors` page (top-right corner)

```
[Check All Now] [Add Monitor]
```

- Appears when you have at least 1 monitor
- Shows spinning icon while checking
- Refreshes monitor list after completion
- Checks ALL enabled monitors instantly

**Use Cases:**
- After deploying new code
- When investigating an outage
- After fixing an issue
- To get fresh data immediately

### 2. Individual Monitor Check Button

**Location:** Each monitor card (next to status badge)

```
[Monitor Name]               [🔄] [Status Badge]
```

- Small refresh icon button
- Appears on every monitor card
- Checks only that specific monitor
- Updates immediately after check

**Use Cases:**
- Verifying a specific service
- Testing after monitor creation
- Checking if an issue is resolved
- Getting real-time status

## API Endpoints

### POST /api/monitors/check-now

**Authentication:** Required (NextAuth session)

**Request Body:**

```json
// Check specific monitor
{
  "monitorId": "clx123abc"
}

// Check all monitors
{}
```

**Response (Single Monitor):**

```json
{
  "success": true,
  "monitor": {
    "id": "clx123abc",
    "name": "Production API",
    "status": "online",
    "responseTime": 245,
    "statusCode": 200,
    "errorMessage": null
  }
}
```

**Response (All Monitors):**

```json
{
  "success": true,
  "message": "Checked 5 monitor(s)",
  "results": [
    {
      "monitorId": "clx123abc",
      "name": "Production API",
      "success": true,
      "responseTime": 245,
      "statusCode": 200
    },
    {
      "monitorId": "clx456def",
      "name": "Database",
      "success": false,
      "responseTime": 5000,
      "errorMessage": "Connection timeout"
    }
  ]
}
```

## Features

### ✅ Instant Results

- No waiting for next cron cycle
- Real-time status updates
- Immediate feedback in UI

### ✅ Authenticated

- Only logged-in users can trigger checks
- Prevents unauthorized API calls
- Secure and protected

### ✅ Smart Updates

- Records metrics in database
- Updates monitor status
- Creates/resolves incidents
- Sends notifications (email/Slack)

### ✅ Full Health Checks

- Same comprehensive checks as cron
- Includes all monitor types (HTTP, TCP, DNS, Ping)
- Updates uptime statistics
- Calculates average response time

### ✅ Visual Feedback

- Spinning icon while checking
- Button disabled during check
- Automatic list refresh
- Smooth user experience

## Technical Details

### Flow Diagram

```
User clicks button
    ↓
POST /api/monitors/check-now
    ↓
Verify user authentication
    ↓
Get monitor(s) from database
    ↓
Perform health check
    ↓
Record metric
    ↓
Update monitor status
    ↓
Create/resolve incidents
    ↓
Send notifications
    ↓
Return results to UI
    ↓
UI refreshes monitor data
```

### Performance

**Single Monitor Check:**
- Duration: 1-3 seconds
- Depends on monitor timeout
- Blocks UI for that monitor only

**All Monitors Check:**
- Duration: 3-10 seconds
- Sequential checks (not parallel)
- Blocks "Check All" button only

### Rate Limiting

**Current:** No rate limiting  
**Recommended for Production:**

```typescript
// Add to check-now route.ts
const MAX_CHECKS_PER_MINUTE = 10;
const userChecks = new Map<string, number[]>();

// Check rate limit
const userId = session.user.id;
const now = Date.now();
const recentChecks = userChecks.get(userId)?.filter(
  time => now - time < 60000
) || [];

if (recentChecks.length >= MAX_CHECKS_PER_MINUTE) {
  return NextResponse.json(
    { error: "Rate limit exceeded" },
    { status: 429 }
  );
}
```

## Differences: Manual vs Automatic

| Feature | Manual Check | Automatic Check |
|---------|--------------|-----------------|
| Trigger | User button click | Cron schedule |
| Authentication | User session | CRON_SECRET |
| Frequency | On-demand | Every 5 minutes |
| Interval Respect | No (checks immediately) | Yes (respects interval) |
| UI Feedback | Yes (instant) | No (background) |
| Use Case | Testing, verification | Continuous monitoring |
| Response Time | Immediate | Next cron cycle |

## Usage Examples

### Example 1: After Creating a Monitor

```
1. User creates new monitor for "Production API"
2. User clicks individual check button (🔄)
3. Monitor is checked immediately
4. Status updates to "online" or "offline"
5. First metric is recorded
```

### Example 2: After Deploying Code

```
1. Developer deploys new code
2. Goes to /monitors page
3. Clicks "Check All Now"
4. All monitors checked at once
5. Verifies all services are still up
```

### Example 3: During an Incident

```
1. Alert received about outage
2. User investigates and fixes issue
3. Clicks individual monitor check button
4. Verifies service is back online
5. Incident auto-resolves if successful
6. Notification sent to Slack
```

## Best Practices

### For Users

1. **Don't spam checks** - Automatic monitoring is sufficient
2. **Use manual checks for**:
   - Immediate verification after changes
   - Testing new monitors
   - Confirming issue resolution
3. **Check individual monitors** when investigating specific services
4. **Check all monitors** after system-wide changes

### For Developers

1. **Add rate limiting** in production
2. **Consider adding**:
   - Check history/logs in UI
   - Cooldown period between checks
   - Visual indication of last manual check
3. **Monitor costs**:
   - Each check consumes function execution time
   - Consider limits on free tier

## Troubleshooting

### Issue: Button Not Appearing

**Cause:** No monitors created yet  
**Solution:** Create at least one monitor

### Issue: Check Takes Too Long

**Cause:** Monitor timeout set too high  
**Solution:** Reduce timeout in monitor settings (e.g., 30s → 10s)

### Issue: Check Fails But Monitor Works

**Cause:** Network latency or temporary issue  
**Solution:** Click check button again

### Issue: Unauthorized Error

**Cause:** User session expired  
**Solution:** Refresh page and log in again

## Future Enhancements

Potential improvements:

1. **Parallel Checks** - Check multiple monitors simultaneously
2. **Bulk Actions** - Select specific monitors to check
3. **Schedule Custom Checks** - One-time scheduled checks
4. **Check History** - See history of manual checks
5. **API Rate Limiting** - Prevent abuse
6. **Cooldown Indicators** - Show time since last check
7. **Progress Bar** - Visual progress for "Check All"
8. **Webhooks** - Trigger checks via API

## Summary

✅ **Automatic monitoring** runs every 5 minutes via cron (hands-free)  
✅ **Manual checks** available via UI buttons (on-demand control)  
✅ **Same comprehensive checks** for both methods  
✅ **Instant feedback** for manual checks  
✅ **Perfect balance** between automation and control

Users get the best of both worlds: reliable automatic monitoring with the flexibility to check services on-demand whenever needed! 🎉
