import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { performHealthCheck, recordMetric, updateMonitorStatus } from "@/lib/monitoring/check";
import { MonitorType } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Master Cron Job Handler
 * 
 * Consolidates all periodic tasks into a single endpoint for Vercel's free plan
 * (which supports max 2 cron jobs).
 * 
 * Tasks performed:
 * 1. Monitor Health Checks - Check all enabled monitors
 * 2. Database Cleanup - Clean up old metrics (optional)
 * 3. Incident Auto-Resolution - Close stale resolved incidents (optional)
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    interface MonitorCheckResult {
      monitorId: string;
      name: string;
      success: boolean;
      responseTime?: number;
      error?: string;
    }

    const results = {
      monitorChecks: [] as MonitorCheckResult[],
      cleanup: {
        metricsDeleted: 0,
        incidentsUpdated: 0,
      },
      executionTime: 0,
    };

    const startTime = Date.now();

    // ============================================================================
    // TASK 1: Monitor Health Checks (Parallel Execution)
    // ============================================================================
    const monitors = await prisma.monitor.findMany({
      where: {
        enabled: true,
      },
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        expectedStatusCode: true,
        timeout: true,
        interval: true,
        lastChecked: true,
        status: true,
      },
    });

    // Filter monitors that are due for checking
    const monitorsToCheck = monitors.filter((monitor) => {
      const lastChecked = monitor.lastChecked || new Date(0);
      const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / 1000 / 60;
      return minutesSinceLastCheck >= monitor.interval;
    });

    // Execute health checks in parallel with concurrency limit
    const CONCURRENCY_LIMIT = 10;

    for (let i = 0; i < monitorsToCheck.length; i += CONCURRENCY_LIMIT) {
      const batch = monitorsToCheck.slice(i, i + CONCURRENCY_LIMIT);
      
      const batchPromises = batch.map(async (monitor) => {
        try {
          // Perform health check
          const result = await performHealthCheck(
            monitor.url,
            monitor.type as MonitorType,
            monitor.expectedStatusCode,
            monitor.timeout
          );

          // Record metric and update status in parallel
          await Promise.all([
            recordMetric(monitor.id, result),
            updateMonitorStatus(monitor.id, result),
          ]);

          return {
            monitorId: monitor.id,
            name: monitor.name,
            success: result.success,
            responseTime: result.responseTime,
          };
        } catch (error) {
          console.error(`Error checking monitor ${monitor.id}:`, error);
          return {
            monitorId: monitor.id,
            name: monitor.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          };
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      
      batchResults.forEach((result) => {
        if (result.status === "fulfilled") {
          results.monitorChecks.push(result.value);
        } else {
          console.error("Batch check failed:", result.reason);
        }
      });
    }

    // ============================================================================
    // TASK 2: Database Cleanup (Optional - runs daily)
    // ============================================================================
    // Delete metrics older than 30 days to keep database size manageable
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    try {
      const deletedMetrics = await prisma.metric.deleteMany({
        where: {
          timestamp: {
            lt: thirtyDaysAgo,
          },
        },
      });
      results.cleanup.metricsDeleted = deletedMetrics.count;
    } catch (error) {
      console.error("Error cleaning up old metrics:", error);
    }

    // ============================================================================
    // TASK 3: Incident Cleanup (Optional)
    // ============================================================================
    // Auto-close resolved incidents that have been resolved for more than 7 days
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    try {
      const updatedIncidents = await prisma.incident.updateMany({
        where: {
          status: "resolved",
          resolvedAt: {
            lt: sevenDaysAgo,
          },
        },
        data: {
          status: "closed",
        },
      });
      results.cleanup.incidentsUpdated = updatedIncidents.count;
    } catch (error) {
      console.error("Error cleaning up old incidents:", error);
    }

    // ============================================================================
    // Response
    // ============================================================================
    results.executionTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      timestamp: now.toISOString(),
      tasks: {
        monitorsChecked: results.monitorChecks.length,
        metricsDeleted: results.cleanup.metricsDeleted,
        incidentsClosed: results.cleanup.incidentsUpdated,
      },
      executionTime: `${results.executionTime}ms`,
      details: {
        monitorResults: results.monitorChecks,
      },
    });
  } catch (error) {
    console.error("Error in master cron job:", error);
    return NextResponse.json(
      { 
        error: "Failed to execute cron tasks",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
