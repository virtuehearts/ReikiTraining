"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface Ritual {
  title: string;
  steps: string[];
}

export default function RitualViewer({ ritual }: { ritual: Ritual }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-accent/20 rounded-2xl overflow-hidden bg-background">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 bg-accent/5 hover:bg-accent/10 transition-colors"
      >
        <h5 className="font-serif text-2xl text-accent">{ritual.title}</h5>
        {isOpen ? <ChevronUp className="text-accent" /> : <ChevronDown className="text-accent" />}
      </button>

      {isOpen && (
        <div className="p-8 space-y-6 animate-in slide-in-from-top-4 duration-500">
          {ritual.steps.map((step, index) => (
            <div key={index} className="flex gap-4">
              <span className="flex-shrink-0 w-8 h-8 rounded-full border border-accent/30 flex items-center justify-center text-xs text-accent font-serif">
                {index + 1}
              </span>
              <p className="text-foreground-muted leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
