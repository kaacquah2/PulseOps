import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { z } from "zod";
import crypto from "crypto";

const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token } = verifyEmailSchema.parse(body);

    // Hash the token to match what's stored in database
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Find the email verification record
    const verification = await prisma.emailVerification.findUnique({
      where: { token: hashedToken },
      include: { user: true },
    });

    // Check if token exists
    if (!verification) {
      return NextResponse.json(
        { error: "Invalid or expired verification token" },
        { status: 400 }
      );
    }

    // Check if token has expired
    if (new Date() > verification.expires) {
      // Delete expired token
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });
      
      return NextResponse.json(
        { error: "Verification link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check if email is already verified
    if (verification.user.emailVerified) {
      // Delete the verification token
      await prisma.emailVerification.delete({
        where: { id: verification.id },
      });

      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 200 }
      );
    }

    // Update user email verified status
    await prisma.user.update({
      where: { id: verification.userId },
      data: { emailVerified: new Date() },
    });

    // Delete the verification token
    await prisma.emailVerification.delete({
      where: { id: verification.id },
    });

    return NextResponse.json(
      { message: "Email has been verified successfully" },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    console.error("Error in verify email:", error);
    return NextResponse.json(
      { error: "Failed to verify email" },
      { status: 500 }
    );
  }
}
