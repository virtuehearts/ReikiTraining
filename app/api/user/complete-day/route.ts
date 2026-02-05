import { db } from "@/lib/db";
import { progress, reflections } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { day, reflection } = await req.json();

    if (!day) {
      return NextResponse.json({ error: "Missing day" }, { status: 400 });
    }

    const dayInt = parseInt(day);

    // Upsert progress
    await db.insert(progress)
      .values({
        userId: session.user.id,
        day: dayInt,
        completed: true,
        completedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: [progress.userId, progress.day],
        set: {
          completed: true,
          completedAt: new Date(),
        },
      });

    // Save reflection if provided
    if (reflection) {
      await db.insert(reflections)
        .values({
          userId: session.user.id,
          day: dayInt,
          content: reflection,
        })
        .onConflictDoUpdate({
          target: [reflections.userId, reflections.day],
          set: {
            content: reflection,
          },
        });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Complete day error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
