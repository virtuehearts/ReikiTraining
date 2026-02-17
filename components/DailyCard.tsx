"use client";

import { useState, useEffect } from "react";
import { dailyContent } from "@/lib/content";
import RitualViewer from "./RitualViewer";
import QuizComponent from "./QuizComponent";
import { CheckCircle, ChevronRight, BookOpen, Wind, Star } from "lucide-react";

interface DailyCardProps {
  day: number;
  onComplete: (completedAt: string) => void;
}

export default function DailyCard({ day, onComplete }: DailyCardProps) {
  const content = dailyContent[day];
  const [step, setStep] = useState(1); // 1: Lesson, 2: Exercise, 3: Ritual, 4: Quiz/Reflection
  const [reflection, setReflection] = useState("");
  const [activeQuiz, setActiveQuiz] = useState(content?.quiz);
  const [saving, setSaving] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const [quizError, setQuizError] = useState("");
  const [completionError, setCompletionError] = useState("");

  useEffect(() => {
    setActiveQuiz(content?.quiz);
    setStep(1);
    setQuizError("");
    setCompletionError("");
  }, [day, content]);

  const handleFinish = async () => {
    setSaving(true);
    setCompletionError("");
    try {
      // Save reflection and progress
      const res = await fetch("/api/user/complete-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          day,
          reflection,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        setCompletionError(payload?.error || "Unable to complete this lesson right now.");
        return;
      }

      onComplete(new Date().toISOString());
      setStep(1); // Reset for next day if needed
    } catch (err) {
      setCompletionError("Connection issue while completing this lesson. Please try again.");
      console.error("Failed to complete day");
    } finally {
      setSaving(false);
    }
  };

  if (!content) return null;

  return (
    <div className="bg-background-alt rounded-3xl border border-primary/20 shadow-2xl overflow-hidden max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/40 to-primary-light/40 p-8 border-b border-primary/10">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-accent uppercase tracking-[0.3em] font-bold text-xs mb-2">Sacred Training</p>
            <h3 className="text-4xl font-serif text-foreground">Day {day}: {content.virtue}</h3>
          </div>
          <div className="h-16 w-16 rounded-full border-2 border-accent/30 flex items-center justify-center text-accent font-serif text-2xl">
            {day}
          </div>
        </div>
      </div>

      <div className="p-8 md:p-12">
        {step === 1 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 text-accent">
              <BookOpen size={24} />
              <h4 className="text-xl font-serif uppercase tracking-wider">The Lesson</h4>
            </div>
            <p className="text-lg leading-relaxed text-foreground-muted first-letter:text-5xl first-letter:font-serif first-letter:mr-3 first-letter:float-left first-letter:text-accent">
              {content.lesson}
            </p>
            <button
              onClick={() => setStep(2)}
              className="mt-8 flex items-center gap-2 bg-primary/20 hover:bg-primary/40 text-accent px-6 py-3 rounded-full transition-all group"
            >
              Move to Exercise <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 text-accent">
              <Wind size={24} />
              <h4 className="text-xl font-serif uppercase tracking-wider">Practical Exercise</h4>
            </div>
            <div className="bg-background p-8 rounded-2xl border border-primary/10 italic text-lg text-foreground-muted">
              {content.exercise}
            </div>
            <button
              onClick={() => setStep(3)}
              className="mt-8 flex items-center gap-2 bg-primary/20 hover:bg-primary/40 text-accent px-6 py-3 rounded-full transition-all group"
            >
              Begin Ritual <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 text-accent">
              <Star size={24} />
              <h4 className="text-xl font-serif uppercase tracking-wider">The Ritual</h4>
            </div>
            <RitualViewer ritual={content.ritual} />
            <button
              onClick={() => setStep(4)}
              className="mt-8 flex items-center gap-2 bg-primary/20 hover:bg-primary/40 text-accent px-6 py-3 rounded-full transition-all group"
            >
              Seal the Energy <ChevronRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex items-center gap-3 text-accent">
              <CheckCircle size={24} />
              <h4 className="text-xl font-serif uppercase tracking-wider">Reflection & Integration</h4>
            </div>

            <div className="space-y-4">
              <QuizComponent key={activeQuiz === content.quiz ? 'static' : 'dynamic'} quiz={activeQuiz} onComplete={() => {}} />

              {activeQuiz === content.quiz && (
                <>
                  <p className="text-center text-xs text-foreground-muted">or</p>
                  <button
                    onClick={async () => {
                      setGeneratingQuiz(true);
                      setQuizError("");
                      try {
                        const res = await fetch("/api/quiz", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ virtue: content.virtue, day }),
                        });
                        if (!res.ok) {
                          const errorPayload = await res.json().catch(() => ({}));
                          setQuizError(errorPayload?.error || "Unable to generate wisdom check right now. Please try again.");
                          return;
                        }

                        const dynamicQuiz = await res.json();
                        if (Array.isArray(dynamicQuiz) && dynamicQuiz.length > 0) {
                          setActiveQuiz(dynamicQuiz);
                        } else {
                          setQuizError("Received an invalid wisdom check. Please try again.");
                        }
                      } catch (e) {
                        setQuizError("Connection issue while generating wisdom check. Please try again.");
                      } finally {
                        setGeneratingQuiz(false);
                      }
                    }}
                    disabled={generatingQuiz}
                    className="w-full py-2 border border-accent/20 text-accent rounded-lg text-sm hover:bg-accent/5 transition-all disabled:opacity-50"
                  >
                    {generatingQuiz ? "Generating..." : "Generate Personalized Wisdom Check (AI)"}
                  </button>
                  {quizError && <p className="text-xs text-red-400 text-center">{quizError}</p>}
                </>
              )}
            </div>

            <div className="pt-8">
              <label className="block text-sm text-foreground-muted mb-3 italic">What insights did you gain today?</label>
              <textarea
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full bg-background border border-primary/20 rounded-xl p-6 text-foreground focus:outline-none focus:border-accent transition-colors h-40"
                placeholder="Share your sacred thoughts..."
              />
            </div>

            <button
              onClick={handleFinish}
              disabled={saving}
              className="w-full bg-accent hover:bg-accent-light text-background font-bold py-4 rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {saving ? "Integrating..." : "Complete Day " + day}
            </button>
            {completionError && <p className="text-sm text-red-300 text-center">{completionError}</p>}
          </div>
        )}
      </div>
    </div>
  );
}
