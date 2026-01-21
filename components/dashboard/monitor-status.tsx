import { Monitor } from "@/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { Activity, Clock, TrendingUp, RefreshCw } from "lucide-react";
import Link from "next/link";
import { useState, useCallback, useMemo, memo } from "react";

interface MonitorStatusProps {
  monitor: Monitor;
  onCheckComplete?: () => void;
}

// Memoize the component to prevent unnecessary re-renders
export const MonitorStatus = memo(function MonitorStatus({ 
  monitor, 
  onCheckComplete 
}: MonitorStatusProps) {
  const [checking, setChecking] = useState(false);

  // Memoize status variant calculation
  const statusVariant = useMemo(() => {
    switch (monitor.status) {
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
  }, [monitor.status]);

  // Memoize the check handler
  const handleCheckNow = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setChecking(true);
    try {
      const response = await fetch("/api/monitors/check-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ monitorId: monitor.id }),
      });

      if (response.ok && onCheckComplete) {
        onCheckComplete();
      }
    } catch (error) {
      console.error("Error checking monitor:", error);
    } finally {
      setChecking(false);
    }
  }, [monitor.id, onCheckComplete]);

  // Memoize formatted values
  const formattedUptime = useMemo(() => monitor.uptime.toFixed(2), [monitor.uptime]);
  const formattedResponseTime = useMemo(() => monitor.averageResponseTime.toFixed(0), [monitor.averageResponseTime]);
  const formattedLastChecked = useMemo(
    () => (monitor.lastChecked ? formatDate(monitor.lastChecked) : "Never"),
    [monitor.lastChecked]
  );

  return (
    <Link href={`/monitors/${monitor.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-base font-medium">{monitor.name}</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCheckNow}
              disabled={checking}
              className="h-8 px-2"
            >
              <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
            </Button>
            <Badge variant={statusVariant}>
              {monitor.status}
            </Badge>
          </div>
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
                <div className="font-medium">{formattedUptime}%</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-zinc-500" />
              <div>
                <div className="text-xs text-zinc-500">Avg Response</div>
                <div className="font-medium">{formattedResponseTime}ms</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-zinc-500" />
              <div>
                <div className="text-xs text-zinc-500">Last Check</div>
                <div className="font-medium">
                  {formattedLastChecked}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});
