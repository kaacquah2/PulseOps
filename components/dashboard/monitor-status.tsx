import { Monitor } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Activity, Clock, TrendingUp } from "lucide-react";
import Link from "next/link";

interface MonitorStatusProps {
  monitor: Monitor;
}

export function MonitorStatus({ monitor }: MonitorStatusProps) {
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "online":
        return "success";
      case "offline":
        return "error";
      case "degraded":
        return "warning";
      case "maintenance":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <Link href={`/monitors/${monitor.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{monitor.name}</CardTitle>
          <Badge variant={getStatusVariant(monitor.status)}>
            {monitor.status}
          </Badge>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-zinc-600 dark:text-zinc-400 mb-4">
            {monitor.url}
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-zinc-500" />
              <div>
                <div className="text-xs text-zinc-500">Uptime</div>
                <div className="font-medium">{monitor.uptime.toFixed(2)}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-500" />
              <div>
                <div className="text-xs text-zinc-500">Avg Response</div>
                <div className="font-medium">{monitor.averageResponseTime.toFixed(0)}ms</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              <div>
                <div className="text-xs text-zinc-500">Last Check</div>
                <div className="font-medium">
                  {monitor.lastChecked ? formatDate(monitor.lastChecked) : "Never"}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
