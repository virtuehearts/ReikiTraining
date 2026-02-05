"use client";

import { useState } from "react";

interface IntakeFormProps {
  onComplete: () => void;
  initialData?: any;
}

export default function IntakeForm({ onComplete, initialData }: IntakeFormProps) {
  const [formData, setFormData] = useState({
    age: initialData?.age || "",
    location: initialData?.location || "",
    experience: initialData?.experience || "None",
    goal: initialData?.goal || "",
    healthConcerns: initialData?.healthConcerns || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onComplete();
      } else {
        setError("Failed to save intake data");
      }
    } catch (err) {
      setError("An error occurred while saving");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background-alt p-8 rounded-2xl border border-primary/20 shadow-2xl max-w-2xl mx-auto">
      <h2 className="text-3xl font-serif text-accent mb-6 text-center">Your Sacred Intake</h2>
      <p className="text-foreground-muted mb-8 text-center italic">
        "To better guide your journey, please share a glimpse of your path."
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="age" className="block text-sm font-medium text-foreground-muted mb-1">Age</label>
            <input
              id="age"
              type="number"
              className="w-full px-4 py-2 rounded bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
            />
          </div>
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-foreground-muted mb-1">Location</label>
            <input
              id="location"
              type="text"
              className="w-full px-4 py-2 rounded bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm font-medium text-foreground-muted mb-1">Reiki Experience</label>
          <select
            id="experience"
            className="w-full px-4 py-2 rounded bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent"
            value={formData.experience}
            onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
          >
            <option value="None">None</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label htmlFor="goal" className="block text-sm font-medium text-foreground-muted mb-1">What is your primary goal for this training?</label>
          <textarea
            id="goal"
            className="w-full px-4 py-2 rounded bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent h-24"
            value={formData.goal}
            onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
            placeholder="e.g., Finding peace, healing from stress..."
          />
        </div>

        <div>
          <label htmlFor="healthConcerns" className="block text-sm font-medium text-foreground-muted mb-1">Any health concerns or focus areas?</label>
          <textarea
            id="healthConcerns"
            className="w-full px-4 py-2 rounded bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent h-24"
            value={formData.healthConcerns}
            onChange={(e) => setFormData({ ...formData, healthConcerns: e.target.value })}
            placeholder="e.g., Back pain, anxiety..."
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-4 bg-accent text-background font-bold rounded-lg hover:bg-accent-light transition-all shadow-lg uppercase tracking-widest"
        >
          {loading ? "Saving..." : "Commence Training"}
        </button>
      </form>
    </div>
  );
}
