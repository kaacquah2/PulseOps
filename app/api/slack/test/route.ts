import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendTestNotification } from "@/lib/slack";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { channel } = await req.json();

    const success = await sendTestNotification(channel);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to send Slack notification. Please check your configuration." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Test notification sent successfully!",
    });
  } catch (error) {
    console.error("Error sending test notification:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 }
    );
  }
}
