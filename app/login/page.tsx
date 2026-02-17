"use client";

import { useState, Suspense, useEffect } from "react";
import { signIn, signOut, getProviders, getSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

const getSafeCallbackUrl = (rawCallbackUrl: string | null) => {
  if (!rawCallbackUrl) {
    return "/dashboard";
  }

  if (rawCallbackUrl.startsWith("/")) {
    return rawCallbackUrl;
  }

  if (typeof window !== "undefined") {
    const parsed = new URL(rawCallbackUrl, window.location.origin);
    const isLocalPath = parsed.origin === window.location.origin;

    if (isLocalPath) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}`;
    }
  }

  return "/dashboard";
};

function LoginContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<any>(null);
  const searchParams = useSearchParams();
  const callbackUrl = getSafeCallbackUrl(searchParams.get("callbackUrl"));
  const isAdminLogin = callbackUrl.includes("/admin");

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const existingSession = await getSession();
      if (existingSession) {
        await signOut({ redirect: false });
      }

      const res = await signIn("credentials", {
        email,
        password,
        callbackUrl,
        redirect: false,
      });

      if (res?.error) {
        console.error("[Auth] Login failed:", res.error);
        // Map common NextAuth error codes to user-friendly messages
        const errorMsg = res.error === "CredentialsSignin"
          ? "Invalid email or password"
          : res.error;
        setError(errorMsg);
      } else {
        const safeResultUrl = getSafeCallbackUrl(res?.url || callbackUrl);
        window.location.assign(safeResultUrl);
      }
    } catch (err) {
      setError("An error occurred during sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = () => {
    signIn("google", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className={`max-w-md w-full space-y-8 bg-background-alt p-8 rounded-2xl border ${isAdminLogin ? 'border-accent/40 shadow-accent/10' : 'border-primary/20'} shadow-2xl transition-all duration-500`}>
        <div className="text-center">
          <h2 className="text-4xl font-serif text-accent mb-2">
            {isAdminLogin ? "Admin Sanctuary" : "Welcome Back"}
          </h2>
          <p className="text-foreground-muted font-sans">
            {isAdminLogin ? "Enter the Inner Sanctum" : "Return to your sacred training"}
          </p>
        </div>

        <div className="mt-8 space-y-6">
          {providers?.google && (
            <>
              <button
                onClick={handleGoogleSignIn}
                className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white text-gray-900 rounded-lg font-semibold hover:bg-gray-100 transition-all shadow-md"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign in with Google
              </button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-primary/30"></span>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-background-alt text-foreground-muted">Or continue with email</span>
                </div>
              </div>
            </>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-500/10 border border-red-500 text-red-500 p-3 rounded-lg text-sm text-center">
                {error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 bg-gradient-to-r ${isAdminLogin ? 'from-accent to-accent-light hover:from-accent-light hover:to-accent' : 'from-primary to-primary-light hover:from-primary-light hover:to-primary'} text-white rounded-lg font-semibold transition-all shadow-lg ${isAdminLogin ? 'shadow-accent/20' : 'shadow-primary/20'} disabled:opacity-50`}
            >
              {loading ? "Channelling..." : (isAdminLogin ? "Enter Sanctuary" : "Sign In")}
            </button>
          </form>

          <div className="text-center space-y-4">
            {!isAdminLogin ? (
              <p className="text-foreground-muted">
                New to the training?{" "}
                <Link href="/register" className="text-accent hover:text-accent-light transition-colors">
                  Join Now
                </Link>
              </p>
            ) : (
              <Link href="/" className="text-sm text-foreground-muted hover:text-accent transition-colors">
                ← Return to Temple
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center text-accent">Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
