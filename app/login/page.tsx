"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";
import { trackSignup } from "@/lib/analytics";
import { getAttribution } from "@/lib/utm";

const DEFAULT_APP_REDIRECT = "clipagent://auth-callback";

function isAllowedAppRedirect(redirect: string): boolean {
  return redirect === DEFAULT_APP_REDIRECT;
}

function LoginInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const desktop = searchParams.get("desktop") === "true";
  const requestedRedirect = searchParams.get("redirect") ?? (desktop ? DEFAULT_APP_REDIRECT : "");
  const redirect = requestedRedirect && isAllowedAppRedirect(requestedRedirect)
    ? requestedRedirect
    : "";

  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  const isDesktopFlow = !!redirect;

  useEffect(() => {
    if (!session) return;
    if (isDesktopFlow) return;
    router.replace("/account");
  }, [isDesktopFlow, router, session]);

  const handleContinueToApp = () => {
    if (!redirect) {
      setError("Missing redirect. Open this page from the app.");
      return;
    }
    window.location.href = `https://klipprr.com/auth/callback?redirect=${encodeURIComponent(redirect)}`;
  };

  const handleSignInWithPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);
    try {
      const attribution = mode === "signup" ? getAttribution() : null;
      const { error: err } =
        mode === "signin"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: {
                emailRedirectTo: redirect
                  ? `https://klipprr.com/auth/callback?redirect=${encodeURIComponent(redirect)}`
                  : undefined,
                data: attribution ? { attribution } : undefined,
              },
            });
      if (err) {
        setError(err.message);
        return;
      }
      if (mode === "signup") {
        trackSignup("email", { email });
        setError("Check your email to confirm your account, then sign in.");
      }
      if (redirect) {
        window.location.href = `https://klipprr.com/auth/callback?redirect=${encodeURIComponent(redirect)}`;
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setAuthLoading(true);
    try {
      const redirectTo = redirect
        ? `https://klipprr.com/auth/callback?redirect=${encodeURIComponent(redirect)}`
        : `${typeof window !== "undefined" ? window.location.origin : ""}/login`;
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo },
      });
      if (err) setError(err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Fire signup event for new OAuth users (user created within the last 60s).
  // Email/password signup fires immediately in handleSignInWithPassword.
  useEffect(() => {
    if (!session?.user) return;
    const createdAt = session.user.created_at ? Date.parse(session.user.created_at) : 0;
    if (!createdAt) return;
    const ageMs = Date.now() - createdAt;
    if (ageMs < 0 || ageMs > 60_000) return;
    const key = `klipprr_signup_tracked_${session.user.id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    const provider = (session.user.app_metadata as { provider?: string } | undefined)?.provider;
    trackSignup(provider === "google" ? "google" : "email", {
      email: session.user.email ?? null,
      userId: session.user.id,
    });
  }, [session]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm">Loading…</span>
        </div>
      </div>
    );
  }

  if (session && !isDesktopFlow) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <div className="flex items-center gap-3 text-zinc-500">
          <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span className="text-sm">Redirecting…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/4 top-0 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
        <div className="absolute right-0 bottom-0 h-[400px] w-[400px] translate-x-1/4 translate-y-1/4 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #c935ff 0%, transparent 70%)" }} />
      </div>

      <main className="relative mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 md:grid-cols-2">
        {/* Left panel */}
        <section className="hidden md:flex md:flex-col">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/logo.png" alt="Klipprr" width={36} height={36} className="rounded-xl" />
            <span className="text-lg font-semibold tracking-tight text-white">Klipprr</span>
          </Link>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-white leading-tight">
            Log in or sign up<br />in seconds
          </h1>
          <p className="mt-4 max-w-sm text-base text-zinc-400 leading-relaxed">
            Create viral clips from any video. Start on Free, upgrade when you hit your monthly clip limit.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              "Works with YouTube, Twitch, X, Instagram, and local files",
              "Frame-accurate trimming with lightning-fast exports",
              "No free trial. Transparent monthly clip limits.",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm text-zinc-400">
                <svg className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 0 1 .143 1.052l-8 10.5a.75.75 0 0 1-1.127.075l-4.5-4.5a.75.75 0 0 1 1.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 0 1 1.05-.143Z" clipRule="evenodd" />
                </svg>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Right panel — form */}
        <section className="flex justify-center md:justify-end">
          <div className="w-full max-w-md rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-7 shadow-2xl backdrop-blur-sm">
            {/* Mobile logo */}
            <div className="mb-6 md:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <Image src="/logo.png" alt="Klipprr" width={32} height={32} className="rounded-xl" />
                <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
              </Link>
            </div>

            <h2 className="text-xl font-semibold text-white">
              {isDesktopFlow ? "Link your desktop app" : mode === "signin" ? "Welcome back" : "Create your account"}
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              {isDesktopFlow ? "Sign in to link your account with the desktop app." : "Sign in to your Klipprr account."}
            </p>

            {session ? (
              <div className="mt-6 space-y-3">
                <p className="text-sm text-zinc-300">
                  Signed in as <strong className="text-white">{session.user.email}</strong>
                </p>
                <button
                  type="button"
                  onClick={handleContinueToApp}
                  className="w-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  Continue as {session.user.email}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await supabase.auth.signOut();
                    setSession(null);
                  }}
                  className="w-full text-sm text-zinc-500 transition-colors hover:text-white"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {/* Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="flex w-full cursor-pointer items-center justify-center gap-3 rounded-full border border-zinc-700 bg-zinc-800/60 py-2.5 text-sm font-medium text-white transition-all duration-150 hover:border-zinc-600 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  Continue with Google
                </button>

                <div className="flex items-center gap-3">
                  <span className="flex-1 border-t border-zinc-800" />
                  <span className="text-xs text-zinc-600">or</span>
                  <span className="flex-1 border-t border-zinc-800" />
                </div>

                {/* Email/password form */}
                <form onSubmit={handleSignInWithPassword} className="space-y-4">
                  <div className="space-y-1.5">
                    <label htmlFor="email" className="block text-xs font-medium text-zinc-400">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                      required
                      autoComplete="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label htmlFor="password" className="block text-xs font-medium text-zinc-400">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={mode === "signup" ? "Choose a password" : "Your password"}
                        className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-3.5 py-2.5 pr-10 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                        required
                        autoComplete={mode === "signin" ? "current-password" : "new-password"}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
                            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && (
                    <p className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-400" role="alert">
                      {error}
                    </p>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={authLoading}
                      className="flex-1 cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {authLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <svg className="h-3.5 w-3.5 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          Loading…
                        </span>
                      ) : mode === "signin" ? "Sign in" : "Create account"}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setMode((m) => (m === "signin" ? "signup" : "signin")); setError(null); }}
                      className="cursor-pointer rounded-full border border-zinc-700 px-4 py-2.5 text-sm text-zinc-400 transition-all duration-150 hover:border-zinc-600 hover:text-white"
                    >
                      {mode === "signin" ? "Sign up" : "Sign in"}
                    </button>
                  </div>

                  <p className="text-xs text-zinc-600">
                    By continuing, you agree to our{" "}
                    <Link className="text-zinc-400 transition-colors hover:text-white" href="/terms">Terms</Link>{" "}
                    and acknowledge our{" "}
                    <Link className="text-zinc-400 transition-colors hover:text-white" href="/privacy">Privacy Policy</Link>.
                  </p>
                </form>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-zinc-950" />}>
      <LoginInner />
    </Suspense>
  );
}
