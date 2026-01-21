import { Incident } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";
import Link from "next/link";

interface IncidentListProps {
  incidents: Incident[];
}

export function IncidentList({ incidents }: IncidentListProps) {
  const getSeverityVariant = (severity: string) => {
    switch (severity) {
      case "critical":
        return "error";
      case "high":
        return "error";
      case "medium":
        return "warning";
      case "low":
        return "info";
      default:
        return "default";
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "open":
        return "error";
      case "investigating":
        return "warning";
      case "resolved":
        return "success";
      default:
        return "default";
    }
  };

  if (incidents.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-zinc-500 dark:text-zinc-400">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No incidents to display</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Incidents</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {incidents.map((incident) => (
            <Link
              key={incident.id}
              href={`/incidents/${incident.id}`}
              className="block"
            >
              <div className="flex items-start justify-between p-4 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{incident.title}</h4>
                    <Badge variant={getSeverityVariant(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant={getStatusVariant(incident.status)}>
                      {incident.status}
                    </Badge>
                  </div>
                  {incident.description && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-2">
                      {incident.description}
                    </p>
                  )}
                  <div className="text-xs text-zinc-500">
                    Started {formatDate(incident.startedAt)}
                    {incident.resolvedAt && ` • Resolved ${formatDate(incident.resolvedAt)}`}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
