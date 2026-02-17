import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { eq } from "drizzle-orm";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";

const formatDate = (value?: Date | null) => (value ? new Date(value).toLocaleString() : "Not available");

export default async function AdminUserDetailsPage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { userId } = await params;

  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
    with: {
      intake: true,
    },
  });

  if (!user) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-serif text-accent">Student Registration Details</h1>
            <p className="text-foreground-muted">Detailed intake and registration metadata for admin review.</p>
          </div>
          <Link href="/admin" className="rounded-lg border border-primary/20 px-3 py-2 text-sm text-foreground-muted hover:text-accent hover:bg-primary/10">
            Back to Admin Panel
          </Link>
        </div>

        <section className="bg-background-alt rounded-2xl border border-primary/20 p-6 space-y-4">
          <div className="flex flex-wrap items-start gap-4">
            {user.image && (
              <Image
                src={user.image}
                alt={`${user.name || user.email} profile`}
                width={120}
                height={120}
                className="h-24 w-24 rounded-full object-cover border border-primary/30"
                unoptimized
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-foreground">{user.name || "Unnamed user"}</h2>
              <p className="text-foreground-muted">{user.email}</p>
              <p className="text-xs text-foreground-muted mt-1">Account created: {formatDate(user.createdAt)}</p>
              <p className="text-xs text-foreground-muted">Last login: {formatDate(user.updatedAt)}</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-sm">
            <p><span className="text-accent/70">Status:</span> {user.status}</p>
            <p><span className="text-accent/70">Role:</span> {user.role}</p>
            <p><span className="text-accent/70">Age:</span> {user.intake?.age ?? "Not provided"}</p>
            <p><span className="text-accent/70">Location:</span> {user.intake?.location || "Not provided"}</p>
            <p><span className="text-accent/70">Gender:</span> {user.intake?.gender || "Not provided"}</p>
            <p><span className="text-accent/70">Experience:</span> {user.intake?.experience || "Not provided"}</p>
          </div>
        </section>

        <section className="bg-background-alt rounded-2xl border border-primary/20 p-6 space-y-3 text-sm">
          <h3 className="text-lg font-semibold text-accent">Intake Notes</h3>
          <p><span className="text-accent/70">Reason for joining:</span> {user.intake?.whyJoined || "Not provided"}</p>
          <p><span className="text-accent/70">Spiritual goal:</span> {user.intake?.goal || "Not provided"}</p>
          <p><span className="text-accent/70">Health concerns:</span> {user.intake?.healthConcerns || "Not provided"}</p>
        </section>

        <section className="bg-background-alt rounded-2xl border border-primary/20 p-6 space-y-3 text-sm">
          <h3 className="text-lg font-semibold text-accent">Registration Metadata</h3>
          <p><span className="text-accent/70">Browser type:</span> {user.intake?.browserType || "Unknown"}</p>
          <p><span className="text-accent/70">User agent:</span> {user.intake?.userAgent || "Unknown"}</p>
          <p><span className="text-accent/70">IP address:</span> {user.intake?.ipAddress || "Unknown"}</p>
          <p><span className="text-accent/70">Intake submitted:</span> {formatDate(user.intake?.createdAt)}</p>
        </section>
      </div>
    </div>
  );
}
