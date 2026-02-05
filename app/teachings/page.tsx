"use client";

import Link from "next/link";
import { ChevronLeft, Book, Zap, Wind, Moon } from "lucide-react";

const teachings = [
  {
    title: "Gassho Meditation",
    icon: <Zap className="text-accent" />,
    description: "The foundation of Reiki practice. Gassho means &quot;two hands coming together&quot;. It is used to clear the mind and center the spirit.",
    steps: [
      "Sit comfortably with your back straight.",
      "Place your hands together in front of your heart center (Atmanjali Mudra).",
      "Focus your attention on the point where your two middle fingers meet.",
      "If thoughts arise, gently acknowledge them and return to the sensation in your fingers.",
      "Continue for 10-15 minutes daily."
    ]
  },
  {
    title: "Reiji-ho: The Indication of Energy",
    icon: <Book className="text-accent" />,
    description: "A three-step process to prepare for a Reiki session and ask for guidance.",
    steps: [
      "Bring your hands to the Gassho position and pray for the well-being of the recipient.",
      "Raise your hands to the third eye and ask for the Reiki energy to guide your hands to where they are needed.",
      "Lower your hands and follow the intuitive pull of the energy."
    ]
  },
  {
    title: "Joshin Kokyu-ho: Purification Breath",
    icon: <Wind className="text-accent" />,
    description: "A technique to strengthen your energy field and purify your body through the breath.",
    steps: [
      "Breathe in through your nose, imagining light filling your entire body and moving down to the Tanden (hara).",
      "Hold for a brief moment, feeling the energy expand.",
      "Exhale through your mouth, imagining the energy radiating out through your skin to infinity.",
      "Repeat until you feel vibrant and light."
    ]
  },
  {
    title: "Chiryo: Treatment",
    icon: <Moon className="text-accent" />,
    description: "The actual practice of giving Reiki, following the guidance received during Reiji-ho.",
    steps: [
      "Place your hands gently on or just above the body.",
      "Keep your fingers together and palms flat.",
      "Let the energy flow naturally; do not try to 'push' or 'force' it.",
      "End by smoothing the aura and giving thanks."
    ]
  }
];

export default function TeachingsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="p-6 border-b border-primary/10 bg-background-alt/50 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 text-foreground-muted hover:text-accent transition-colors">
          <ChevronLeft size={20} />
          <span>Back to Dashboard</span>
        </Link>
        <h1 className="text-2xl font-serif text-accent">Sacred Teachings</h1>
        <div className="w-24" /> {/* Spacer */}
      </header>

      <main className="flex-grow max-w-5xl mx-auto w-full p-6 md:p-12 space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-4xl md:text-5xl font-serif text-foreground">Wisdom of the Masters</h2>
          <p className="text-foreground-muted max-w-2xl mx-auto italic">
            &quot;The path of Reiki is paved with ancient techniques and modern devotion. Explore these guides to deepen your daily practice.&quot;
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {teachings.map((teaching, i) => (
            <div key={i} className="bg-background-alt p-8 rounded-3xl border border-primary/20 hover:border-accent/30 transition-all group shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 bg-primary/10 rounded-2xl group-hover:scale-110 transition-transform">
                  {teaching.icon}
                </div>
                <h3 className="text-2xl font-serif text-accent">{teaching.title}</h3>
              </div>
              <p className="text-foreground-muted mb-6 leading-relaxed italic">
                {teaching.description}
              </p>
              <div className="space-y-4">
                {teaching.steps.map((step, si) => (
                  <div key={si} className="flex gap-3">
                    <span className="text-accent font-serif font-bold text-sm">{si + 1}.</span>
                    <p className="text-sm text-foreground/80">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="bg-primary/5 border border-accent/20 rounded-3xl p-10 text-center space-y-6">
          <h3 className="text-3xl font-serif text-accent">Deeper Mastery Awaits</h3>
          <p className="text-foreground-muted max-w-xl mx-auto">
            These techniques are just the beginning. Imagine the profound transformation you&apos;ll experience during a direct transmission.
          </p>
          <div className="pt-4">
            <Link
              href="/mya-chat"
              className="inline-block px-8 py-3 bg-accent text-background font-bold rounded-full hover:bg-accent-light transition-all"
            >
              Consult with Mya
            </Link>
          </div>
        </div>
      </main>

      <footer className="p-8 text-center text-foreground-muted/40 text-sm border-t border-primary/10">
        Blessings of peace, Baba Virtuehearts | 647-781-8371
      </footer>
    </div>
  );
}
