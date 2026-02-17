"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { OPENROUTER_MODEL } from "@/lib/ai-model";
import {
  Users,
  Settings,
  MessageSquare,
  Send,
  CheckCircle,
  XCircle,
  Shield,
  UserCheck,
  CalendarClock,
  Ban,
  Sparkles,
  Eye,
  ClipboardList,
} from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  image?: string | null;
  createdAt: string;
  updatedAt: string;
  todayRequestCount?: number;
  heavyUser?: boolean;
  intake: {
    age?: number;
    location?: string;
    gender?: string;
    experience?: string;
    goal?: string;
    whyJoined?: string;
    healthConcerns?: string;
    browserType?: string;
    userAgent?: string;
    ipAddress?: string;
  } | null;
}

interface AISettings {
  systemPrompt: string;
  model: string;
  temperature: number;
  topP: number;
  maxContextMessages: number;
  enableMemory: boolean;
  openrouterApiKey?: string;
}

interface CoreMemory {
  id: string;
  memory: string;
  updatedAt: string;
}

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  isBooking: boolean;
  createdAt: string;
  sender?: User;
}

const formatDate = (value: string) => new Date(value).toLocaleString();

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    systemPrompt: "",
    model: OPENROUTER_MODEL,
    temperature: 0.7,
    topP: 1.0,
    maxContextMessages: 40,
    enableMemory: true,
    openrouterApiKey: "",
  });
  const [coreMemories, setCoreMemories] = useState<CoreMemory[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [messageSummaries, setMessageSummaries] = useState<Message[]>([]);
  const [threadMessages, setThreadMessages] = useState<Message[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
    fetchMessages();
    if (activeTab === "ai") {
      fetchAISettings();
      fetchCoreMemories();
    }
  }, [session, status, router, activeTab]);

  useEffect(() => {
    if (!selectedUserId) return;
    fetchThread(selectedUserId);
  }, [selectedUserId]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAISettings = async () => {
    try {
      const res = await fetch("/api/admin/ai-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) setAiSettings({ ...data, model: data.model || OPENROUTER_MODEL });
      }
    } catch {
      console.error("Failed to fetch AI settings");
    }
  };


  const fetchCoreMemories = async () => {
    try {
      const res = await fetch("/api/admin/memories");
      if (res.ok) {
        const data = await res.json();
        setCoreMemories(data);
      }
    } catch {
      console.error("Failed to fetch core memories");
    }
  };

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessageSummaries(data);
      }
    } catch {
      console.error("Failed to fetch messages");
    }
  };

  const fetchThread = async (userId: string) => {
    try {
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(userId)}`);
      if (res.ok) {
        const data = await res.json();
        setThreadMessages(data);
      }
    } catch {
      console.error("Failed to fetch thread");
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const res = await fetch("/api/approve-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, status: newStatus }),
      });

      if (res.ok) {
        setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u)));
      }
    } catch {
      alert("Failed to update status");
    }
  };

  const handleAISave = async () => {
    try {
      const res = await fetch("/api/admin/ai-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(aiSettings),
      });
      if (res.ok) alert("AI Settings updated successfully");
    } catch {
      alert("Failed to update AI settings");
    }
  };

  const handleReply = async (userId: string, isBookingReply = false) => {
    const content = replyContent[userId];
    if (!content?.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, receiverId: userId, isBooking: isBookingReply }),
      });
      if (res.ok) {
        setReplyContent((prev) => ({ ...prev, [userId]: "" }));
        fetchMessages();
        fetchThread(userId);
      }
    } catch {
      alert("Failed to send reply");
    }
  };


  const handleDeleteCoreMemory = async (memoryId: string) => {
    try {
      const res = await fetch("/api/admin/memories", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: memoryId }),
      });

      if (res.ok) {
        setCoreMemories((prev) => prev.filter((item) => item.id !== memoryId));
      }
    } catch {
      alert("Failed to delete core memory");
    }
  };

  const handlePasswordChange = async () => {
    if (newPassword.length < 8) {
      alert("Password must be at least 8 characters");
      return;
    }

    try {
      const res = await fetch("/api/admin/system-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword }),
      });
      if (res.ok) {
        alert("Admin password updated successfully");
        setNewPassword("");
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update password");
      }
    } catch {
      alert("Failed to update password");
    }
  };

  const pendingUsers = useMemo(() => users.filter((u) => u.status === "PENDING"), [users]);
  const bookingRequests = useMemo(() => messageSummaries.filter((m) => m.isBooking), [messageSummaries]);
  const uniqueThreads = useMemo(() => {
    const seen = new Set<string>();
    return messageSummaries.filter((msg) => {
      if (seen.has(msg.senderId)) return false;
      seen.add(msg.senderId);
      return true;
    });
  }, [messageSummaries]);

  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return <div className="min-h-screen bg-background flex items-center justify-center text-accent">Channeling Admin Sanctuary...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <header className="flex flex-wrap justify-between items-center gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-serif text-accent">Admin Operations Panel</h1>
            <p className="text-foreground-muted mt-2">Manage users, registrations, booking requests, and Mya AI controls separately from disciple experience.</p>
          </div>
          <div className="flex items-center gap-3">
            <a href="/admin/memory" className="rounded-lg border border-primary/20 px-3 py-2 text-sm text-accent hover:bg-primary/10">Memory Console</a>
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-primary/20 px-3 py-2 text-sm text-foreground-muted hover:text-accent hover:bg-primary/10"
            >
              Sign Out
            </button>
            <div className="flex flex-wrap bg-background-alt p-1 rounded-xl border border-primary/20">
            {[
              { tab: "overview", icon: <Sparkles size={18} />, label: "Overview" },
              { tab: "users", icon: <Users size={18} />, label: "Users" },
              { tab: "registrations", icon: <UserCheck size={18} />, label: "Registrations" },
              { tab: "messages", icon: <MessageSquare size={18} />, label: "Messages" },
              { tab: "ai", icon: <Settings size={18} />, label: "Mya AI" },
              { tab: "system", icon: <Shield size={18} />, label: "System" },
            ].map(({ tab, icon, label }) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === tab ? "bg-primary text-white shadow-lg" : "text-foreground-muted hover:text-accent"}`}
              >
                {icon}
                <span>{label}</span>
              </button>
            ))}
            </div>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-accent animate-pulse">Channeling data...</div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
            {activeTab === "overview" && (
              <div className="grid md:grid-cols-5 gap-4">
                <div className="bg-background-alt p-5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-foreground-muted">Total Users</p>
                  <p className="text-3xl text-accent font-semibold">{users.length}</p>
                </div>
                <div className="bg-background-alt p-5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-foreground-muted">Pending Registrations</p>
                  <p className="text-3xl text-yellow-400 font-semibold">{pendingUsers.length}</p>
                </div>
                <div className="bg-background-alt p-5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-foreground-muted">Booking Requests</p>
                  <p className="text-3xl text-accent font-semibold">{bookingRequests.length}</p>
                </div>
                <div className="bg-background-alt p-5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-foreground-muted">Disabled Accounts</p>
                  <p className="text-3xl text-red-400 font-semibold">{users.filter((u) => u.status === "DISABLED").length}</p>
                </div>
                <div className="bg-background-alt p-5 rounded-2xl border border-primary/20">
                  <p className="text-sm text-foreground-muted">Heavy Users (today)</p>
                  <p className="text-3xl text-orange-400 font-semibold">{users.filter((u) => u.heavyUser).length}</p>
                </div>
              </div>
            )}

            {activeTab === "users" && (
              <div className="overflow-x-auto bg-background-alt rounded-2xl border border-primary/20 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/20 bg-primary/5">
                      <th className="p-4 text-accent font-semibold">Name</th>
                      <th className="p-4 text-accent font-semibold">Email</th>
                      <th className="p-4 text-accent font-semibold">Status</th>
                      <th className="p-4 text-accent font-semibold">Registered</th>
                      <th className="p-4 text-accent font-semibold">Last Login</th>
                      <th className="p-4 text-accent font-semibold">Usage</th>
                      <th className="p-4 text-accent font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 text-foreground">{user.name || "N/A"}</td>
                        <td className="p-4 text-foreground-muted">{user.email}</td>
                        <td className="p-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-bold ${
                              user.status === "APPROVED"
                                ? "bg-green-500/20 text-green-400"
                                : user.status === "PENDING"
                                  ? "bg-yellow-500/20 text-yellow-400"
                                  : user.status === "DISABLED"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-orange-500/20 text-orange-400"
                            }`}
                          >
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-foreground-muted">{formatDate(user.createdAt)}</td>
                        <td className="p-4 text-sm text-foreground-muted">{formatDate(user.updatedAt)}</td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-foreground-muted">{user.todayRequestCount || 0} requests today</span>
                            {user.heavyUser && (
                              <span className="inline-flex w-fit px-2 py-1 rounded-full text-[10px] font-bold bg-orange-500/20 text-orange-400 border border-orange-400/30">
                                Heavy User
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 space-x-2">
                          {user.status !== "APPROVED" ? (
                            <button onClick={() => handleStatusChange(user.id, "APPROVED")} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors" title="Activate account">
                              <CheckCircle size={18} />
                            </button>
                          ) : (
                            <button onClick={() => handleStatusChange(user.id, "DISABLED")} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors" title="Disable account">
                              <Ban size={18} />
                            </button>
                          )}
                          {user.status === "PENDING" && (
                            <button onClick={() => handleStatusChange(user.id, "REJECTED")} className="bg-orange-600 hover:bg-orange-700 text-white p-2 rounded-lg transition-colors" title="Reject">
                              <XCircle size={18} />
                            </button>
                          )}
                          <a
                            href={`/admin/users/${user.id}`}
                            className="inline-flex bg-accent hover:bg-accent-light text-white p-2 rounded-lg transition-colors"
                            title="Open detailed profile"
                          >
                            <Eye size={18} />
                          </a>
                          {user.intake && (
                            <a
                              href={`/admin/users/${user.id}`}
                              className="inline-flex bg-primary hover:bg-primary-light text-white p-2 rounded-lg transition-colors"
                              title="Open intake form details"
                            >
                              <ClipboardList size={18} />
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "registrations" && (
              <div className="grid gap-4">
                {pendingUsers.length === 0 ? (
                  <div className="bg-background-alt p-8 rounded-2xl border border-primary/20 text-center text-foreground-muted">No pending registrations right now.</div>
                ) : (
                  pendingUsers.map((user) => (
                    <div key={user.id} className="bg-background-alt p-6 rounded-2xl border border-primary/20 shadow-lg">
                      <div className="flex flex-wrap justify-between gap-4">
                        <div>
                          <h3 className="text-xl font-semibold text-foreground">{user.name || "Unnamed user"}</h3>
                          <p className="text-foreground-muted">{user.email}</p>
                          <p className="text-xs text-foreground-muted mt-1">Registered {formatDate(user.createdAt)}</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleStatusChange(user.id, "APPROVED")} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <CheckCircle size={16} /> Approve
                          </button>
                          <button onClick={() => handleStatusChange(user.id, "REJECTED")} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                            <XCircle size={16} /> Reject
                          </button>
                        </div>
                      </div>
                      {user.intake ? (
                        <div className="mt-4 p-4 bg-background rounded-xl border border-primary/10 text-sm space-y-2">
                          {user.image && (
                            <div className="pb-2">
                              <Image
                                src={user.image}
                                alt={`${user.name || user.email} profile`}
                                width={80}
                                height={80}
                                className="h-20 w-20 rounded-full object-cover border border-primary/30"
                                unoptimized
                              />
                            </div>
                          )}
                          <p><span className="text-accent/70">Age:</span> {user.intake.age ?? "Not provided"}</p>
                          <p><span className="text-accent/70">Location:</span> {user.intake.location || "Not provided"}</p>
                          <p><span className="text-accent/70">Gender:</span> {user.intake.gender || "Not provided"}</p>
                          <p><span className="text-accent/70">Goal:</span> {user.intake.goal || "Not provided"}</p>
                          <p><span className="text-accent/70">Why joined:</span> {user.intake.whyJoined || "Not provided"}</p>
                          <p><span className="text-accent/70">Experience:</span> {user.intake.experience || "Not provided"}</p>
                          <p><span className="text-accent/70">Health concerns:</span> {user.intake.healthConcerns || "Not provided"}</p>
                          <p><span className="text-accent/70">Browser:</span> {user.intake.browserType || "Unknown"}</p>
                          <p><span className="text-accent/70">User Agent:</span> {user.intake.userAgent || "Unknown"}</p>
                          <p><span className="text-accent/70">IP Address:</span> {user.intake.ipAddress || "Unknown"}</p>
                        </div>
                      ) : (
                        <p className="text-sm text-foreground-muted mt-4">No intake submitted yet.</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="bg-background-alt rounded-2xl border border-primary/20 p-4 space-y-3">
                  <h3 className="font-semibold text-accent">Inbox Threads</h3>
                  {uniqueThreads.length === 0 && <p className="text-sm text-foreground-muted">No messages yet.</p>}
                  {uniqueThreads.map((msg) => (
                    <button
                      key={msg.id}
                      onClick={() => setSelectedUserId(msg.senderId)}
                      className={`w-full text-left p-3 rounded-xl border transition ${selectedUserId === msg.senderId ? "border-accent bg-accent/10" : "border-primary/10 hover:border-primary/30"}`}
                    >
                      <p className="font-medium text-foreground">{msg.sender?.name || "Unknown user"}</p>
                      <p className="text-xs text-foreground-muted truncate">{msg.content}</p>
                    </button>
                  ))}
                </div>

                <div className="lg:col-span-2 bg-background-alt rounded-2xl border border-primary/20 p-4 space-y-4">
                  <h3 className="font-semibold text-accent">Conversation</h3>
                  {!selectedUserId ? (
                    <p className="text-foreground-muted">Select a user thread to view full conversation and reply.</p>
                  ) : (
                    <>
                      <div className="max-h-80 overflow-y-auto space-y-3">
                        {threadMessages.map((msg) => (
                          <div key={msg.id} className={`p-3 rounded-xl border ${msg.senderId === selectedUserId ? "bg-background border-primary/20" : "bg-primary/10 border-primary/30"}`}>
                            <p className="text-sm text-foreground">{msg.content}</p>
                            <p className="text-[10px] text-foreground-muted mt-1">{formatDate(msg.createdAt)}</p>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={replyContent[selectedUserId] || ""}
                          onChange={(e) => setReplyContent((prev) => ({ ...prev, [selectedUserId]: e.target.value }))}
                          placeholder="Type your response..."
                          className="flex-grow bg-background border border-primary/20 rounded-xl px-4 py-2 text-sm focus:border-accent outline-none"
                        />
                        <button onClick={() => handleReply(selectedUserId)} className="bg-primary hover:bg-primary-light text-white p-2 rounded-xl transition-all">
                          <Send size={18} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                <div className="lg:col-span-3 bg-background-alt rounded-2xl border border-primary/20 p-4 space-y-3">
                  <h3 className="font-semibold text-accent flex items-center gap-2"><CalendarClock size={18} /> Booking Requests</h3>
                  {bookingRequests.length === 0 ? (
                    <p className="text-sm text-foreground-muted">No booking requests submitted yet.</p>
                  ) : (
                    bookingRequests.map((msg) => (
                      <div key={msg.id} className="p-4 border border-primary/10 rounded-xl">
                        <p className="text-sm text-foreground">{msg.content}</p>
                        <p className="text-xs text-foreground-muted mt-1">From {msg.sender?.name || msg.sender?.email || "Unknown user"} • {formatDate(msg.createdAt)}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="space-y-6 max-w-5xl mx-auto">
                <div className="bg-background-alt p-8 rounded-2xl border border-primary/20 shadow-xl space-y-6">
                  <h2 className="text-2xl font-serif text-accent border-b border-primary/10 pb-4">Mya AI Configuration</h2>
                  <p className="text-sm text-foreground-muted">Configure OpenRouter context window, memory usage, and system prompt behavior. Memory retrieval runs through our own Drizzle/SQLite layer, so continuity stays intact even if the OpenRouter model changes. End users never see memory internals.</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground-muted">System Prompt</label>
                      <textarea
                        value={aiSettings.systemPrompt}
                        onChange={(e) => setAiSettings({ ...aiSettings, systemPrompt: e.target.value })}
                        className="w-full h-64 bg-background border border-primary/20 rounded-xl p-4 text-sm focus:border-accent outline-none"
                        placeholder="Define Mya's personality and rules..."
                      />
                      <p className="text-[10px] text-foreground-muted">Use {"{{goal}}"} as a placeholder for each user&apos;s intake goal.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground-muted">OpenRouter API Key</label>
                      <input
                        type="password"
                        value={aiSettings.openrouterApiKey || ""}
                        onChange={(e) => setAiSettings({ ...aiSettings, openrouterApiKey: e.target.value })}
                        className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                        placeholder="sk-or-v1-..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-semibold text-foreground-muted">OpenRouter Model</label>
                        <input
                          type="text"
                          value={aiSettings.model}
                          onChange={(e) => setAiSettings({ ...aiSettings, model: e.target.value })}
                          className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                          placeholder="nvidia/nemotron-3-nano-30b-a3b:free"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground-muted">Top P</label>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.05"
                          value={aiSettings.topP}
                          onChange={(e) => setAiSettings({ ...aiSettings, topP: parseFloat(e.target.value) || 1 })}
                          className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-foreground-muted">Context Messages</label>
                        <input
                          type="number"
                          min="5"
                          max="120"
                          value={aiSettings.maxContextMessages}
                          onChange={(e) => setAiSettings({ ...aiSettings, maxContextMessages: parseInt(e.target.value, 10) || 40 })}
                          className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                        />
                      </div>
                      <label className="flex items-center gap-3 text-sm text-foreground-muted mt-8">
                        <input
                          type="checkbox"
                          checked={aiSettings.enableMemory}
                          onChange={(e) => setAiSettings({ ...aiSettings, enableMemory: e.target.checked })}
                          className="size-4 accent-accent"
                        />
                        Enable hidden memory layer
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground-muted">Temperature ({aiSettings.temperature})</label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={aiSettings.temperature}
                        onChange={(e) => setAiSettings({ ...aiSettings, temperature: parseFloat(e.target.value) })}
                        className="w-full accent-accent"
                      />
                    </div>
                  </div>

                  <button onClick={handleAISave} className="w-full bg-accent text-background font-bold py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-accent/20">
                    Save Mya AI Settings
                  </button>
                </div>

                <div className="bg-background-alt p-6 rounded-2xl border border-primary/20 shadow-xl space-y-4">
                  <h3 className="text-xl font-serif text-accent">Core Memory Bank (admin trained)</h3>
                  <p className="text-xs text-foreground-muted">Core memories are learned when you chat with Mya as admin. End users never see this layer.</p>
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                    {coreMemories.length === 0 ? (
                      <p className="text-sm text-foreground-muted">No core memories yet. Talk to Mya from the admin account to seed them.</p>
                    ) : (
                      coreMemories.map((memory) => (
                        <div key={memory.id} className="flex items-start justify-between gap-3 bg-background border border-primary/10 rounded-xl p-3">
                          <div>
                            <p className="text-sm text-foreground">{memory.memory}</p>
                            <p className="text-[10px] text-foreground-muted mt-1">Updated {formatDate(memory.updatedAt)}</p>
                          </div>
                          <button
                            onClick={() => handleDeleteCoreMemory(memory.id)}
                            className="text-xs px-2 py-1 rounded border border-red-500/40 text-red-300 hover:bg-red-500/10"
                          >
                            Remove
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "system" && (
              <div className="bg-background-alt p-8 rounded-2xl border border-primary/20 shadow-xl space-y-6 max-w-xl mx-auto">
                <h2 className="text-2xl font-serif text-accent border-b border-primary/10 pb-4">System Sanctuary Settings</h2>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-foreground-muted">Change Admin Password</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                    placeholder="New sacred password..."
                  />
                  <p className="text-[10px] text-foreground-muted">Minimum 8 characters. This updates your admin credentials.</p>
                </div>

                <button onClick={handlePasswordChange} className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg">
                  Update Admin Password
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
