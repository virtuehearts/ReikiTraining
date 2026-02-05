import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.aISettings.findUnique({
      where: { id: "default" },
    });

    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const settings = await prisma.aISettings.upsert({
      where: { id: "default" },
      update: {
        systemPrompt: body.systemPrompt,
        model: body.model,
        temperature: parseFloat(body.temperature),
        topP: parseFloat(body.topP),
      },
      create: {
        id: "default",
        systemPrompt: body.systemPrompt,
        model: body.model,
        temperature: parseFloat(body.temperature),
        topP: parseFloat(body.topP),
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("AI Settings update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
