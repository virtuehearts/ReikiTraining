import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        intake: true,
        progress: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      hasIntake: !!user.intake,
      completedDays: user.progress.filter(p => p.completed).map(p => p.day),
      completedProgress: user.progress
        .filter((p) => p.completed)
        .map((p) => ({
          day: p.day,
          completedAt: p.completedAt ? p.completedAt.toISOString() : null,
        })),
    });
  } catch (error) {
    console.error("Progress fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
