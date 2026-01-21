import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const monitorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  url: z.string().url("Invalid URL"),
  type: z.enum(["http", "https", "ping", "tcp", "dns"]),
  interval: z.number().min(1).max(60).default(5),
  timeout: z.number().min(1).max(120).default(30),
  expectedStatusCode: z.number().default(200),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const monitors = await prisma.monitor.findMany({
      where: {
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
        incidents: {
          where: {
            status: "open",
          },
          take: 5,
          orderBy: {
            createdAt: "desc",
          },
          select: {
            id: true,
            title: true,
            severity: true,
            status: true,
            startedAt: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const response = NextResponse.json({ monitors });
    
    // Cache for 15 seconds to reduce database load
    response.headers.set(
      "Cache-Control",
      "private, s-maxage=15, stale-while-revalidate=30"
    );

    return response;
  } catch (error) {
    console.error("Error fetching monitors:", error);
    return NextResponse.json(
      { error: "Failed to fetch monitors" },
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
    const data = monitorSchema.parse(body);

    const monitor = await prisma.monitor.create({
      data: {
        ...data,
        userId: session.user.id,
      },
    });

    return NextResponse.json({ monitor }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Error creating monitor:", error);
    return NextResponse.json(
      { error: "Failed to create monitor" },
      { status: 500 }
    );
  }
}
