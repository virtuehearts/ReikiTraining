import { db } from "@/lib/db";
import { aiSettings as aiSettingsTable } from "@/lib/schema";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { OPENROUTER_MODEL } from "@/lib/ai-model";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [settings] = await db.select().from(aiSettingsTable).where(eq(aiSettingsTable.id, "default")).limit(1);

    if (!settings) {
      return NextResponse.json(null);
    }

    return NextResponse.json({ ...settings, model: settings.model || OPENROUTER_MODEL });
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
    const model = typeof body.model === "string" && body.model.trim().length > 0
      ? body.model.trim()
      : OPENROUTER_MODEL;

    const [settings] = await db.insert(aiSettingsTable)
      .values({
        id: "default",
        systemPrompt: body.systemPrompt,
        model,
        temperature: parseFloat(body.temperature),
        topP: parseFloat(body.topP),
        maxContextMessages: Math.max(5, parseInt(body.maxContextMessages, 10) || 40),
        enableMemory: body.enableMemory !== false,
        openrouterApiKey: body.openrouterApiKey,
      })
      .onConflictDoUpdate({
        target: [aiSettingsTable.id],
        set: {
          systemPrompt: body.systemPrompt,
          model,
          temperature: parseFloat(body.temperature),
          topP: parseFloat(body.topP),
          maxContextMessages: Math.max(5, parseInt(body.maxContextMessages, 10) || 40),
          enableMemory: body.enableMemory !== false,
          openrouterApiKey: body.openrouterApiKey,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("AI Settings update error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
