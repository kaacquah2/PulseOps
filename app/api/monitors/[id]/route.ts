import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const monitorUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  url: z.string().url().optional(),
  type: z.enum(["http", "https", "ping", "tcp", "dns"]).optional(),
  interval: z.number().min(1).max(60).optional(),
  timeout: z.number().min(1).max(120).optional(),
  expectedStatusCode: z.number().optional(),
  enabled: z.boolean().optional(),
  status: z.enum(["online", "offline", "degraded", "maintenance"]).optional(),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const monitor = await prisma.monitor.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        status: true,
        interval: true,
        timeout: true,
        expectedStatusCode: true,
        uptime: true,
        averageResponseTime: true,
        lastChecked: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
        incidents: {
          orderBy: {
            createdAt: "desc",
          },
          take: 10,
          select: {
            id: true,
            title: true,
            description: true,
            status: true,
            severity: true,
            startedAt: true,
            resolvedAt: true,
            createdAt: true,
          },
        },
        alerts: {
          select: {
            id: true,
            type: true,
            destination: true,
            enabled: true,
          },
        },
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const response = NextResponse.json({ monitor });
    
    // Cache monitor details for 20 seconds
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=20, stale-while-revalidate=40"
    );

    return response;
  } catch (error) {
    console.error("Error fetching monitor:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitor" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const data = monitorUpdateSchema.parse(body);

    // Verify ownership with minimal query
    const monitor = await prisma.monitor.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const updatedMonitor = await prisma.monitor.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        url: true,
        type: true,
        status: true,
        interval: true,
        timeout: true,
        expectedStatusCode: true,
        uptime: true,
        averageResponseTime: true,
        lastChecked: true,
        enabled: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      },
    });

    return NextResponse.json({ monitor: updatedMonitor });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Error updating monitor:", error);
    return NextResponse.json(
      { error: "Failed to update monitor" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    
    // Verify ownership with minimal query
    const monitor = await prisma.monitor.findUnique({
      where: {
        id,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    await prisma.monitor.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting monitor:", error);
    return NextResponse.json(
      { error: "Failed to delete monitor" },
      { status: 500 }
    );
  }
}
