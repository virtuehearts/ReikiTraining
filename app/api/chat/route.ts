import { chatWithMya } from "@/lib/openrouter";
import { db } from "@/lib/db";
import { chatMessages, memoryItems, users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, asc, eq } from "drizzle-orm";
import { createInteractionMemories, retrieve } from "@/lib/memory";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.userId, session.user.id),
      orderBy: [asc(chatMessages.createdAt)],
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Chat fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(req.url);
    const clearMemory = url.searchParams.get("clearMemory") === "true";

    await db.delete(chatMessages).where(eq(chatMessages.userId, session.user.id));

    if (clearMemory) {
      await db.delete(memoryItems).where(and(eq(memoryItems.userId, session.user.id), eq(memoryItems.pinned, false)));
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Chat clear error:", error);
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

    if (!Array.isArray(currentMessages) || currentMessages.length === 0) {
      return NextResponse.json({ error: "Messages are required" }, { status: 400 });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.user.id),
      with: {
        intake: true,
        chatMessages: {
          orderBy: [asc(chatMessages.createdAt)],
          limit: 120,
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
    await db.insert(chatMessages).values({
      userId: session.user.id,
      role: "user",
      content: lastUserMessage.content
    });

    const memoryContext = await retrieve({
      userId: session.user.id,
      query: lastUserMessage.content,
      limit: 8,
    });

    const reply = await chatWithMya([...history, lastUserMessage], user?.intake, {
      role: session.user.role,
      name: user?.name,
      email: user?.email,
    }, memoryContext);

    await createInteractionMemories(session.user.id, lastUserMessage.content, reply.content);

    // Save assistant reply to DB
    await db.insert(chatMessages).values({
      userId: session.user.id,
      role: "assistant",
      content: reply.content
    });

    return NextResponse.json(reply);
  } catch (error) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
