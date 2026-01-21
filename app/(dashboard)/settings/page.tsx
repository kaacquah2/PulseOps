"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { useState } from "react";

export default function SettingsPage() {
  const { data: session } = useSession();
  const [slackChannel, setSlackChannel] = useState("#alerts");
  const [isTestingSlack, setIsTestingSlack] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestSlack = async () => {
    setIsTestingSlack(true);
    setSlackTestResult(null);

    try {
      const response = await fetch("/api/slack/test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channel: slackChannel || undefined }),
      });

      const data = await response.json();

      if (response.ok) {
        setSlackTestResult({
          success: true,
          message: data.message || "Test notification sent successfully!",
        });
      } else {
        setSlackTestResult({
          success: false,
          message: data.error || "Failed to send test notification",
        });
      }
    } catch {
      setSlackTestResult({
        success: false,
        message: "Failed to send test notification. Please try again.",
      });
    } finally {
      setIsTestingSlack(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Manage your account and preferences
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>
              Update your personal details and email preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                defaultValue={session?.user?.name || ""}
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue={session?.user?.email || ""}
                placeholder="your@email.com"
                disabled
              />
            </div>
            <Button>Save Changes</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notification Settings</CardTitle>
            <CardDescription>
              Configure how you receive alerts and notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-zinc-500">
                  Receive email alerts for incidents
                </div>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Webhook Alerts</div>
                <div className="text-sm text-zinc-500">
                  Configure custom webhook endpoints
                </div>
              </div>
              <Button variant="outline" size="sm">
                Manage
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Slack Integration</CardTitle>
            <CardDescription>
              Configure Slack notifications for monitor alerts
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="slack-channel">Default Slack Channel</Label>
              <Input
                id="slack-channel"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="#alerts"
              />
              <p className="text-xs text-zinc-500">
                Enter the channel where alerts should be sent (e.g., #alerts, #monitoring)
              </p>
            </div>

            <div className="space-y-2">
              <Label>Test Slack Integration</Label>
              <Button
                onClick={handleTestSlack}
                disabled={isTestingSlack}
                className="w-full"
              >
                {isTestingSlack ? "Sending..." : "Send Test Notification"}
              </Button>
            </div>

            {slackTestResult && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  slackTestResult.success
                    ? "bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-300"
                    : "bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300"
                }`}
              >
                {slackTestResult.message}
              </div>
            )}

            <div className="pt-4 border-t">
              <p className="text-xs text-zinc-600 dark:text-zinc-400">
                <strong>Note:</strong> Make sure the SLACK_BOT_TOKEN is configured in your environment variables
                and the bot has been invited to the target channel.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>API Keys</CardTitle>
            <CardDescription>
              Manage API keys for programmatic access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
              Use API keys to integrate PulseOps with your applications
            </p>
            <Button>Generate New Key</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions for your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Delete all monitors and their data
              </p>
              <Button variant="destructive" size="sm">
                Delete All Monitors
              </Button>
            </div>
            <div>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                Permanently delete your account and all associated data
              </p>
              <Button variant="destructive" size="sm">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
