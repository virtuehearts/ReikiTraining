"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (res.ok) {
        // Automatically sign in after registration
        const signInRes = await signIn("credentials", {
          email,
          password,
          redirect: false,
        });

        if (signInRes?.ok) {
          router.push("/pending");
        } else {
          router.push("/login");
        }
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong");
      }
    } catch (err) {
      setError("An error occurred during registration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-8 bg-background-alt p-8 rounded-2xl border border-primary/20 shadow-2xl">
        <div className="text-center">
          <h2 className="text-4xl font-serif text-accent mb-2">Join the Journey</h2>
          <p className="text-foreground-muted">Begin your 7-day Reiki transformation</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground-muted mb-1">Full Name</label>
              <input
                id="name"
                type="text"
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent transition-colors"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground-muted mb-1">Email Address</label>
              <input
                id="email"
                type="email"
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent transition-colors"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground-muted mb-1">Password</label>
              <input
                id="password"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent transition-colors"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground-muted mb-1">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="w-full px-4 py-3 rounded-lg bg-background border border-primary/30 text-foreground focus:outline-none focus:border-accent transition-colors"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-primary to-primary-light text-white rounded-lg font-semibold hover:from-primary-light hover:to-primary transition-all shadow-lg hover:shadow-primary/20 disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="text-center mt-6">
          <p className="text-foreground-muted">
            Already have an account?{" "}
            <Link href="/login" className="text-accent hover:text-accent-light transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
