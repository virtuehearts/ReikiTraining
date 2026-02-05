import { chatWithMya } from "@/lib/openrouter";
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

    const { messages } = await req.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { intake: true },
    });

    const reply = await chatWithMya(messages, user?.intake);

    return NextResponse.json(reply);
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
