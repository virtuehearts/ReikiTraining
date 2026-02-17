import { db } from "@/lib/db";
import { progress, reflections } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";

function getDateKeyInTimeZone(date: Date, timeZone?: string) {
  try {
    return date.toLocaleDateString("en-CA", { timeZone: timeZone || "UTC" });
  } catch {
    return date.toLocaleDateString("en-CA", { timeZone: "UTC" });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { day, reflection, timeZone } = await req.json();

    if (!day) {
      return NextResponse.json({ error: "Missing day" }, { status: 400 });
    }

    const dayInt = parseInt(day);

    if (!Number.isInteger(dayInt) || dayInt < 1 || dayInt > 7) {
      return NextResponse.json({ error: "Invalid day" }, { status: 400 });
    }

    const existingProgress = await db.query.progress.findMany({
      where: and(eq(progress.userId, session.user.id), eq(progress.completed, true)),
    });

    const completedDays = existingProgress.map((p) => p.day);
    const highestCompletedDay = completedDays.length ? Math.max(...completedDays) : 0;

    if (dayInt > highestCompletedDay + 1) {
      return NextResponse.json({
        error: "You must complete each day in order.",
      }, { status: 400 });
    }

    if (dayInt === highestCompletedDay + 1 && highestCompletedDay > 0) {
      const previousDayProgress = existingProgress.find((p) => p.day === highestCompletedDay);
      const previousCompletedAt = previousDayProgress?.completedAt;

      if (previousCompletedAt) {
        const previousDayKey = getDateKeyInTimeZone(previousCompletedAt, timeZone);
        const todayKey = getDateKeyInTimeZone(new Date(), timeZone);

        if (previousDayKey === todayKey) {
          return NextResponse.json({
            error: "You have completed today's lesson. Please meditate on this wisdom and return after midnight for the next day.",
          }, { status: 400 });
        }
      }
    }

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
