"use client";

import { useEffect, useState } from "react";
import { MonitorStatus } from "@/components/dashboard/monitor-status";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, Plus } from "lucide-react";
import { Monitor } from "@/types";

export default function MonitorsPage() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    url: "",
    type: "https",
    interval: 5,
    timeout: 30,
    expectedStatusCode: 200,
  });

  useEffect(() => {
    fetchMonitors();
  }, []);

  async function fetchMonitors() {
    try {
      const response = await fetch("/api/monitors");
      const data = await response.json();
      setMonitors(data.monitors || []);
    } catch (error) {
      console.error("Error fetching monitors:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await fetch("/api/monitors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setShowCreateForm(false);
        setFormData({
          name: "",
          url: "",
          type: "https",
          interval: 5,
          timeout: 30,
          expectedStatusCode: 200,
        });
        fetchMonitors();
      }
    } catch (error) {
      console.error("Error creating monitor:", error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-zinc-500">Loading monitors...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Monitors</h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Manage your monitoring endpoints
          </p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Monitor
        </Button>
      </div>

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Monitor</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Monitor Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    placeholder="My API"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    value={formData.url}
                    onChange={(e) =>
                      setFormData({ ...formData, url: e.target.value })
                    }
                    placeholder="https://api.example.com"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) =>
                      setFormData({ ...formData, type: e.target.value })
                    }
                    className="flex h-10 w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                  >
                    <option value="http">HTTP</option>
                    <option value="https">HTTPS</option>
                    <option value="ping">Ping</option>
                    <option value="tcp">TCP</option>
                    <option value="dns">DNS</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interval">Interval (minutes)</Label>
                  <Input
                    id="interval"
                    type="number"
                    min="1"
                    max="60"
                    value={formData.interval}
                    onChange={(e) =>
                      setFormData({ ...formData, interval: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timeout">Timeout (seconds)</Label>
                  <Input
                    id="timeout"
                    type="number"
                    min="1"
                    max="120"
                    value={formData.timeout}
                    onChange={(e) =>
                      setFormData({ ...formData, timeout: parseInt(e.target.value) })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="statusCode">Expected Status Code</Label>
                  <Input
                    id="statusCode"
                    type="number"
                    value={formData.expectedStatusCode}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        expectedStatusCode: parseInt(e.target.value),
                      })
                    }
                    required
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Button type="submit">Create Monitor</Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {monitors.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <Activity className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-lg font-medium mb-2">No monitors yet</h3>
          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
            Get started by creating your first monitor
          </p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Monitor
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {monitors.map((monitor) => (
            <MonitorStatus key={monitor.id} monitor={monitor} />
          ))}
        </div>
      )}
    </div>
  );
}
