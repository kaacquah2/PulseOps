import prisma from "@/lib/db";
import { MonitorType } from "@/types";
import * as SlackNotifications from "@/lib/slack";

interface CheckResult {
  success: boolean;
  responseTime: number;
  statusCode?: number;
  errorMessage?: string;
}

export async function performHealthCheck(
  url: string,
  type: MonitorType,
  expectedStatusCode: number = 200,
  timeout: number = 30
): Promise<CheckResult> {
  const startTime = Date.now();

  try {
    switch (type) {
      case "http":
      case "https":
        return await httpCheck(url, expectedStatusCode, timeout);
      case "ping":
        return await pingCheck(url, timeout);
      case "tcp":
        return await tcpCheck(url, timeout);
      case "dns":
        return await dnsCheck(url, timeout);
      default:
        throw new Error(`Unsupported monitor type: ${type}`);
    }
  } catch (error) {
    const responseTime = Date.now() - startTime;
    return {
      success: false,
      responseTime,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

async function httpCheck(
  url: string,
  expectedStatusCode: number,
  timeout: number
): Promise<CheckResult> {
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "PulseOps/1.0",
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    const success = response.status === expectedStatusCode;

    return {
      success,
      responseTime,
      statusCode: response.status,
      errorMessage: success ? undefined : `Unexpected status code: ${response.status}`,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        return {
          success: false,
          responseTime,
          errorMessage: `Request timed out after ${timeout}s`,
        };
      }
      return {
        success: false,
        responseTime,
        errorMessage: error.message,
      };
    }
    
    return {
      success: false,
      responseTime,
      errorMessage: "Unknown error occurred",
    };
  }
}

async function pingCheck(url: string, timeout: number): Promise<CheckResult> {
  // For web environments, we'll simulate ping with a HEAD request
  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout * 1000);

  try {
    const hostname = new URL(url).hostname;
    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    return {
      success: response.ok,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      responseTime,
      errorMessage: error instanceof Error ? error.message : "Ping failed",
    };
  }
}

async function tcpCheck(url: string, timeout: number): Promise<CheckResult> {
  // TCP checks in web environment - we'll use HTTP as fallback
  return httpCheck(url, 200, timeout);
}

async function dnsCheck(url: string, timeout: number): Promise<CheckResult> {
  const startTime = Date.now();
  
  try {
    const hostname = new URL(url).hostname;
    // In a web environment, we verify DNS by attempting connection
    const response = await fetch(`https://${hostname}`, {
      method: "HEAD",
      signal: AbortSignal.timeout(timeout * 1000),
    });

    const responseTime = Date.now() - startTime;

    return {
      success: true,
      responseTime,
      statusCode: response.status,
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    return {
      success: false,
      responseTime,
      errorMessage: error instanceof Error ? error.message : "DNS resolution failed",
    };
  }
}

export async function recordMetric(
  monitorId: string,
  result: CheckResult
): Promise<void> {
  await prisma.metric.create({
    data: {
      monitorId,
      responseTime: result.responseTime,
      statusCode: result.statusCode,
      success: result.success,
      errorMessage: result.errorMessage,
    },
  });
}

/**
 * Batch record multiple metrics in a single database operation
 * Significantly faster than individual inserts
 */
export async function recordMetricsBatch(
  metrics: Array<{ monitorId: string; result: CheckResult }>
): Promise<void> {
  if (metrics.length === 0) return;

  await prisma.metric.createMany({
    data: metrics.map((m) => ({
      monitorId: m.monitorId,
      responseTime: m.result.responseTime,
      statusCode: m.result.statusCode,
      success: m.result.success,
      errorMessage: m.result.errorMessage,
    })),
    skipDuplicates: true,
  });
}

export async function updateMonitorStatus(
  monitorId: string,
  result: CheckResult
): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    select: {
      id: true,
      name: true,
      url: true,
      status: true,
      metrics: {
        orderBy: { timestamp: "desc" },
        take: 100,
        select: {
          success: true,
          responseTime: true,
        },
      },
    },
  });

  if (!monitor) return;

  // Calculate uptime from recent metrics
  const recentMetrics = monitor.metrics;
  const successCount = recentMetrics.filter((m) => m.success).length;
  const uptime = recentMetrics.length > 0
    ? (successCount / recentMetrics.length) * 100
    : 100;

  // Calculate average response time
  const avgResponseTime = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length
    : result.responseTime;

  // Determine status
  let status = "online";
  if (!result.success) {
    status = "offline";
  } else if (result.responseTime > 5000) {
    status = "degraded";
  }

  await prisma.monitor.update({
    where: { id: monitorId },
    data: {
      status,
      uptime,
      averageResponseTime: avgResponseTime,
      lastChecked: new Date(),
    },
  });

  // Create incident if monitor went offline
  if (!result.success && monitor.status !== "offline") {
    await prisma.incident.create({
      data: {
        monitorId,
        title: `${monitor.name} is down`,
        description: result.errorMessage || "Monitor check failed",
        severity: "high",
        status: "open",
      },
    });

    // Send Slack notification for new incident
    try {
      await SlackNotifications.sendIncidentAlert(
        monitor.name,
        monitor.url,
        result.errorMessage || "Monitor check failed",
        "high"
      );
    } catch (error) {
      console.error("Failed to send Slack notification:", error);
    }
  }

  // Resolve incidents if monitor is back online
  if (result.success && monitor.status === "offline") {
    // Get open incidents before updating them (optimized query)
    const openIncidents = await prisma.incident.findMany({
      where: {
        monitorId,
        status: "open",
      },
      select: {
        id: true,
        startedAt: true,
      },
    });

    // Batch update all open incidents
    if (openIncidents.length > 0) {
      await prisma.incident.updateMany({
        where: {
          monitorId,
          status: "open",
        },
        data: {
          status: "resolved",
          resolvedAt: new Date(),
        },
      });

      // Send Slack notification for recovery (async, non-blocking)
      const firstIncident = openIncidents[0];
      const downtimeDuration = firstIncident.startedAt
        ? formatDuration(new Date().getTime() - firstIncident.startedAt.getTime())
        : "Unknown";

      // Fire and forget notification (don't block)
      SlackNotifications.sendIncidentResolved(
        monitor.name,
        monitor.url,
        downtimeDuration
      ).catch((error) => {
        console.error("Failed to send Slack recovery notification:", error);
      });
    }
  }
}

/**
 * Batch update multiple monitor statuses efficiently
 */
export async function updateMonitorStatusesBatch(
  updates: Array<{ monitorId: string; result: CheckResult }>
): Promise<void> {
  if (updates.length === 0) return;

  // Process all updates in parallel
  await Promise.allSettled(
    updates.map(({ monitorId, result }) => updateMonitorStatus(monitorId, result))
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ${hours % 24}h ${minutes % 60}m`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}