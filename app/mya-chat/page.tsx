"use client";

import ChatInterface from "@/components/ChatInterface";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSession } from "next-auth/react";

export default function MyaChatPage() {
  const { data: session } = useSession();
  const backHref = session?.user?.role === "ADMIN" ? "/admin" : "/dashboard";
  const backLabel = session?.user?.role === "ADMIN" ? "Back to Admin Panel" : "Back to Dashboard";

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6 border-b border-primary/10 bg-background-alt/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <Link href={backHref} className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
          <ChevronLeft size={20} />
          <span>{backLabel}</span>
        </Link>
        <h1 className="text-2xl font-serif text-accent">Mya – Reiki Assistant</h1>
        <div className="w-24" />
      </header>

      <main className="flex-grow flex flex-col items-center justify-start p-4 md:p-8 space-y-6">
        <div className="text-center max-w-2xl pt-2 md:pt-4">
          <h2 className="text-3xl font-serif mb-4">A Sacred Dialogue</h2>
          <p className="text-foreground-muted italic">
            &quot;Mya is here to guide you through the energies of the day. Seek her wisdom when your path feels unclear.&quot;
          </p>
        </div>

        <ChatInterface />
      </main>

      <footer className="p-8 text-center text-foreground-muted/40 text-sm">Blessings of peace, Baba Virtuehearts | 647-781-8371</footer>
    </div>
  );
}
