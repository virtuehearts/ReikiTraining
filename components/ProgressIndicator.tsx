"use client";

interface ProgressIndicatorProps {
  currentDay: number;
  completedDays: number[];
}

export default function ProgressIndicator({ currentDay, completedDays }: ProgressIndicatorProps) {
  const totalDays = 7;
  const percentage = (completedDays.length / totalDays) * 100;

  return (
    <div className="w-full max-w-3xl mx-auto space-y-4">
      <div className="flex justify-between items-end">
        <span className="text-accent font-serif text-lg tracking-wide uppercase">Your Path</span>
        <span className="text-foreground-muted font-sans text-sm">{Math.round(percentage)}% Enlightened</span>
      </div>

      <div className="relative h-3 bg-background-alt rounded-full border border-primary/20 overflow-hidden shadow-inner">
        <div
          className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(212,175,55,0.4)]"
          style={{ width: `${percentage}%` }}
        />

        {/* Day markers */}
        <div className="absolute top-0 left-0 w-full h-full flex justify-between px-1">
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <div
              key={day}
              className={`w-1 h-full rounded-full transition-colors ${
                completedDays.includes(day) ? 'bg-accent/50' : 'bg-primary/20'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-between text-[10px] uppercase tracking-widest text-foreground-muted/60 px-1">
        <span>Beginning</span>
        <span>Mastery</span>
      </div>
    </div>
  );
}
