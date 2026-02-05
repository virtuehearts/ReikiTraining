import { db } from "@/lib/db";
import { intakes } from "@/lib/schema";
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

    const [intake] = await db.insert(intakes)
      .values({
        userId: session.user.id,
        age: age ? parseInt(age) : null,
        location,
        experience,
        goal,
        healthConcerns,
      })
      .onConflictDoUpdate({
        target: [intakes.userId],
        set: {
          age: age ? parseInt(age) : null,
          location,
          experience,
          goal,
          healthConcerns,
        },
      })
      .returning();

    return NextResponse.json({ success: true, intake });
  } catch (error) {
    console.error("Intake submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
