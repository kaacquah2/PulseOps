interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
    emoji?: boolean;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  accessory?: Record<string, unknown>;
  elements?: Array<{
    type: string;
    text?: {
      type: string;
      text: string;
      emoji?: boolean;
    };
    url?: string;
    style?: string;
  }>;
}

interface SlackMessage {
  channel?: string;
  text: string;
  blocks?: SlackBlock[];
}

const SLACK_API_URL = "https://slack.com/api/chat.postMessage";

async function sendSlackMessage(message: SlackMessage): Promise<boolean> {
  if (!process.env.SLACK_BOT_TOKEN) {
    console.warn("Slack bot token not configured. Slack messages will not be sent.");
    return false;
  }

  try {
    const response = await fetch(SLACK_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
      },
      body: JSON.stringify({
        channel: message.channel || "#alerts", // Default to #alerts channel
        text: message.text,
        blocks: message.blocks,
      }),
    });

    const data = await response.json();

    if (!data.ok) {
      console.error("Slack API error:", data.error);
      return false;
    }

    console.log("Slack message sent successfully");
    return true;
  } catch (error) {
    console.error("Error sending Slack message:", error);
    return false;
  }
}

export async function sendIncidentAlert(
  monitorName: string,
  monitorUrl: string,
  incidentDetails: string,
  severity: string,
  channel?: string
) {
  const severityEmoji = {
    critical: "🔴",
    high: "🟠",
    medium: "🟡",
    low: "🟢",
  }[severity] || "⚠️";

  const message: SlackMessage = {
    channel,
    text: `${severityEmoji} Monitor Alert: ${monitorName} is down`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `🚨 Monitor Alert: ${monitorName}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Status:*\n❌ Down`,
          },
          {
            type: "mrkdwn",
            text: `*Severity:*\n${severityEmoji} ${severity.toUpperCase()}`,
          },
          {
            type: "mrkdwn",
            text: `*Monitor:*\n${monitorName}`,
          },
          {
            type: "mrkdwn",
            text: `*URL:*\n<${monitorUrl}|${monitorUrl}>`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Details:*\n${incidentDetails}`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Time:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Dashboard",
              emoji: true,
            },
            url: `${process.env.NEXTAUTH_URL}/dashboard`,
            style: "primary",
          },
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Incidents",
              emoji: true,
            },
            url: `${process.env.NEXTAUTH_URL}/incidents`,
          },
        ],
      },
    ],
  };

  return await sendSlackMessage(message);
}

export async function sendIncidentResolved(
  monitorName: string,
  monitorUrl: string,
  downtimeDuration: string,
  channel?: string
) {
  const message: SlackMessage = {
    channel,
    text: `✅ Monitor Recovered: ${monitorName} is back online`,
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: `✅ Monitor Recovered: ${monitorName}`,
          emoji: true,
        },
      },
      {
        type: "section",
        fields: [
          {
            type: "mrkdwn",
            text: `*Status:*\n✅ Online`,
          },
          {
            type: "mrkdwn",
            text: `*Downtime:*\n${downtimeDuration}`,
          },
          {
            type: "mrkdwn",
            text: `*Monitor:*\n${monitorName}`,
          },
          {
            type: "mrkdwn",
            text: `*URL:*\n<${monitorUrl}|${monitorUrl}>`,
          },
        ],
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Recovered at:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
        },
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: {
              type: "plain_text",
              text: "View Dashboard",
              emoji: true,
            },
            url: `${process.env.NEXTAUTH_URL}/dashboard`,
            style: "primary",
          },
        ],
      },
    ],
  };

  return await sendSlackMessage(message);
}

export async function sendTestNotification(channel?: string) {
  const message: SlackMessage = {
    channel,
    text: "✨ PulseOps Test Notification",
    blocks: [
      {
        type: "header",
        text: {
          type: "plain_text",
          text: "✨ PulseOps Test Notification",
          emoji: true,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "This is a test notification from PulseOps. Your Slack integration is working correctly! 🎉",
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `*Sent at:*\n<!date^${Math.floor(Date.now() / 1000)}^{date_num} {time_secs}|${new Date().toISOString()}>`,
        },
      },
    ],
  };

  return await sendSlackMessage(message);
}
