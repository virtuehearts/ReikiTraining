import { db } from "@/lib/db";
import { intakes, users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

function detectBrowserType(userAgent: string) {
  const ua = userAgent.toLowerCase();
  if (ua.includes("edg/")) return "Edge";
  if (ua.includes("opr/") || ua.includes("opera")) return "Opera";
  if (ua.includes("chrome/")) return "Chrome";
  if (ua.includes("firefox/")) return "Firefox";
  if (ua.includes("safari/") && !ua.includes("chrome/")) return "Safari";
  return "Unknown";
}

function getClientIp(req: Request) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || null;
  }

  const realIp = req.headers.get("x-real-ip");
  return realIp?.trim() || null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { age, location, gender, experience, goal, whyJoined, healthConcerns, photoBase64 } = await req.json();
    const userAgent = req.headers.get("user-agent") || "";
    const browserType = detectBrowserType(userAgent);
    const ipAddress = getClientIp(req);

    const [intake] = await db.insert(intakes)
      .values({
        userId: session.user.id,
        age: age ? parseInt(age) : null,
        location,
        gender,
        experience,
        goal,
        whyJoined,
        healthConcerns,
        userAgent,
        browserType,
        ipAddress,
      })
      .onConflictDoUpdate({
        target: [intakes.userId],
        set: {
          age: age ? parseInt(age) : null,
          location,
          gender,
          experience,
          goal,
          whyJoined,
          healthConcerns,
          userAgent,
          browserType,
          ipAddress,
        },
      })
      .returning();

    if (typeof photoBase64 === "string" && photoBase64.startsWith("data:image/")) {
      await db.update(users)
        .set({ image: photoBase64 })
        .where(eq(users.id, session.user.id));
    }

    return NextResponse.json({ success: true, intake });
  } catch (error) {
    console.error("Intake submission error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
