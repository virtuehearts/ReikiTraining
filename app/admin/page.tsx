"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Users, Settings, MessageSquare, Send, CheckCircle, XCircle, Shield } from "lucide-react";

interface User {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  intake: any;
}

interface AISettings {
  systemPrompt: string;
  model: string;
  temperature: number;
  topP: number;
  openrouterApiKey?: string;
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

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [aiSettings, setAiSettings] = useState<AISettings>({
    systemPrompt: "",
    model: "",
    temperature: 0.7,
    topP: 1.0,
    openrouterApiKey: "",
  });
  const [newPassword, setNewPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTab] = useState("users");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session || session.user.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    if (activeTab === "users") fetchUsers();
    if (activeTab === "ai") fetchAISettings();
    if (activeTab === "messages") fetchMessages();
  }, [session, status, router, activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAISettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/ai-settings");
      if (res.ok) {
        const data = await res.json();
        if (data) setAiSettings(data);
      }
    } catch (err) {
      console.error("Failed to fetch AI settings");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch messages");
    } finally {
      setLoading(false);
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
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
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
      if (res.ok) {
        alert("AI Settings updated successfully");
      }
    } catch (err) {
      alert("Failed to update AI settings");
    }
  };

  const handleReply = async (userId: string) => {
    const content = replyContent[userId];
    if (!content?.trim()) return;

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, receiverId: userId }),
      });
      if (res.ok) {
        setReplyContent({ ...replyContent, [userId]: "" });
        alert("Reply sent");
      }
    } catch (err) {
      alert("Failed to send reply");
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
    } catch (err) {
      alert("Failed to update password");
    }
  };

  if (status === "loading" || !session || session.user.role !== "ADMIN") {
    return <div className="min-h-screen bg-background flex items-center justify-center text-accent">Channeling Admin Sanctuary...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-serif text-accent">Admin Sanctuary</h1>
          <div className="flex bg-background-alt p-1 rounded-xl border border-primary/20">
            <button
              onClick={() => setActiveTab("users")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'users' ? 'bg-primary text-white shadow-lg' : 'text-foreground-muted hover:text-accent'}`}
            >
              <Users size={18} />
              <span>Users</span>
            </button>
            <button
              onClick={() => setActiveTab("ai")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'ai' ? 'bg-primary text-white shadow-lg' : 'text-foreground-muted hover:text-accent'}`}
            >
              <Settings size={18} />
              <span>AI Mya</span>
            </button>
            <button
              onClick={() => setActiveTab("messages")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'messages' ? 'bg-primary text-white shadow-lg' : 'text-foreground-muted hover:text-accent'}`}
            >
              <MessageSquare size={18} />
              <span>Messages</span>
            </button>
            <button
              onClick={() => setActiveTab("system")}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${activeTab === 'system' ? 'bg-primary text-white shadow-lg' : 'text-foreground-muted hover:text-accent'}`}
            >
              <Shield size={18} />
              <span>System</span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="flex items-center justify-center h-64 text-accent animate-pulse">Channeling data...</div>
        ) : (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {activeTab === "users" && (
              <div className="overflow-x-auto bg-background-alt rounded-2xl border border-primary/20 shadow-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-primary/20 bg-primary/5">
                      <th className="p-4 text-accent font-semibold">Name</th>
                      <th className="p-4 text-accent font-semibold">Email</th>
                      <th className="p-4 text-accent font-semibold">Status</th>
                      <th className="p-4 text-accent font-semibold">Intake Data</th>
                      <th className="p-4 text-accent font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary/10">
                    {users.map((user) => (
                      <tr key={user.id} className="hover:bg-primary/5 transition-colors">
                        <td className="p-4 text-foreground">{user.name || "N/A"}</td>
                        <td className="p-4 text-foreground-muted">{user.email}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === 'APPROVED' ? 'bg-green-500/20 text-green-400' :
                            user.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-red-500/20 text-red-400'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-foreground-muted">
                          {user.intake ? (
                            <details className="cursor-pointer">
                              <summary className="text-accent hover:underline">View Intake</summary>
                              <div className="mt-2 p-3 bg-background rounded-xl border border-primary/10 text-xs space-y-1">
                                <p><span className="text-accent/60">Age:</span> {user.intake.age}</p>
                                <p><span className="text-accent/60">Experience:</span> {user.intake.experience}</p>
                                <p><span className="text-accent/60">Goal:</span> {user.intake.goal}</p>
                                <p><span className="text-accent/60">Health:</span> {user.intake.healthConcerns}</p>
                              </div>
                            </details>
                          ) : "No intake yet"}
                        </td>
                        <td className="p-4 space-x-2">
                          {user.status === "PENDING" ? (
                            <>
                              <button onClick={() => handleStatusChange(user.id, "APPROVED")} className="bg-green-600 hover:bg-green-700 text-white p-2 rounded-lg transition-colors" title="Approve">
                                <CheckCircle size={18} />
                              </button>
                              <button onClick={() => handleStatusChange(user.id, "REJECTED")} className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-lg transition-colors" title="Reject">
                                <XCircle size={18} />
                              </button>
                            </>
                          ) : (
                            <button onClick={() => handleStatusChange(user.id, "PENDING")} className="text-xs text-foreground-muted hover:text-accent">
                              Reset Status
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === "ai" && (
              <div className="bg-background-alt p-8 rounded-2xl border border-primary/20 shadow-xl space-y-6 max-w-3xl mx-auto">
                <h2 className="text-2xl font-serif text-accent border-b border-primary/10 pb-4">Mya AI Configuration</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground-muted">System Prompt</label>
                    <textarea
                      value={aiSettings.systemPrompt}
                      onChange={(e) => setAiSettings({...aiSettings, systemPrompt: e.target.value})}
                      className="w-full h-64 bg-background border border-primary/20 rounded-xl p-4 text-sm focus:border-accent outline-none"
                      placeholder="Define Mya&apos;s personality and rules..."
                    />
                    <p className="text-[10px] text-foreground-muted">Use {"{{goal}}"} as a placeholder for the user&apos;s intake goal.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground-muted">OpenRouter API Key</label>
                      <input
                        type="password"
                        value={aiSettings.openrouterApiKey || ""}
                        onChange={(e) => setAiSettings({...aiSettings, openrouterApiKey: e.target.value})}
                        className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                        placeholder="sk-or-v1-..."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground-muted">OpenRouter Model</label>
                      <input
                        type="text"
                        value={aiSettings.model}
                        onChange={(e) => setAiSettings({...aiSettings, model: e.target.value})}
                        className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-foreground-muted">Temperature ({aiSettings.temperature})</label>
                      <input
                        type="range" min="0" max="2" step="0.1"
                        value={aiSettings.temperature}
                        onChange={(e) => setAiSettings({...aiSettings, temperature: parseFloat(e.target.value)})}
                        className="w-full accent-accent"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAISave}
                  className="w-full bg-accent text-background font-bold py-3 rounded-xl hover:scale-[1.02] transition-all shadow-lg shadow-accent/20"
                >
                  Save Sacred Configuration
                </button>
              </div>
            )}

            {activeTab === "messages" && (
              <div className="grid grid-cols-1 gap-6">
                {messages.length === 0 && (
                  <div className="text-center py-12 bg-background-alt rounded-2xl border border-primary/20 text-foreground-muted italic">
                    The silence is profound. No messages yet.
                  </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className="bg-background-alt p-6 rounded-2xl border border-primary/20 shadow-lg flex flex-col gap-4">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center text-accent">
                          <Users size={20} />
                        </div>
                        <div>
                          <h4 className="font-semibold text-foreground">{msg.sender?.name || "Unknown Disciple"}</h4>
                          <p className="text-xs text-foreground-muted">{msg.sender?.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {msg.isBooking && (
                          <span className="bg-accent/20 text-accent text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest mr-2">
                            Booking Request
                          </span>
                        )}
                        <span className="text-[10px] text-foreground-muted">
                          {new Date(msg.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 bg-background/50 rounded-xl border border-primary/10 italic text-foreground">
                      &quot;{msg.content}&quot;
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyContent[msg.senderId] || ""}
                        onChange={(e) => setReplyContent({...replyContent, [msg.senderId]: e.target.value})}
                        placeholder="Type your response to this seeker..."
                        className="flex-grow bg-background border border-primary/20 rounded-xl px-4 py-2 text-sm focus:border-accent outline-none"
                      />
                      <button
                        onClick={() => handleReply(msg.senderId)}
                        className="bg-primary hover:bg-primary-light text-white p-2 rounded-xl transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "system" && (
              <div className="bg-background-alt p-8 rounded-2xl border border-primary/20 shadow-xl space-y-6 max-w-xl mx-auto">
                <h2 className="text-2xl font-serif text-accent border-b border-primary/10 pb-4">System Sanctuary Settings</h2>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-foreground-muted">Change Admin Password</label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full bg-background border border-primary/20 rounded-xl p-3 text-sm focus:border-accent outline-none"
                      placeholder="New sacred password..."
                    />
                    <p className="text-[10px] text-foreground-muted">Minimum 8 characters. This will update your login credentials.</p>
                  </div>

                  <button
                    onClick={handlePasswordChange}
                    className="w-full bg-primary text-white font-bold py-3 rounded-xl hover:bg-primary-light transition-all shadow-lg"
                  >
                    Update Admin Password
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
