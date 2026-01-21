import prisma from "@/lib/db";
import { MonitorType } from "@/types";

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

export async function updateMonitorStatus(
  monitorId: string,
  result: CheckResult
): Promise<void> {
  const monitor = await prisma.monitor.findUnique({
    where: { id: monitorId },
    include: {
      metrics: {
        orderBy: { timestamp: "desc" },
        take: 100,
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
  }

  // Resolve incidents if monitor is back online
  if (result.success && monitor.status === "offline") {
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
  }
}
