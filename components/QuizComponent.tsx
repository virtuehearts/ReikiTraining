"use client";

import { useState } from "react";

interface QuizItem {
  question: string;
  options: string[];
  correct: number;
}

interface QuizComponentProps {
  quiz: QuizItem[];
  onComplete: () => void;
}

export default function QuizComponent({ quiz, onComplete }: QuizComponentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const handleOptionSelect = (index: number) => {
    if (showFeedback) return;
    setSelectedOption(index);
    setShowFeedback(true);
    if (index === quiz[currentQuestion].correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    setShowFeedback(false);
    setSelectedOption(null);
    if (currentQuestion + 1 < quiz.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setFinished(true);
      onComplete();
    }
  };

  if (finished) {
    return (
      <div className="bg-primary/5 p-6 rounded-xl border border-primary/20 text-center">
        <p className="text-accent font-serif text-xl mb-2">Wisdom Integrated</p>
        <p className="text-foreground-muted">You answered {score} of {quiz.length} correctly.</p>
      </div>
    );
  }

  const question = quiz[currentQuestion];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[10px] uppercase tracking-widest text-accent font-bold">Wisdom Check</span>
        <span className="text-[10px] text-foreground-muted">{currentQuestion + 1} / {quiz.length}</span>
      </div>

      <p className="text-lg font-medium">{question.question}</p>

      <div className="space-y-3">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleOptionSelect(index)}
            disabled={showFeedback}
            className={`w-full text-left p-4 rounded-xl border transition-all ${
              selectedOption === index
                ? index === question.correct
                  ? "bg-green-500/10 border-green-500 text-green-400"
                  : "bg-red-500/10 border-red-500 text-red-400"
                : showFeedback && index === question.correct
                ? "bg-green-500/10 border-green-500 text-green-400"
                : "bg-background border-primary/10 hover:border-accent/40"
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {showFeedback && (
        <button
          onClick={nextQuestion}
          className="w-full mt-4 text-accent text-sm underline underline-offset-4 hover:text-accent-light"
        >
          {currentQuestion + 1 < quiz.length ? "Next Wisdom" : "Complete Quiz"}
        </button>
      )}
    </div>
  );
}
