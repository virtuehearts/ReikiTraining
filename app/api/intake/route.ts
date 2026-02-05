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

    const { age, location, experience, goal, healthConcerns } = await req.json();

    const intake = await prisma.intake.upsert({
      where: { userId: session.user.id },
      update: {
        age: parseInt(age) || undefined,
        location,
        experience,
        goal,
        healthConcerns,
      },
      create: {
        userId: session.user.id,
        age: parseInt(age) || undefined,
        location,
        experience,
        goal,
        healthConcerns,
      },
    });

    return NextResponse.json({ success: true, intake });
  } catch (error) {
    console.error("Intake submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
