import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import { z } from "zod";

const incidentUpdateSchema = z.object({
  status: z.enum(["open", "investigating", "resolved"]).optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

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
    const data = incidentUpdateSchema.parse(body);

    const incident = await prisma.incident.findFirst({
      where: {
        id,
        monitor: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
        resolvedAt: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    const updateData = { 
      ...data,
      ...(data.status === "resolved" && !incident.resolvedAt ? { resolvedAt: new Date() } : {})
    };

    const updatedIncident = await prisma.incident.update({
      where: { id },
      data: updateData,
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

    return NextResponse.json({ incident: updatedIncident });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Error updating incident:", error);
    return NextResponse.json(
      { error: "Failed to update incident" },
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
    const incident = await prisma.incident.findFirst({
      where: {
        id,
        monitor: {
          userId: session.user.id,
        },
      },
      select: {
        id: true,
      },
    });

    if (!incident) {
      return NextResponse.json({ error: "Incident not found" }, { status: 404 });
    }

    await prisma.incident.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting incident:", error);
    return NextResponse.json(
      { error: "Failed to delete incident" },
      { status: 500 }
    );
  }
}
