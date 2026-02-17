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

export default function MemoryConsole({
  initialData,
  initialRetentionDays,
}: {
  initialData: { memories: MemoryRow[]; events: MemoryEvent[]; userId?: string };
  initialRetentionDays: number;
}) {
  const [rows, setRows] = useState(initialData.memories);
  const [events, setEvents] = useState(initialData.events);
  const [lookup, setLookup] = useState("");
  const [query, setQuery] = useState("");
  const [retentionDays, setRetentionDays] = useState(initialRetentionDays);

  const refresh = async () => {
    const params = new URLSearchParams();
    if (lookup) params.set("user", lookup);
    if (query) params.set("q", query);

    const res = await fetch(`/api/admin/memory?${params.toString()}`);
    if (!res.ok) return;
    const data = await res.json();
    setRows(data.memories || []);
    setEvents(data.events || []);
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

  const onForgetUser = async () => {
    const userId = window.prompt("Enter exact userId to forget");
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

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-primary/10 bg-card p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <input className="rounded-xl border border-primary/20 bg-background p-2" placeholder="User email/name/id" value={lookup} onChange={(e) => setLookup(e.target.value)} />
          <input className="rounded-xl border border-primary/20 bg-background p-2" placeholder="Content search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <button className="rounded-xl bg-primary/20 p-2" onClick={refresh}>Search</button>
          <button className="rounded-xl bg-primary/10 p-2" onClick={onForgetUser}>Forget User Memories</button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-4 space-y-3">
        <h2 className="font-semibold text-accent">Retention Policy</h2>
        <div className="flex items-center gap-2">
          <input type="number" min={7} max={365} className="w-28 rounded-xl border border-primary/20 bg-background p-2" value={retentionDays} onChange={(e) => setRetentionDays(Number(e.target.value))} />
          <button className="rounded-xl bg-primary/20 px-3 py-2" onClick={onRetentionUpdate}>Set days</button>
        </div>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="font-semibold text-accent">User Memory View</h2>
          <a
            className="text-xs underline"
            href={`data:application/json;charset=utf-8,${encodeURIComponent(exportBlob)}`}
            download="memory-export.json"
          >
            Export JSON
          </a>
        </div>
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="rounded-xl border border-primary/10 p-3 text-sm">
              <p>{row.content}</p>
              <p className="mt-1 text-xs text-foreground-muted">{row.type} · {row.scope} · confidence {row.confidence} · {row.user?.email || row.userId || "global"}</p>
              <div className="mt-2 flex gap-2">
                <button className="rounded bg-primary/15 px-2 py-1" onClick={() => onPinToggle(row.id, row.pinned)}>{row.pinned ? "Unpin" : "Pin"}</button>
                <button className="rounded bg-primary/15 px-2 py-1" onClick={() => onEdit(row)}>Edit</button>
                <button className="rounded bg-red-500/20 px-2 py-1" onClick={() => onDelete(row.id, row.userId)}>Delete</button>
              </div>
            </div>
          ))}
          {rows.length === 0 && <p className="text-sm text-foreground-muted">No memories matched your filters.</p>}
        </div>
      </div>

      <div className="rounded-2xl border border-primary/10 bg-card p-4">
        <h2 className="mb-2 font-semibold text-accent">Audit Log</h2>
        <div className="space-y-2 text-xs">
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
