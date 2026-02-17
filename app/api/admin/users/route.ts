import { db } from "@/lib/db";
import { chatMessages, users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, desc, eq, gte, sql } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allUsers = await db.query.users.findMany({
      with: {
        intake: true,
      },
      orderBy: [desc(users.createdAt)],
    });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const usageRows = await db
      .select({
        userId: chatMessages.userId,
        requestCount: sql<number>`count(*)`,
      })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.role, "user"),
          gte(chatMessages.createdAt, startOfDay)
        )
      )
      .groupBy(chatMessages.userId);

    const usageByUserId = new Map(usageRows.map((row) => [row.userId, row.requestCount]));

    const enrichedUsers = allUsers.map((user) => {
      const todayRequestCount = usageByUserId.get(user.id) || 0;
      return {
        ...user,
        todayRequestCount,
        heavyUser: todayRequestCount > 200,
      };
    });

    return NextResponse.json(enrichedUsers);
  } catch (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
