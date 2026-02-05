"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  name: string | null;
  email: string;
  status: string;
  role: string;
  createdAt: string;
  intake: any;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session?.user?.role !== "ADMIN") {
      router.push("/dashboard");
      return;
    }

    fetchUsers();
  }, [session, router]);

  const fetchUsers = async () => {
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

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center text-accent">Loading Users...</div>;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-serif text-accent mb-8">Admin Sanctuary - User Management</h1>

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
                        <div className="mt-2 p-2 bg-background rounded border border-primary/10 text-xs">
                          <p>Age: {user.intake.age}</p>
                          <p>Goal: {user.intake.goal}</p>
                        </div>
                      </details>
                    ) : "No intake yet"}
                  </td>
                  <td className="p-4 space-x-2">
                    {user.status === "PENDING" && (
                      <>
                        <button
                          onClick={() => handleStatusChange(user.id, "APPROVED")}
                          className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleStatusChange(user.id, "REJECTED")}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {user.status !== "PENDING" && (
                       <button
                       onClick={() => handleStatusChange(user.id, "PENDING")}
                       className="text-foreground-muted hover:text-accent px-3 py-1 rounded text-sm transition-colors"
                     >
                       Reset to Pending
                     </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
