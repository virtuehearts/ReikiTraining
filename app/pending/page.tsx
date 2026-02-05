"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session?.user?.status === "APPROVED") {
      router.push("/dashboard");
    }
  }, [session, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full text-center space-y-8 bg-background-alt p-12 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden">
        {/* Subtle glow effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-accent leading-tight">
            Thank you for joining <br />
            <span className="text-foreground">Virtuehearts Reiki Training</span>
          </h1>

          <div className="space-y-6 text-lg text-foreground-muted max-w-lg mx-auto leading-relaxed">
            <p>Your account is under review.</p>
            <p>Approval takes up to 24 hours.</p>
            <p>You&apos;ll receive an email when activated.</p>
            <p>We look forward to your sacred journey.</p>
          </div>
        </div>

        <div className="pt-8">
          <p className="font-script text-3xl text-accent">
            Blessings of peace,
          </p>
          <p className="font-script text-3xl text-foreground mt-2">
            Baba Virtuehearts
          </p>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-12 text-foreground-muted hover:text-accent transition-colors text-sm underline underline-offset-4"
        >
          Sign out and return later
        </button>
      </div>
    </div>
  );
}
