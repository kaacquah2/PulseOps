"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { StatCard } from "@/components/dashboard/stat-card";
import { MonitorStatus } from "@/components/dashboard/monitor-status";
import { IncidentList } from "@/components/dashboard/incident-list";
import { Activity, AlertTriangle, TrendingUp, Server } from "lucide-react";
import { Monitor, Incident, DashboardStats } from "@/types";

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoized fetch function to prevent unnecessary re-renders
  const fetchData = useCallback(async () => {
    try {
      const [statsRes, monitorsRes, incidentsRes] = await Promise.all([
        fetch("/api/dashboard/stats", { 
          // Enable caching in the browser
          next: { revalidate: 30 } 
        }),
        fetch("/api/monitors", { 
          next: { revalidate: 15 } 
        }),
        fetch("/api/incidents?status=open", { 
          next: { revalidate: 20 } 
        }),
      ]);

      if (!statsRes.ok || !monitorsRes.ok || !incidentsRes.ok) {
        throw new Error("Failed to fetch dashboard data");
      }

      const [statsData, monitorsData, incidentsData] = await Promise.all([
        statsRes.json(),
        monitorsRes.json(),
        incidentsRes.json(),
      ]);

      setStats(statsData.stats);
      setMonitors(monitorsData.monitors || []);
      setIncidents(incidentsData.incidents || []);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Memoize sliced arrays to prevent unnecessary re-renders
  const displayMonitors = useMemo(() => monitors.slice(0, 6), [monitors]);
  const displayIncidents = useMemo(() => incidents.slice(0, 5), [incidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-zinc-500">Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Overview of your monitoring infrastructure
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Monitors"
          value={stats?.totalMonitors || 0}
          description="Active monitoring services"
          icon={Server}
        />
        <StatCard
          title="Online Services"
          value={stats?.onlineMonitors || 0}
          description="Services running normally"
          icon={Activity}
        />
        <StatCard
          title="Average Uptime"
          value={`${stats?.averageUptime.toFixed(2) || 0}%`}
          description="Across all monitors"
          icon={TrendingUp}
        />
        <StatCard
          title="Open Incidents"
          value={stats?.openIncidents || 0}
          description="Requiring attention"
          icon={AlertTriangle}
        />
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Your Monitors</h2>
        {monitors.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
            <Activity className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
            <h3 className="text-lg font-medium mb-2">No monitors yet</h3>
            <p className="text-zinc-600 dark:text-zinc-400 mb-4">
              Get started by creating your first monitor
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {displayMonitors.map((monitor) => (
              <MonitorStatus 
                key={monitor.id} 
                monitor={monitor}
                onCheckComplete={fetchData}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-4">Recent Incidents</h2>
        <IncidentList incidents={displayIncidents} />
      </div>
    </div>
  );
}
