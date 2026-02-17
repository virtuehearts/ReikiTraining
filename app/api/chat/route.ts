import { chatWithMya } from "@/lib/openrouter";
import { db } from "@/lib/db";
import { chatMessages, memoryItems, users } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { and, asc, eq, gte, sql } from "drizzle-orm";
import { createInteractionMemories, retrieve } from "@/lib/memory";

function normalizeAssistantReply(text: string) {
  const collapsed = text
    .replace(/[\r\n]+/g, " ")
    .replace(/\*+/g, "")
    .replace(/[•◦▪▫→]/g, "")
    .replace(/[—–]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  return collapsed.length > 500 ? `${collapsed.slice(0, 497).trimEnd()}...` : collapsed;
}

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

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    const [minuteUsage] = await db
      .select({ count: sql<number>`count(*)` })
      .from(chatMessages)
      .where(
        and(
          eq(chatMessages.userId, session.user.id),
          eq(chatMessages.role, "user"),
          gte(chatMessages.createdAt, oneMinuteAgo)
        )
      );

    if ((minuteUsage?.count || 0) >= 20) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait before sending more messages." },
        { status: 429 }
      );
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

    const history = user?.chatMessages.map(m => ({
      role: m.role,
      content: m.content
    })) || [];

    const lastUserMessage = currentMessages[currentMessages.length - 1];

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

    const normalizedContent = normalizeAssistantReply(reply.content || "");
    const normalizedReply = {
      ...reply,
      content: normalizedContent,
    };

    await createInteractionMemories(session.user.id, lastUserMessage.content, normalizedContent);

    await db.insert(chatMessages).values({
      userId: session.user.id,
      role: "assistant",
      content: normalizedContent
    });

    return NextResponse.json(normalizedReply);
  } catch (error) {
    console.error("Chat error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
