"use client";

import { useEffect, useState, useCallback } from "react";
import { IncidentList } from "@/components/dashboard/incident-list";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { Incident } from "@/types";

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  const fetchIncidents = useCallback(async () => {
    try {
      const url =
        filter === "all"
          ? "/api/incidents"
          : `/api/incidents?status=${filter}`;
      const response = await fetch(url);
      const data = await response.json();
      setIncidents(data.incidents || []);
    } catch (error) {
      console.error("Error fetching incidents:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-lg text-zinc-500">Loading incidents...</div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Incidents</h1>
        <p className="text-zinc-600 dark:text-zinc-400">
          Track and manage your monitoring incidents
        </p>
      </div>

      <div className="flex gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          All
        </Button>
        <Button
          variant={filter === "open" ? "default" : "outline"}
          onClick={() => setFilter("open")}
        >
          Open
        </Button>
        <Button
          variant={filter === "investigating" ? "default" : "outline"}
          onClick={() => setFilter("investigating")}
        >
          Investigating
        </Button>
        <Button
          variant={filter === "resolved" ? "default" : "outline"}
          onClick={() => setFilter("resolved")}
        >
          Resolved
        </Button>
      </div>

      {incidents.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-zinc-400" />
          <h3 className="text-lg font-medium mb-2">No incidents found</h3>
          <p className="text-zinc-600 dark:text-zinc-400">
            {filter === "all"
              ? "No incidents have been reported yet"
              : `No ${filter} incidents at this time`}
          </p>
        </div>
      ) : (
        <IncidentList incidents={incidents} />
      )}
    </div>
  );
}
