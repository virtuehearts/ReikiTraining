import { authOptions } from "@/lib/auth";
import { deleteMemoryItemAdmin, searchMemoryConsole } from "@/lib/memory";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await searchMemoryConsole({ scope: "global" });
  return NextResponse.json(data.memories);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN" || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, userId } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Memory id is required" }, { status: 400 });
  }

  await deleteMemoryItemAdmin(id, session.user.id, userId || null);
  return NextResponse.json({ ok: true });
}
