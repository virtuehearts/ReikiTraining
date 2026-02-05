import { db } from "@/lib/db";
import { messages as messagesTable, users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, asc, desc, eq, or } from "drizzle-orm";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    let messages;
    if (session.user.role === "ADMIN" && userId) {
      // Admin fetching messages for a specific user
      messages = await db.select().from(messagesTable).where(
        or(
          and(eq(messagesTable.senderId, session.user.id), eq(messagesTable.receiverId, userId)),
          and(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, session.user.id))
        )
      ).orderBy(asc(messagesTable.createdAt));
    } else if (session.user.role === "ADMIN" && !userId) {
      // Admin fetching ALL latest messages to see who messaged (summary)
      messages = await db.query.messages.findMany({
        where: eq(messagesTable.receiverId, session.user.id),
        with: { sender: true },
        orderBy: [desc(messagesTable.createdAt)],
      });
    } else {
      // Normal user fetches their conversation with admin
      const admin = await db.query.users.findFirst({
        where: eq(users.role, "ADMIN"),
      });

      if (!admin) {
        return NextResponse.json([]);
      }

      messages = await db.select().from(messagesTable).where(
        or(
          and(eq(messagesTable.senderId, session.user.id), eq(messagesTable.receiverId, admin.id)),
          and(eq(messagesTable.senderId, admin.id), eq(messagesTable.receiverId, session.user.id))
        )
      ).orderBy(asc(messagesTable.createdAt));
    }

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { content, receiverId, isBooking } = await req.json();

    let targetReceiverId = receiverId;
    if (!targetReceiverId) {
      // If no receiver specified, send to admin
      const admin = await db.query.users.findFirst({
        where: eq(users.role, "ADMIN"),
      });
      if (!admin) {
        return NextResponse.json({ error: "No administrator found" }, { status: 404 });
      }
      targetReceiverId = admin.id;
    }

    const [message] = await db.insert(messagesTable).values({
      senderId: session.user.id,
      receiverId: targetReceiverId,
      content,
      isBooking: !!isBooking,
    }).returning();

    return NextResponse.json(message);
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
