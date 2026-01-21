# Slack Integration - Implementation Summary

## Overview

Slack notification functionality has been successfully implemented for PulseOps. The system now sends real-time alerts to Slack channels when monitors go down or recover.

## What Was Implemented

### 1. Slack Notification Service (`lib/slack.ts`)

A comprehensive Slack notification module with three main functions:

#### `sendIncidentAlert()`
- Sends formatted alerts when monitors go down
- Includes monitor name, URL, severity, and incident details
- Features color-coded severity indicators (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
- Provides quick action buttons to view dashboard and incidents
- Uses Slack's Block Kit for rich formatting

#### `sendIncidentResolved()`
- Notifies when monitors come back online
- Shows downtime duration
- Confirms recovery with timestamp
- Includes dashboard quick link

#### `sendTestNotification()`
- Allows users to test their Slack configuration
- Accessible from the Settings page
- Verifies token and channel access

### 2. Integration with Monitoring System (`lib/monitoring/check.ts`)

Updated the health check workflow:

- **Incident Creation**: Automatically sends Slack alert when a monitor goes offline
- **Incident Resolution**: Automatically sends recovery notification when monitor comes back online
- **Error Handling**: Gracefully handles Slack API failures without affecting monitoring
- **Downtime Calculation**: Computes and formats downtime duration (e.g., "2h 15m 30s")

### 3. Settings Page Enhancement (`app/(dashboard)/settings/page.tsx`)

Added a dedicated "Slack Integration" card with:

- **Channel Configuration**: Input field for default Slack channel (e.g., `#alerts`)
- **Test Button**: Send test notifications to verify setup
- **Real-time Feedback**: Success/error messages after testing
- **Setup Instructions**: Guidance on configuring SLACK_BOT_TOKEN

### 4. Test API Endpoint (`app/api/slack/test/route.ts`)

Created a secure endpoint to test Slack integration:

- Authentication required (NextAuth session)
- Accepts custom channel parameter
- Returns detailed success/failure feedback
- Used by Settings page test functionality

### 5. Documentation Updates

Updated README.md with:

- Complete Slack setup instructions
- How to create a Slack App
- Required OAuth scopes (`chat:write`, `chat:write.public`)
- Token generation steps
- Testing procedures
- Feature highlights

## Environment Variables

Added/documented in `.env.local`:

```env
# Slack Integration (Optional - for Slack alerts)
# Get your token from https://api.slack.com/apps → Your App → OAuth & Permissions
# Default channel for alerts: #alerts (configurable in Settings page)
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

## Setup Instructions for Users

### 1. Create a Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name: "PulseOps", select your workspace

### 2. Configure Permissions

1. Navigate to "OAuth & Permissions"
2. Add Bot Token Scopes:
   - `chat:write` - Send messages
   - `chat:write.public` - Send to public channels

### 3. Install and Get Token

1. Click "Install to Workspace"
2. Copy the "Bot User OAuth Token" (starts with `xoxb-`)
3. Add to `.env.local`:
   ```env
   SLACK_BOT_TOKEN="xoxb-your-token-here"
   ```

### 4. Invite Bot to Channel

In Slack:
```
/invite @PulseOps
```

### 5. Test Integration

1. Restart your dev server: `npm run dev`
2. Go to Settings page in PulseOps
3. Enter channel name (e.g., `#alerts`)
4. Click "Send Test Notification"
5. Check Slack for the test message

## Message Format

### Incident Alert (Monitor Down)

```
🚨 Monitor Alert: [Monitor Name]

Status: ❌ Down
Severity: 🟠 HIGH
Monitor: [Monitor Name]
URL: [Monitor URL]

Details: [Error Message]
Time: [Timestamp]

[View Dashboard] [View Incidents]
```

### Recovery Notification (Monitor Up)

```
✅ Monitor Recovered: [Monitor Name]

Status: ✅ Online
Downtime: 2h 15m 30s
Monitor: [Monitor Name]
URL: [Monitor URL]

Recovered at: [Timestamp]

[View Dashboard]
```

## Features

✅ **Automatic Alerts**: Monitors trigger Slack notifications on failure
✅ **Recovery Notifications**: Get notified when services come back online
✅ **Rich Formatting**: Color-coded severity levels and formatted blocks
✅ **Quick Actions**: Dashboard links in all notifications
✅ **Graceful Degradation**: Monitoring continues even if Slack fails
✅ **Test Function**: Verify setup from Settings page
✅ **Channel Configuration**: Customize where alerts are sent
✅ **Downtime Tracking**: Shows how long monitors were down

## Architecture

```
Monitor Check Cycle (every N minutes)
    ↓
Health Check Fails
    ↓
Create Incident in Database
    ↓
Send Slack Alert (lib/slack.ts)
    ↓
Slack API (chat.postMessage)
    ↓
Message appears in channel

---

Monitor Recovers
    ↓
Resolve Incident in Database
    ↓
Calculate Downtime
    ↓
Send Recovery Notification
    ↓
Slack API (chat.postMessage)
    ↓
Recovery message in channel
```

## Error Handling

- **Missing Token**: Logs warning, continues without Slack
- **Invalid Token**: Returns error in test, logs in production
- **Network Failure**: Logs error, doesn't break monitoring
- **Invalid Channel**: Slack API returns error (shows in test)
- **Rate Limiting**: Handled by Slack SDK retry logic

## Files Created/Modified

### Created:
- `lib/slack.ts` - Slack notification service
- `app/api/slack/test/route.ts` - Test endpoint
- `SLACK_INTEGRATION.md` - This documentation

### Modified:
- `lib/monitoring/check.ts` - Added Slack notifications
- `app/(dashboard)/settings/page.tsx` - Added Slack config UI
- `README.md` - Added setup documentation
- `.env.local` - Added comments for SLACK_BOT_TOKEN

## Testing Checklist

- [x] Test notification from Settings page
- [x] Trigger incident by stopping a monitored service
- [x] Verify Slack alert appears
- [x] Restart monitored service
- [x] Verify recovery notification appears
- [x] Check downtime duration is accurate
- [x] Test with invalid token (graceful failure)
- [x] Test with invalid channel (error message)

## Future Enhancements

Potential improvements for future versions:

1. **Per-Monitor Channels**: Allow different channels per monitor
2. **Severity Filtering**: Only alert on certain severity levels
3. **Alert Throttling**: Prevent notification spam
4. **Thread Replies**: Group related alerts in threads
5. **Interactive Actions**: Acknowledge/resolve from Slack
6. **Custom Templates**: User-defined message formats
7. **Multiple Workspaces**: Support multiple Slack teams
8. **Alert Scheduling**: Quiet hours configuration

## Support

For issues or questions:

1. Check SLACK_BOT_TOKEN is correctly set
2. Verify bot is invited to target channel
3. Test using Settings page test button
4. Check application logs for Slack API errors
5. Verify OAuth scopes are correct

## Related Documentation

- [Slack API Documentation](https://api.slack.com/docs)
- [Block Kit Builder](https://api.slack.com/block-kit) - Design custom messages
- [OAuth Scopes](https://api.slack.com/scopes) - Permission reference
