import { authOptions } from "@/lib/auth";
import { deleteCoreMemory, listCoreMemories } from "@/lib/memory";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memories = await listCoreMemories();
  return NextResponse.json(memories);
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Memory id is required" }, { status: 400 });
  }

  await deleteCoreMemory(id);
  return NextResponse.json({ ok: true });
}
