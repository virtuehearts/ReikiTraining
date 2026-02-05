import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

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
      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: userId },
            { senderId: userId, receiverId: session.user.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
    } else if (session.user.role === "ADMIN" && !userId) {
      // Admin fetching ALL latest messages to see who messaged (summary)
      // This is simplified, usually you'd want a list of conversations
      messages = await prisma.message.findMany({
        where: { receiverId: session.user.id },
        include: { sender: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      // Normal user fetches their conversation with admin
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });

      if (!admin) {
        return NextResponse.json([]);
      }

      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: session.user.id, receiverId: admin.id },
            { senderId: admin.id, receiverId: session.user.id },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
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
      const admin = await prisma.user.findFirst({
        where: { role: "ADMIN" },
      });
      if (!admin) {
        return NextResponse.json({ error: "No administrator found" }, { status: 404 });
      }
      targetReceiverId = admin.id;
    }

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId: targetReceiverId,
        content,
        isBooking: !!isBooking,
      },
    });

    return NextResponse.json(message);
  } catch (error) {
    console.error("Message send error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
