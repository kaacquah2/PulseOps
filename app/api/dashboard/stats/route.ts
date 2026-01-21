import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      totalMonitors,
      onlineMonitors,
      offlineMonitors,
      degradedMonitors,
      openIncidents,
      totalIncidents,
      allMonitors,
    ] = await Promise.all([
      prisma.monitor.count({
        where: { userId: session.user.id },
      }),
      prisma.monitor.count({
        where: { userId: session.user.id, status: "online" },
      }),
      prisma.monitor.count({
        where: { userId: session.user.id, status: "offline" },
      }),
      prisma.monitor.count({
        where: { userId: session.user.id, status: "degraded" },
      }),
      prisma.incident.count({
        where: {
          monitor: { userId: session.user.id },
          status: "open",
        },
      }),
      prisma.incident.count({
        where: {
          monitor: { userId: session.user.id },
        },
      }),
      prisma.monitor.findMany({
        where: { userId: session.user.id },
        select: { uptime: true },
      }),
    ]);

    const averageUptime =
      allMonitors.length > 0
        ? allMonitors.reduce((sum, m) => sum + m.uptime, 0) / allMonitors.length
        : 100;

    const stats = {
      totalMonitors,
      onlineMonitors,
      offlineMonitors,
      degradedMonitors,
      averageUptime,
      openIncidents,
      totalIncidents,
    };

    return NextResponse.json({ stats });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
