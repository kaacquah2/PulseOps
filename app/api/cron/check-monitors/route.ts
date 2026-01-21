import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { performHealthCheck, recordMetric, updateMonitorStatus } from "@/lib/monitoring/check";
import { MonitorType } from "@/types";

export const dynamic = "force-dynamic";

/**
 * @deprecated This endpoint is deprecated. Use /api/cron/master instead.
 * 
 * This endpoint is kept for backward compatibility but is no longer used
 * by the Vercel cron configuration. The master cron endpoint consolidates
 * all periodic tasks into a single job to fit within Vercel's free plan
 * limit of 2 cron jobs.
 * 
 * Migration: Update your cron service to call /api/cron/master instead.
 */
export async function GET(req: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    
    // Get all enabled monitors that are due for checking
    const monitors = await prisma.monitor.findMany({
      where: {
        enabled: true,
      },
    });

    const results = [];

    for (const monitor of monitors) {
      // Check if monitor is due for checking based on interval
      const lastChecked = monitor.lastChecked || new Date(0);
      const minutesSinceLastCheck = (now.getTime() - lastChecked.getTime()) / 1000 / 60;

      if (minutesSinceLastCheck >= monitor.interval) {
        try {
          // Perform health check
          const result = await performHealthCheck(
            monitor.url,
            monitor.type as MonitorType,
            monitor.expectedStatusCode,
            monitor.timeout
          );

          // Record metric
          await recordMetric(monitor.id, result);

          // Update monitor status
          await updateMonitorStatus(monitor.id, result);

          results.push({
            monitorId: monitor.id,
            name: monitor.name,
            success: result.success,
            responseTime: result.responseTime,
          });
        } catch (error) {
          console.error(`Error checking monitor ${monitor.id}:`, error);
          results.push({
            monitorId: monitor.id,
            name: monitor.name,
            success: false,
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      checked: results.length,
      results,
    });
  } catch (error) {
    console.error("Error in monitor check cron:", error);
    return NextResponse.json(
      { error: "Failed to check monitors" },
      { status: 500 }
    );
  }
}
