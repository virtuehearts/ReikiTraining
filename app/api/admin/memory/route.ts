import { authOptions } from "@/lib/auth";
import { deleteMemoryItemAdmin, forgetUserMemories, searchMemoryConsole, setRetentionPolicy, updateMemoryItemAdmin } from "@/lib/memory";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" || !session.user.id) {
    return null;
  }
  return session.user;
}

export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const data = await searchMemoryConsole({
    userLookup: searchParams.get("user") || undefined,
    contentQuery: searchParams.get("q") || undefined,
    type: searchParams.get("type") || undefined,
    pinned: searchParams.get("pinned") || undefined,
    expired: searchParams.get("expired") || undefined,
    scope: searchParams.get("scope") || undefined,
  });

  return NextResponse.json(data);
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body?.id) return NextResponse.json({ error: "Memory id is required" }, { status: 400 });

  await updateMemoryItemAdmin({
    id: body.id,
    actorId: admin.id,
    content: body.content,
    type: body.type,
    pinned: typeof body.pinned === "boolean" ? body.pinned : undefined,
    confidence: typeof body.confidence === "number" ? body.confidence : undefined,
    tags: Array.isArray(body.tags) ? body.tags : undefined,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body?.id) return NextResponse.json({ error: "Memory id is required" }, { status: 400 });

  await deleteMemoryItemAdmin(body.id, admin.id, body.userId || null);
  return NextResponse.json({ ok: true });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (body.action === "setRetention") {
    const retentionDays = await setRetentionPolicy(Number(body.days), admin.id);
    return NextResponse.json({ ok: true, retentionDays });
  }

  if (body.action === "forgetUser") {
    if (!body.userId) return NextResponse.json({ error: "userId is required" }, { status: 400 });
    const count = await forgetUserMemories(body.userId, {
      includePinned: !!body.includePinned,
      actorId: admin.id,
    });
    return NextResponse.json({ ok: true, deleted: count });
  }

  return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
}
