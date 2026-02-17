import { authOptions } from "@/lib/auth";
import { getRetentionPolicyDays, searchMemoryConsole } from "@/lib/memory";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import MemoryConsole from "@/components/MemoryConsole";

export default async function AdminMemoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const session = await getServerSession(authOptions);

  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const user = typeof params.user === "string" ? params.user : undefined;
  const q = typeof params.q === "string" ? params.q : undefined;
  const type = typeof params.type === "string" ? params.type : undefined;
  const pinned = typeof params.pinned === "string" ? params.pinned : undefined;
  const expired = typeof params.expired === "string" ? params.expired : undefined;
  const scope = typeof params.scope === "string" ? params.scope : undefined;

  const [data, retentionDays] = await Promise.all([
    searchMemoryConsole({ userLookup: user, contentQuery: q, type, pinned, expired, scope }),
    getRetentionPolicyDays(),
  ]);

  return (
    <main className="min-h-screen bg-background px-6 py-10">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <h1 className="text-3xl font-serif text-accent">Admin Memory Console</h1>
        <p className="text-sm text-foreground-muted">Internal continuity memory for Mya. This data is server-only and never shown to end users.</p>
        <MemoryConsole
          initialData={data}
          initialRetentionDays={retentionDays}
        />
      </div>
    </main>
  );
}
