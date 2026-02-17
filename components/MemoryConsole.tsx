"use client";

import { useMemo, useState } from "react";

type MemoryRow = {
  id: string;
  userId: string | null;
  content: string;
  scope: string;
  type: string;
  tags: string[];
  confidence: number;
  pinned: boolean;
  expiresAt: string | Date | null;
  updatedAt: string | Date;
  createdAt?: string | Date;
  user?: { id: string; email: string | null; name: string | null } | null;
};

type MemoryEvent = {
  id: string;
  action: string;
  createdAt: string | Date;
  details: Record<string, unknown>;
  actor?: { email: string | null; name: string | null } | null;
  targetUser?: { email: string | null; name: string | null } | null;
};

type MatchedUser = { id: string; email: string | null; name: string | null };

const CATEGORY_CONFIG = [
  { key: "all", label: "All memories" },
  { key: "goal", label: "Goals" },
  { key: "preference", label: "Learning style" },
  { key: "progress", label: "Progress" },
  { key: "lesson_issue", label: "Friction" },
] as const;

type CategoryKey = typeof CATEGORY_CONFIG[number]["key"];

export default function MemoryConsole({
  initialData,
  initialRetentionDays,
}: {
  initialData: { memories: MemoryRow[]; events: MemoryEvent[]; userId?: string; matchedUsers?: MatchedUser[] };
  initialRetentionDays: number;
}) {
  const [rows, setRows] = useState(initialData.memories);
  const [events, setEvents] = useState(initialData.events);
  const [lookup, setLookup] = useState("");
  const [query, setQuery] = useState("");
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>(initialData.matchedUsers || []);
  const [selectedMemoryId, setSelectedMemoryId] = useState<string | null>(initialData.memories[0]?.id ?? null);
  const [retentionDays, setRetentionDays] = useState(initialRetentionDays);
  const [typeFilter, setTypeFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [pinnedFilter, setPinnedFilter] = useState("");
  const [expiredFilter, setExpiredFilter] = useState("");
  const [category, setCategory] = useState<CategoryKey>("all");

  const refresh = async () => {
    const params = new URLSearchParams();
    if (lookup) params.set("user", lookup);
    if (query) params.set("q", query);
    if (typeFilter) params.set("type", typeFilter);
    if (scopeFilter) params.set("scope", scopeFilter);
    if (pinnedFilter) params.set("pinned", pinnedFilter);
    if (expiredFilter) params.set("expired", expiredFilter);

    const res = await fetch(`/api/admin/memory?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.memories || []);
    setEvents(data.events || []);
    setMatchedUsers(data.matchedUsers || []);
    setSelectedMemoryId(data.memories?.[0]?.id || null);
  };

  const onPinToggle = async (id: string, pinned: boolean) => {
    await fetch("/api/admin/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, pinned: !pinned }),
    });
    await refresh();
  };

  const onDelete = async (id: string, userId?: string | null) => {
    await fetch("/api/admin/memory", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, userId }),
    });
    await refresh();
  };

  const onEdit = async (row: MemoryRow) => {
    const content = window.prompt("Edit memory content", row.content);
    if (!content) return;
    await fetch("/api/admin/memory", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: row.id, content }),
    });
    await refresh();
  };

  const onRetentionUpdate = async () => {
    await fetch("/api/admin/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "setRetention", days: retentionDays }),
    });
    await refresh();
  };

  const onForgetUser = async (explicitUserId?: string) => {
    const userId = explicitUserId || window.prompt("Enter exact userId to forget");
    if (!userId) return;
    const includePinned = window.confirm("Delete pinned memories too? Press Cancel to keep pinned memories.");

    await fetch("/api/admin/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "forgetUser", userId, includePinned }),
    });
    await refresh();
  };

  const exportBlob = useMemo(() => JSON.stringify({ rows, events }, null, 2), [rows, events]);

  const selectedMemory = rows.find((row) => row.id === selectedMemoryId) || rows[0] || null;
  const selectedUserId = selectedMemory?.userId || matchedUsers[0]?.id;

  const visibleRows = useMemo(() => {
    if (category === "all") return rows;
    return rows.filter((row) => row.type === category || row.tags.includes(category));
  }, [category, rows]);

  const categoryCounts = useMemo(
    () => CATEGORY_CONFIG.reduce<Record<string, number>>((acc, item) => {
      acc[item.key] = item.key === "all"
        ? rows.length
        : rows.filter((row) => row.type === item.key || row.tags.includes(item.key)).length;
      return acc;
    }, {}),
    [rows]
  );

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-primary/10 bg-card p-4">
        <div className="grid gap-3 md:grid-cols-12">
          <input className="md:col-span-4 rounded-xl border border-primary/20 bg-background p-2" placeholder="Search user by email, username, or id" value={lookup} onChange={(e) => setLookup(e.target.value)} />
          <input className="md:col-span-3 rounded-xl border border-primary/20 bg-background p-2" placeholder="Search memory text" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className="md:col-span-2 rounded-xl border border-primary/20 bg-background p-2" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All types</option>
            <option value="goal">Goal</option>
            <option value="preference">Preference</option>
            <option value="progress">Progress</option>
            <option value="lesson_issue">Lesson issue</option>
            <option value="note">Note</option>
          </select>
          <select className="md:col-span-1 rounded-xl border border-primary/20 bg-background p-2" value={scopeFilter} onChange={(e) => setScopeFilter(e.target.value)}>
            <option value="">Scope</option>
            <option value="user">User</option>
            <option value="global">Global</option>
          </select>
          <select className="md:col-span-1 rounded-xl border border-primary/20 bg-background p-2" value={pinnedFilter} onChange={(e) => setPinnedFilter(e.target.value)}>
            <option value="">Pin</option>
            <option value="true">Pinned</option>
            <option value="false">Unpinned</option>
          </select>
          <select className="md:col-span-1 rounded-xl border border-primary/20 bg-background p-2" value={expiredFilter} onChange={(e) => setExpiredFilter(e.target.value)}>
            <option value="">TTL</option>
            <option value="false">Active</option>
            <option value="true">Expired</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <button className="rounded-xl bg-primary/20 px-3 py-2 text-sm" onClick={refresh}>Search</button>
          <button className="rounded-xl bg-primary/10 px-3 py-2 text-sm" onClick={() => onForgetUser(selectedUserId)}>Forget selected user</button>
          <button className="rounded-xl bg-red-500/20 px-3 py-2 text-sm" onClick={() => onForgetUser()}>Forget by userId</button>
        </div>
        {!!matchedUsers.length && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-foreground-muted">
            {matchedUsers.slice(0, 6).map((user) => (
              <button key={user.id} onClick={() => onForgetUser(user.id)} className="rounded-full border border-primary/20 px-2 py-1 hover:bg-primary/10">
                {user.name || user.email || user.id}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <div className="space-y-3 rounded-2xl border border-primary/10 bg-card p-4 md:col-span-1">
          <h2 className="font-semibold text-accent">Categories</h2>
          {CATEGORY_CONFIG.map((item) => (
            <button
              key={item.key}
              onClick={() => setCategory(item.key)}
              className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm ${category === item.key ? "border-accent bg-primary/15" : "border-primary/10"}`}
            >
              <span>{item.label}</span>
              <span className="text-xs text-foreground-muted">{categoryCounts[item.key]}</span>
            </button>
          ))}
          <div className="rounded-xl border border-primary/10 p-3 text-xs text-foreground-muted">
            Retention is model-agnostic and enforced in SQLite, so memory behavior survives OpenRouter model changes.
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-primary/10 bg-card p-4 md:col-span-2">
          <div className="mb-1 flex items-center justify-between">
            <h2 className="font-semibold text-accent">Memory list</h2>
            <a
              className="text-xs underline"
              href={`data:application/json;charset=utf-8,${encodeURIComponent(exportBlob)}`}
              download="memory-export.json"
            >
              Export JSON
            </a>
          </div>
          <div className="max-h-[440px] space-y-2 overflow-y-auto pr-1">
            {visibleRows.map((row) => (
              <button key={row.id} onClick={() => setSelectedMemoryId(row.id)} className={`w-full rounded-xl border p-3 text-left text-sm ${selectedMemoryId === row.id ? "border-accent bg-primary/10" : "border-primary/10"}`}>
                <p className="line-clamp-2">{row.content}</p>
                <p className="mt-1 text-xs text-foreground-muted">{row.type} · {row.scope} · {row.user?.email || row.userId || "global"}</p>
              </button>
            ))}
            {visibleRows.length === 0 && <p className="text-sm text-foreground-muted">No memories matched your filters.</p>}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-primary/10 bg-card p-4 md:col-span-2">
          <h2 className="font-semibold text-accent">Memory detail</h2>
          {selectedMemory ? (
            <>
              <div className="rounded-xl border border-primary/10 p-3 text-sm">
                <p>{selectedMemory.content}</p>
                <p className="mt-2 text-xs text-foreground-muted">Type: {selectedMemory.type} · Scope: {selectedMemory.scope}</p>
                <p className="text-xs text-foreground-muted">Confidence: {selectedMemory.confidence} · Updated: {new Date(selectedMemory.updatedAt).toLocaleString()}</p>
                <p className="text-xs text-foreground-muted">Tags: {selectedMemory.tags.join(", ") || "none"}</p>
                <p className="text-xs text-foreground-muted">Expires: {selectedMemory.expiresAt ? new Date(selectedMemory.expiresAt).toLocaleString() : "retained"}</p>
              </div>
              <div className="flex flex-wrap gap-2 text-sm">
                <button className="rounded bg-primary/15 px-2 py-1" onClick={() => onPinToggle(selectedMemory.id, selectedMemory.pinned)}>{selectedMemory.pinned ? "Unpin" : "Pin"}</button>
                <button className="rounded bg-primary/15 px-2 py-1" onClick={() => onEdit(selectedMemory)}>Edit</button>
                <button className="rounded bg-red-500/20 px-2 py-1" onClick={() => onDelete(selectedMemory.id, selectedMemory.userId)}>Delete</button>
              </div>
            </>
          ) : <p className="text-sm text-foreground-muted">Select a memory to inspect details.</p>}

          <div className="rounded-2xl border border-primary/10 bg-card p-4 space-y-3">
            <h3 className="font-semibold text-accent">Retention policy</h3>
            <div className="flex items-center gap-2">
              <input type="number" min={7} max={365} className="w-28 rounded-xl border border-primary/20 bg-background p-2" value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
              <button className="rounded-xl bg-primary/20 px-3 py-2" onClick={onRetentionUpdate}>Set days</button>
            </div>
            <p className="text-xs text-foreground-muted">Default retention target: 90 days.</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-4">
        <h2 className="mb-2 font-semibold text-accent">Audit log</h2>
        <div className="max-h-56 space-y-2 overflow-y-auto text-xs">
          {events.map((event) => (
            <div key={event.id} className="rounded border border-primary/10 p-2">
              <p>{event.action} · {new Date(event.createdAt).toLocaleString()} · {event.actor?.email || "system"} · {event.targetUser?.email || "n/a"}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
