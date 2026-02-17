"use client";

import { signOut, useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import IntakeForm from "@/components/IntakeForm";
import ProgressIndicator from "@/components/ProgressIndicator";
import DailyCard from "@/components/DailyCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MessageCircle, Library } from "lucide-react";
import MessageBaba from "@/components/MessageBaba";

type CompletedProgressEntry = {
  day: number;
  completedAt: string | null;
};

function getDateKeyLocal(date: Date) {
  return date.toLocaleDateString("en-CA");
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [hasIntake, setHasIntake] = useState<boolean | null>(null);
  const [currentDay, setCurrentDay] = useState(1);
  const [progress, setProgress] = useState<number[]>([]); // Days completed
  const [completedProgress, setCompletedProgress] = useState<CompletedProgressEntry[]>([]);
  const [lessonLockMessage, setLessonLockMessage] = useState("");
  const [loading, setLoading] = useState(true);

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login", redirect: true });
  };

  const highestCompletedDay = progress.length ? Math.max(...progress) : 0;
  const nextDayCandidate = Math.min(highestCompletedDay + 1, 7);
  const previousDayEntry = completedProgress.find((entry) => entry.day === highestCompletedDay);

  const isNextDayLockedUntilMidnight = Boolean(
    highestCompletedDay > 0 &&
    highestCompletedDay < 7 &&
    previousDayEntry?.completedAt &&
    getDateKeyLocal(new Date(previousDayEntry.completedAt)) === getDateKeyLocal(new Date())
  );

  const maxUnlockedDay = isNextDayLockedUntilMidnight
    ? highestCompletedDay
    : nextDayCandidate;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (session?.user?.status === "PENDING") {
      router.push("/pending");
    } else if (session?.user) {
      fetchProgress();
    }
  }, [session, status, router]);

  const fetchProgress = async () => {
    try {
      const res = await fetch("/api/user/progress");
      if (res.ok) {
        const data = await res.json();
        setHasIntake(data.hasIntake);
        setProgress(data.completedDays || []);
        setCompletedProgress(data.completedProgress || []);
        // Set current day to the first incomplete day
        const completedDays = data.completedDays || [];
        const highestCompleted = completedDays.length ? Math.max(...completedDays) : 0;
        const previousEntry = (data.completedProgress || []).find((entry: CompletedProgressEntry) => entry.day === highestCompleted);
        const lockNextDay = Boolean(
          highestCompleted > 0 &&
          highestCompleted < 7 &&
          previousEntry?.completedAt &&
          getDateKeyLocal(new Date(previousEntry.completedAt)) === getDateKeyLocal(new Date())
        );

        const nextAvailableDay = lockNextDay
          ? highestCompleted
          : ([1,2,3,4,5,6,7].find(d => !completedDays.includes(d)) || 7);

        setCurrentDay(nextAvailableDay);
      }
    } catch (err) {
      console.error("Failed to fetch progress");
    } finally {
      setLoading(false);
    }
  };

  if (loading || status === "loading") {
    return <div className="min-h-screen bg-background flex items-center justify-center text-accent">Ascending...</div>;
  }

  if (hasIntake === false && session?.user?.role !== "ADMIN") {
    return (
      <div className="min-h-screen bg-background p-8 flex items-center justify-center">
        <IntakeForm onComplete={() => setHasIntake(true)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="p-6 border-b border-primary/10 flex justify-between items-center bg-background-alt/50 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h1 className="text-2xl font-serif text-accent">Virtuehearts Reiki</h1>
        </div>
        <div className="flex items-center gap-8">
          <Link href="/teachings" className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
            <Library size={20} />
            <span>Teachings</span>
          </Link>
          <Link href="/mya-chat" className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
            <MessageCircle size={20} />
            <span>Chat with Mya</span>
          </Link>
          <MessageBaba />
          <div className="text-right">
            <p className="text-sm font-medium">{session?.user?.name}</p>
            <button
              onClick={handleSignOut}
              className="text-xs text-foreground-muted hover:text-accent"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow max-w-6xl mx-auto w-full p-6 md:p-12 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground">Your 7-Day Transformation</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto italic">
            &quot;Each day is a new virtue, a new energy, a new step towards your highest self.&quot;
          </p>
        </div>

        <ProgressIndicator currentDay={currentDay} completedDays={progress} />

        <div className="grid grid-cols-1 gap-12 pt-8">
          {isNextDayLockedUntilMidnight && highestCompletedDay < 7 && (
            <div className="max-w-4xl mx-auto w-full rounded-2xl border border-accent/30 bg-primary/10 p-4 text-sm text-foreground-muted">
              You completed today&apos;s lesson. Please meditate on this wisdom and return after midnight local time to continue to Day {highestCompletedDay + 1}.
            </div>
          )}

          {lessonLockMessage && (
            <div className="max-w-4xl mx-auto w-full rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
              {lessonLockMessage}
            </div>
          )}

           <DailyCard
             day={currentDay}
             onComplete={(completedAt) => {
               setLessonLockMessage("");
               const updatedProgress = progress.includes(currentDay)
                 ? progress
                 : [...progress, currentDay];
               const updatedCompletedProgress = completedProgress.some((entry) => entry.day === currentDay)
                 ? completedProgress.map((entry) => entry.day === currentDay ? { ...entry, completedAt } : entry)
                 : [...completedProgress, { day: currentDay, completedAt }];

               setProgress(updatedProgress);
               setCompletedProgress(updatedCompletedProgress);

               const lockAfterCompletion = Boolean(
                 currentDay < 7 &&
                 completedAt &&
                 getDateKeyLocal(new Date(completedAt)) === getDateKeyLocal(new Date())
               );

               if (currentDay < 7 && !lockAfterCompletion) {
                 setCurrentDay(currentDay + 1);
               }
             }}
           />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 pt-12">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <button
              key={day}
              onClick={() => {
                if (day > maxUnlockedDay) {
                  setLessonLockMessage(
                    `Please meditate on today's teachings. Day ${maxUnlockedDay + 1} unlocks after midnight local time.`
                  );
                  return;
                }

                setLessonLockMessage("");
                setCurrentDay(day);
              }}
              className={`p-4 rounded-xl border transition-all ${
                day === currentDay
                  ? "bg-primary/20 border-accent shadow-[0_0_15px_rgba(212,175,55,0.2)]"
                  : progress.includes(day)
                  ? "bg-primary/5 border-primary/20 opacity-100"
                  : day > maxUnlockedDay
                  ? "bg-background-alt border-primary/10 opacity-50 cursor-not-allowed"
                  : "bg-background-alt border-primary/10 opacity-80"
              }`}
            >
              <p className="text-xs uppercase tracking-widest text-accent mb-1 font-bold">Day</p>
              <p className="text-2xl font-serif">{day}</p>
              {progress.includes(day) && <p className="text-[10px] text-secondary mt-1 uppercase">Completed</p>}
            </button>
          ))}
        </div>
      </main>

      <footer className="p-8 text-center text-foreground-muted/40 text-sm">
        Blessings of peace, Baba Virtuehearts | 647-781-8371
      </footer>
    </div>
  );
}
