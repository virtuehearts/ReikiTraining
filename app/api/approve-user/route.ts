import { prisma } from "@/lib/db";
import { sendApprovalEmail } from "@/lib/email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { userId, status } = await req.json();

    if (!userId || !status) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status },
    });

    if (status === "APPROVED") {
      try {
        await sendApprovalEmail(user.email, user.name || "Seeker");
      } catch (emailError) {
        console.error("Email sending failed:", emailError);
        // We still updated the status, so maybe just log it
      }
    }

    return NextResponse.json({ success: true, user });
  } catch (error) {
    console.error("Approval error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
