import { prisma } from "@/lib/db";
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

    // Upsert progress
    await prisma.progress.upsert({
      where: {
        userId_day: {
          userId: session.user.id,
          day: parseInt(day),
        },
      },
      update: {
        completed: true,
        completedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        day: parseInt(day),
        completed: true,
        completedAt: new Date(),
      },
    });

    // Save reflection if provided
    if (reflection) {
      await prisma.reflection.upsert({
        where: {
          userId_day: {
            userId: session.user.id,
            day: parseInt(day),
          },
        },
        update: {
          content: reflection,
        },
        create: {
          userId: session.user.id,
          day: parseInt(day),
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
