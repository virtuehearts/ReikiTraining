import { chatWithMya } from "@/lib/openrouter";
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

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { messages: currentMessages } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        intake: true,
        chatMessages: {
          orderBy: { createdAt: 'asc' },
          take: 50 // Limit history for context
        }
      },
    });

    // Construct history from database if no messages provided or to supplement
    const history = user?.chatMessages.map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    // Combine history with new message
    const lastUserMessage = currentMessages[currentMessages.length - 1];

    // Save user message to DB
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: "user",
        content: lastUserMessage.content
      }
    });

    const reply = await chatWithMya([...history, lastUserMessage], user?.intake);

    // Save assistant reply to DB
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: "assistant",
        content: reply.content
      }
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
