import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-grow flex items-center justify-center p-4">
        <div className="max-w-4xl w-full text-center space-y-12">
          <div className="space-y-6">
            <h1 className="text-6xl md:text-8xl font-serif text-accent tracking-tight">
              Virtuehearts <br />
              <span className="text-foreground">Reiki Training</span>
            </h1>
            <p className="text-xl md:text-2xl text-foreground-muted font-light italic">
              &quot;Awakening Inner Peace Through Virtue & Reiki Energy&quot;
            </p>
          </div>

          <div className="max-w-2xl mx-auto text-lg text-foreground-muted leading-relaxed">
            <p>
              Welcome to a sacred space designed to harmonize your spirit and
              cultivate the virtues of the heart. Join Baba Virtuehearts in a
              transformative 7-day journey of energy, wisdom, and profound peace.
            </p>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link
              href="/register"
              className="px-10 py-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-full font-semibold text-lg hover:scale-105 transition-all shadow-[0_0_20px_rgba(75,0,130,0.3)]"
            >
              Begin Your Journey
            </Link>
            <Link
              href="/login"
              className="px-10 py-4 border border-accent/30 text-accent rounded-full font-semibold text-lg hover:bg-accent/5 transition-all"
            >
              Returning Disciple
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-foreground-muted/60 border-t border-primary/10">
        <p className="mb-2">Contact: 647-781-8371</p>
        <p className="font-script text-xl text-accent/80">
          Blessings of peace, Baba Virtuehearts
        </p>
      </footer>
    </div>
  );
}
