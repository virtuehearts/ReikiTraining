"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

const getPendingCopy = (status?: string) => {
  if (status === "REJECTED") {
    return {
      title: "Your registration needs follow-up",
      lines: [
        "Your account request was not approved yet.",
        "Please contact support or message the administrator for next steps.",
        "You can submit updated intake details and request a review.",
      ],
    };
  }

  if (status === "DISABLED") {
    return {
      title: "Your account is currently disabled",
      lines: [
        "An administrator has temporarily disabled access.",
        "Please message the admin panel team for reactivation.",
        "Once reactivated, you can continue your Reiki training immediately.",
      ],
    };
  }

  return {
    title: "Thank you for joining",
    lines: [
      "Your account is under review.",
      "Approval takes up to 24 hours.",
      "You'll receive an email when activated.",
      "We look forward to your sacred journey.",
    ],
  };
};

export default function PendingPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  useEffect(() => {
    if (session?.user?.role === "ADMIN") {
      router.push("/admin");
      return;
    }

    if (session?.user?.status === "APPROVED") {
      router.push("/dashboard");
    }
  }, [session, router]);

  const copy = getPendingCopy(session?.user?.status);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-2xl w-full text-center space-y-8 bg-background-alt p-12 rounded-3xl border border-primary/20 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="space-y-4">
          <h1 className="text-4xl md:text-5xl font-serif text-accent leading-tight">
            {copy.title} <br />
            <span className="text-foreground">Virtuehearts Reiki Training</span>
          </h1>

          <div className="space-y-4 text-lg text-foreground-muted max-w-lg mx-auto leading-relaxed">
            {copy.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </div>

        <div className="pt-8">
          <p className="font-script text-3xl text-accent">Blessings of peace,</p>
          <p className="font-script text-3xl text-foreground mt-2">Baba Virtuehearts</p>
        </div>

        <button
          onClick={handleSignOut}
          className="mt-12 text-foreground-muted hover:text-accent transition-colors text-sm underline underline-offset-4"
        >
          Sign out and return later
        </button>
      </div>
    </div>
  );
}
