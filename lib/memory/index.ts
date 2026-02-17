import "server-only";

import { db } from "@/lib/db";
import { memoryConfig, memoryEvents, memoryItems, users } from "@/lib/schema";
import { and, asc, desc, eq, gte, inArray, isNull, like, or, sql } from "drizzle-orm";

export type MemoryScope = "user" | "global";
export type MemoryType = "preference" | "goal" | "progress" | "lesson_issue" | "note";
export type MemorySource = "chat" | "quiz" | "journal" | "admin";

const DEFAULT_RETENTION_DAYS = 90;
const MIN_RETENTION_DAYS = 7;
const MAX_RETENTION_DAYS = 365;
const MAX_CONTENT_LENGTH = 360;
const SENSITIVE_PATTERNS = [
  /\b(sex|sexual|nude|intimate|porn)\b/i,
  /\b(hiv|std|sti|cancer|pregnan|diagnos|medication|prescription|ssn|social security|credit card)\b/i,
];

export function sanitizeMemoryContent(content: string) {
  return content
    .trim()
    .replace(/\s+/g, " ")
    .replace(/^[-*\d.)\s]+/, "")
    .slice(0, MAX_CONTENT_LENGTH);
}

export function scoreMemoryItem(memory: typeof memoryItems.$inferSelect, query: string) {
  const now = Date.now();
  const queryTerms = query.toLowerCase().split(/\W+/).filter(Boolean);
  const haystack = `${memory.content} ${memory.tags}`.toLowerCase();
  const matchCount = queryTerms.reduce((acc, term) => acc + (haystack.includes(term) ? 1 : 0), 0);

  const createdAtTs = memory.createdAt ? new Date(memory.createdAt).getTime() : now;
  const usedAtTs = memory.lastUsedAt ? new Date(memory.lastUsedAt).getTime() : createdAtTs;
  const recencyHours = Math.max(1, (now - usedAtTs) / (1000 * 60 * 60));
  const recencyScore = Math.max(1, 50 - Math.log(recencyHours));

  return (
    (memory.pinned ? 200 : 0) +
    matchCount * 30 +
    recencyScore +
    Math.max(0, Math.min(100, memory.confidence || 60))
  );
}

const seemsSensitive = (text: string) => SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));

const normalizeTags = (tags?: string[] | string) => {
  if (!tags) return [] as string[];
  if (Array.isArray(tags)) return tags.map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 8);
  return tags.split(",").map((tag) => tag.trim().toLowerCase()).filter(Boolean).slice(0, 8);
};

const parseTags = (value: string | null) => {
  if (!value) return [] as string[];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

async function createMemoryEvent(params: {
  actorId?: string | null;
  userId?: string | null;
  action: "create" | "update" | "delete" | "pin" | "unpin" | "forget_user" | "retention_change";
  details?: Record<string, unknown>;
}) {
  await db.insert(memoryEvents).values({
    actorId: params.actorId || null,
    userId: params.userId || null,
    action: params.action,
    details: JSON.stringify(params.details || {}),
  });
}

export async function getRetentionPolicyDays() {
  const config = await db.query.memoryConfig.findFirst({ where: eq(memoryConfig.id, "default") });
  return config?.retentionDays ?? DEFAULT_RETENTION_DAYS;
}

export async function setRetentionPolicy(days: number, actorId?: string) {
  const normalizedDays = Math.max(MIN_RETENTION_DAYS, Math.min(MAX_RETENTION_DAYS, Math.round(days)));
  const existing = await db.query.memoryConfig.findFirst({ where: eq(memoryConfig.id, "default") });

  if (existing) {
    await db.update(memoryConfig).set({ retentionDays: normalizedDays, updatedAt: new Date() }).where(eq(memoryConfig.id, "default"));
  } else {
    await db.insert(memoryConfig).values({ id: "default", retentionDays: normalizedDays });
  }

  await createMemoryEvent({
    actorId,
    action: "retention_change",
    details: { retentionDays: normalizedDays },
  });

  return normalizedDays;
}

export async function memorize(params: {
  userId?: string | null;
  actorId?: string | null;
  scope: MemoryScope;
  type: MemoryType;
  content: string;
  tags?: string[] | string;
  confidence?: number;
  source?: MemorySource;
}) {
  const cleaned = sanitizeMemoryContent(params.content);
  if (cleaned.length < 12 || seemsSensitive(cleaned)) return null;

  const tags = normalizeTags(params.tags);
  const confidence = Math.max(0, Math.min(100, Math.round(params.confidence ?? 60)));

  const existing = await db.query.memoryItems.findMany({
    where: and(
      params.scope === "global" ? isNull(memoryItems.userId) : eq(memoryItems.userId, params.userId ?? ""),
      eq(memoryItems.scope, params.scope),
      eq(memoryItems.type, params.type),
      or(eq(memoryItems.content, cleaned), like(memoryItems.content, `%${cleaned.slice(0, 40)}%`))
    ),
    limit: 5,
  });

  const dedupeMatch = existing.find((item) => {
    const one = new Set(item.content.toLowerCase().split(/\W+/).filter(Boolean));
    const two = new Set(cleaned.toLowerCase().split(/\W+/).filter(Boolean));
    const intersection = [...one].filter((x) => two.has(x)).length;
    return intersection / Math.max(one.size, two.size, 1) >= 0.7;
  });

  const retentionDays = await getRetentionPolicyDays();
  const expiresAt = dedupeMatch?.pinned
    ? null
    : new Date(Date.now() + retentionDays * 24 * 60 * 60 * 1000);

  if (dedupeMatch) {
    await db.update(memoryItems).set({
      content: cleaned,
      tags: JSON.stringify(tags),
      confidence,
      source: params.source ?? "chat",
      updatedAt: new Date(),
      expiresAt,
    }).where(eq(memoryItems.id, dedupeMatch.id));

    await createMemoryEvent({
      actorId: params.actorId,
      userId: params.userId,
      action: "update",
      details: { memoryItemId: dedupeMatch.id, deduped: true },
    });

    return dedupeMatch.id;
  }

  const [inserted] = await db.insert(memoryItems).values({
    userId: params.scope === "global" ? null : params.userId,
    scope: params.scope,
    type: params.type,
    content: cleaned,
    tags: JSON.stringify(tags),
    confidence,
    source: params.source ?? "chat",
    expiresAt,
  }).returning();

  await createMemoryEvent({
    actorId: params.actorId,
    userId: params.userId,
    action: "create",
    details: { memoryItemId: inserted.id, type: params.type, scope: params.scope },
  });

  return inserted.id;
}

export async function retrieve(params: { userId: string; query: string; limit?: number }) {
  const now = new Date();
  const rows = await db.query.memoryItems.findMany({
    where: and(
      or(eq(memoryItems.userId, params.userId), and(eq(memoryItems.scope, "global"), isNull(memoryItems.userId))),
      or(isNull(memoryItems.expiresAt), gte(memoryItems.expiresAt, now))
    ),
    limit: 100,
  });

  const ranked = rows
    .map((item) => ({ ...item, score: scoreMemoryItem(item, params.query) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, params.limit ?? 8);

  if (ranked.length) {
    await db.update(memoryItems)
      .set({ lastUsedAt: now, updatedAt: now })
      .where(inArray(memoryItems.id, ranked.map((row) => row.id)));
  }

  return ranked.map((row) => ({
    ...row,
    tags: parseTags(row.tags),
  }));
}

export async function forgetUserMemories(userId: string, options?: { includePinned?: boolean; actorId?: string }) {
  const includePinned = !!options?.includePinned;
  const whereClause = includePinned
    ? eq(memoryItems.userId, userId)
    : and(eq(memoryItems.userId, userId), eq(memoryItems.pinned, false));

  const rows = await db.query.memoryItems.findMany({ where: whereClause, columns: { id: true } });
  if (rows.length) {
    await db.delete(memoryItems).where(inArray(memoryItems.id, rows.map((row) => row.id)));
  }

  await createMemoryEvent({
    actorId: options?.actorId,
    userId,
    action: "forget_user",
    details: { includePinned, count: rows.length },
  });

  return rows.length;
}

export async function createInteractionMemories(userId: string, userMessage: string, assistantMessage: string) {
  const combined = `${userMessage} ${assistantMessage}`.toLowerCase();
  const candidates: Array<{ type: MemoryType; content: string; tags: string[]; confidence: number }> = [];

  if (/(i prefer|please use|can you format|bullet|short answers?)/i.test(userMessage)) {
    candidates.push({
      type: "preference",
      content: `User preference: ${sanitizeMemoryContent(userMessage)}`,
      tags: ["format", "tone"],
      confidence: 72,
    });
  }

  const goalMatch = userMessage.match(/(?:my goal is|i want to|i need to|help me)\s+([^.!?]{12,120})/i);
  if (goalMatch?.[1]) {
    candidates.push({
      type: "goal",
      content: `User goal: ${sanitizeMemoryContent(goalMatch[1])}`,
      tags: ["goal"],
      confidence: 76,
    });
  }

  const nameMatch = userMessage.match(/(?:my name is|i am|i'm|call me)\s+([a-z][a-z\s'-]{1,40})/i);
  if (nameMatch?.[1]) {
    candidates.push({
      type: "profile",
      content: `User preferred name: ${sanitizeMemoryContent(nameMatch[1])}`,
      tags: ["name", "profile"],
      confidence: 85,
    });
  }

  if (/(confus|struggl|not sure|don't understand|hard for me)/i.test(combined)) {
    candidates.push({
      type: "lesson_issue",
      content: `Learning friction: ${sanitizeMemoryContent(userMessage)}`,
      tags: ["difficulty"],
      confidence: 68,
    });
  } else {
    candidates.push({
      type: "progress",
      content: `Recent progress checkpoint: ${sanitizeMemoryContent(userMessage)}`,
      tags: ["progress"],
      confidence: 62,
    });
  }

  for (const candidate of candidates.slice(0, 3)) {
    await memorize({
      userId,
      scope: "user",
      type: candidate.type,
      content: candidate.content,
      tags: candidate.tags,
      confidence: candidate.confidence,
      source: "chat",
    });
  }
}

export async function searchMemoryConsole(params: {
  userLookup?: string;
  contentQuery?: string;
  type?: string;
  pinned?: string;
  expired?: string;
  scope?: string;
}) {
  const lookup = params.userLookup?.trim();
  let userId: string | undefined;
  let matchedUsers: Array<{ id: string; email: string | null; name: string | null }> = [];

  if (lookup) {
    matchedUsers = await db.query.users.findMany({
      where: or(eq(users.id, lookup), like(users.email, `%${lookup}%`), like(users.name, `%${lookup}%`)),
      columns: { id: true, email: true, name: true },
      limit: 20,
    });
    userId = matchedUsers[0]?.id;
  }

  const now = new Date();
  const queryParts = [];

  if (lookup) {
    if (!matchedUsers.length) {
      return { userId: undefined, matchedUsers: [], memories: [], events: [] };
    }
    queryParts.push(inArray(memoryItems.userId, matchedUsers.map((user) => user.id)));
  }
  if (params.contentQuery) queryParts.push(like(memoryItems.content, `%${params.contentQuery.trim()}%`));
  if (params.type) queryParts.push(eq(memoryItems.type, params.type));
  if (params.scope) queryParts.push(eq(memoryItems.scope, params.scope));
  if (params.pinned === "true") queryParts.push(eq(memoryItems.pinned, true));
  if (params.pinned === "false") queryParts.push(eq(memoryItems.pinned, false));
  if (params.expired === "true") queryParts.push(and(sql`${memoryItems.expiresAt} IS NOT NULL`, sql`${memoryItems.expiresAt} < ${now}`));
  if (params.expired === "false") queryParts.push(or(isNull(memoryItems.expiresAt), gte(memoryItems.expiresAt, now)));

  const memories = await db.query.memoryItems.findMany({
    where: queryParts.length ? and(...queryParts) : undefined,
    orderBy: [desc(memoryItems.pinned), desc(memoryItems.updatedAt), asc(memoryItems.content)],
    limit: 150,
    with: { user: { columns: { id: true, email: true, name: true } } },
  });

  const events = await db.query.memoryEvents.findMany({
    orderBy: [desc(memoryEvents.createdAt)],
    limit: 100,
    with: {
      actor: { columns: { id: true, email: true, name: true } },
      targetUser: { columns: { id: true, email: true, name: true } },
    },
  });

  return {
    userId,
    matchedUsers,
    memories: memories.map((memory) => ({ ...memory, tags: parseTags(memory.tags) })),
    events: events.map((event) => ({
      ...event,
      details: (() => {
        try {
          return JSON.parse(event.details);
        } catch {
          return {};
        }
      })(),
    })),
  };
}

export async function updateMemoryItemAdmin(params: {
  id: string;
  actorId: string;
  content?: string;
  type?: MemoryType;
  pinned?: boolean;
  confidence?: number;
  tags?: string[];
}) {
  const patch: Record<string, unknown> = { updatedAt: new Date() };
  if (params.content !== undefined) patch.content = sanitizeMemoryContent(params.content);
  if (params.type !== undefined) patch.type = params.type;
  if (params.pinned !== undefined) {
    patch.pinned = params.pinned;
    if (params.pinned) patch.expiresAt = null;
  }
  if (params.confidence !== undefined) patch.confidence = Math.max(0, Math.min(100, Math.round(params.confidence)));
  if (params.tags !== undefined) patch.tags = JSON.stringify(normalizeTags(params.tags));

  await db.update(memoryItems).set(patch).where(eq(memoryItems.id, params.id));
  await createMemoryEvent({
    actorId: params.actorId,
    action: params.pinned === undefined ? "update" : params.pinned ? "pin" : "unpin",
    details: { memoryItemId: params.id, fields: Object.keys(patch) },
  });
}

export async function deleteMemoryItemAdmin(id: string, actorId: string, userId?: string | null) {
  await db.delete(memoryItems).where(eq(memoryItems.id, id));
  await createMemoryEvent({ actorId, userId, action: "delete", details: { memoryItemId: id } });
}
