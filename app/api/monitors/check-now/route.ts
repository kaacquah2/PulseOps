import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { performHealthCheck, recordMetric, updateMonitorStatus } from "@/lib/monitoring/check";
import { MonitorType } from "@/types";

export const dynamic = "force-dynamic";

/**
 * Manual Monitor Check Endpoint
 * 
 * Allows authenticated users to manually trigger monitor checks
 * without waiting for the cron job.
 * 
 * Use cases:
 * - User wants to verify a monitor immediately after creation
 * - User wants to test if an issue is resolved
 * - User wants fresh data on-demand
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { monitorId } = body;

    // If specific monitor ID provided, check only that monitor
    if (monitorId) {
      const monitor = await prisma.monitor.findUnique({
        where: { id: monitorId },
      });

      if (!monitor) {
        return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
      }

      if (!monitor.enabled) {
        return NextResponse.json(
          { error: "Monitor is disabled" },
          { status: 400 }
        );
      }

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

        return NextResponse.json({
          success: true,
          monitor: {
            id: monitor.id,
            name: monitor.name,
            status: result.success ? "online" : "offline",
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            errorMessage: result.errorMessage,
          },
        });
      } catch (error) {
        console.error(`Error checking monitor ${monitor.id}:`, error);
        return NextResponse.json(
          {
            success: false,
            error: error instanceof Error ? error.message : "Failed to check monitor",
          },
          { status: 500 }
        );
      }
    }

    // If no monitor ID provided, check all enabled monitors in parallel
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
      },
    });

    if (monitors.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No monitors to check",
        results: [],
      });
    }

    // Execute all checks in parallel using Promise.allSettled
    const checkPromises = monitors.map(async (monitor) => {
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
          statusCode: result.statusCode,
          errorMessage: result.errorMessage,
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

    interface CheckResult {
      monitorId: string;
      name: string;
      success: boolean;
      responseTime?: number;
      statusCode?: number;
      errorMessage?: string;
      error?: string;
    }

    const settledResults = await Promise.allSettled(checkPromises);
    const results = settledResults
      .filter((r) => r.status === "fulfilled")
      .map((r) => (r as PromiseFulfilledResult<CheckResult>).value);

    return NextResponse.json({
      success: true,
      message: `Checked ${results.length} monitor(s)`,
      results,
    });
  } catch (error) {
    console.error("Error in manual monitor check:", error);
    return NextResponse.json(
      {
        error: "Failed to check monitors",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
