import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const incidentSchema = z.object({
  monitorId: z.string(),
  title: z.string().min(1),
  description: z.string().optional(),
  severity: z.enum(["low", "medium", "high", "critical"]),
});

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const monitorId = searchParams.get("monitorId");

    const incidents = await prisma.incident.findMany({
      where: {
        monitor: {
          userId: session.user.id,
        },
        ...(status && { status }),
        ...(monitorId && { monitorId }),
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        severity: true,
        startedAt: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        monitorId: true,
        monitor: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = NextResponse.json({ incidents });
    
    // Cache for 20 seconds for incident lists
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=20, stale-while-revalidate=40"
    );

    return response;
  } catch (error) {
    console.error("Error fetching incidents:", error);
    return NextResponse.json(
      { error: "Failed to fetch incidents" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const data = incidentSchema.parse(body);

    // Verify monitor belongs to user (minimal query)
    const monitor = await prisma.monitor.findUnique({
      where: {
        id: data.monitorId,
        userId: session.user.id,
      },
      select: {
        id: true,
      },
    });

    if (!monitor) {
      return NextResponse.json({ error: "Monitor not found" }, { status: 404 });
    }

    const incident = await prisma.incident.create({
      data,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        severity: true,
        startedAt: true,
        resolvedAt: true,
        createdAt: true,
        updatedAt: true,
        monitorId: true,
        monitor: {
          select: {
            id: true,
            name: true,
            url: true,
            status: true,
          },
        },
      },
    });

    return NextResponse.json({ incident }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Error creating incident:", error);
    return NextResponse.json(
      { error: "Failed to create incident" },
      { status: 500 }
    );
  }
}
