import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";

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

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("Admin fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
