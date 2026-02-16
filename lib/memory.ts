import { db } from "@/lib/db";
import { coreMemories, userMemories } from "@/lib/schema";
import { and, asc, desc, eq, like, or } from "drizzle-orm";

const MEMORY_MAX_LENGTH = 320;

const normalizeMemory = (value: string) =>
  value
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[-*\d.)\s]+/, "")
    .slice(0, MEMORY_MAX_LENGTH);

const extractPotentialMemories = (text: string) => {
  const chunks = text
    .split(/(?<=[.!?])\s+/)
    .map((line) => line.trim())
    .filter(Boolean);

  return chunks.filter((line) => {
    const lower = line.toLowerCase();
    return ["i am", "i'm", "my goal", "i need", "i prefer", "i struggle", "i feel", "i want"].some((needle) => lower.includes(needle));
  });
};

export async function updateUserMemories(userId: string, userMessage: string) {
  const candidates = extractPotentialMemories(userMessage).map(normalizeMemory).slice(0, 3);

  for (const memory of candidates) {
    const existing = await db.query.userMemories.findFirst({
      where: and(eq(userMemories.userId, userId), eq(userMemories.memory, memory)),
    });

    if (existing) {
      await db
        .update(userMemories)
        .set({ updatedAt: new Date() })
        .where(eq(userMemories.id, existing.id));
      continue;
    }

    await db.insert(userMemories).values({ userId, memory, source: "chat" });
  }

  const staleMemories = await db.query.userMemories.findMany({
    where: eq(userMemories.userId, userId),
    orderBy: [desc(userMemories.updatedAt)],
    offset: 50,
  });

  for (const stale of staleMemories) {
    await db.delete(userMemories).where(eq(userMemories.id, stale.id));
  }
}

export async function saveCoreMemoryFromAdmin(adminUserId: string, text: string) {
  const memory = normalizeMemory(text);

  if (memory.length < 15) return;

  const existing = await db.query.coreMemories.findFirst({
    where: or(eq(coreMemories.memory, memory), like(coreMemories.memory, `%${memory.slice(0, 30)}%`)),
  });

  if (existing) {
    await db
      .update(coreMemories)
      .set({ updatedAt: new Date(), sourceUserId: adminUserId })
      .where(eq(coreMemories.id, existing.id));
    return;
  }

  await db.insert(coreMemories).values({
    memory,
    sourceUserId: adminUserId,
  });

  const staleCoreMemories = await db.query.coreMemories.findMany({
    orderBy: [desc(coreMemories.updatedAt)],
    offset: 100,
  });

  for (const stale of staleCoreMemories) {
    await db.delete(coreMemories).where(eq(coreMemories.id, stale.id));
  }
}

export async function getMemoryContext(userId: string, limit = 8) {
  const [core, personal] = await Promise.all([
    db.query.coreMemories.findMany({
      orderBy: [desc(coreMemories.updatedAt)],
      limit,
    }),
    db.query.userMemories.findMany({
      where: eq(userMemories.userId, userId),
      orderBy: [desc(userMemories.updatedAt)],
      limit,
    }),
  ]);

  return {
    coreMemories: core.map((item) => item.memory),
    userMemories: personal.map((item) => item.memory),
  };
}

export async function listCoreMemories() {
  return db.query.coreMemories.findMany({
    orderBy: [desc(coreMemories.updatedAt), asc(coreMemories.createdAt)],
    limit: 100,
  });
}

export async function deleteCoreMemory(memoryId: string) {
  await db.delete(coreMemories).where(eq(coreMemories.id, memoryId));
}
