"use client";

import { Suspense } from "react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function isAllowedAppRedirect(redirect: string): boolean {
  return redirect === "clipagent://auth-callback";
}

function buildDeepLink(
  redirect: string,
  accessToken: string,
  refreshToken: string,
  expiresAt?: string
): string {
  let link = `${redirect}#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
  if (expiresAt) link += `&expires_at=${encodeURIComponent(expiresAt)}`;
  return link;
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-7 shadow-2xl backdrop-blur-sm">
      <div className="mb-6 flex justify-center">
        <Link href="/">
          <Image src="/logo.png" alt="Klipprr" width={36} height={36} className="rounded-xl" />
        </Link>
      </div>
      {children}
    </div>
  );
}

function CallbackInner() {
  const searchParams = useSearchParams();
  const requestedRedirect = searchParams.get("redirect") ?? "clipagent://auth-callback";
  const redirect = isAllowedAppRedirect(requestedRedirect)
    ? requestedRedirect
    : "clipagent://auth-callback";

  const [deepLink, setDeepLink] = useState<string | null>(null);
  const [noSession, setNoSession] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const hash = window.location.hash.startsWith("#")
      ? window.location.hash.slice(1)
      : window.location.hash;

    const params = new URLSearchParams(hash);
    const accessToken = params.get("access_token");
    const refreshToken = params.get("refresh_token");
    const expiresAt = params.get("expires_at") ?? params.get("expires_in") ?? "";

    if (accessToken && refreshToken) {
      const link = buildDeepLink(redirect, accessToken, refreshToken, expiresAt || undefined);
      setDeepLink(link);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.access_token && session?.refresh_token) {
        const link = buildDeepLink(
          redirect,
          session.access_token,
          session.refresh_token,
          session.expires_at ? String(session.expires_at) : undefined
        );
        setDeepLink(link);
      } else {
        setNoSession(true);
      }
    });
  }, [redirect]);

  useEffect(() => {
    if (!deepLink) return;
    const t = setTimeout(() => { window.location.href = deepLink; }, 200);
    return () => clearTimeout(t);
  }, [deepLink]);

  const hasTokens = useMemo(() => !!deepLink, [deepLink]);

  if (!hasTokens && !noSession) {
    return (
      <Card>
        <div className="flex flex-col items-center gap-3 text-center">
          <svg className="h-5 w-5 animate-spin text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm text-zinc-400">Redirecting to Klipprr…</p>
        </div>
      </Card>
    );
  }

  if (!hasTokens && noSession) {
    return (
      <Card>
        <h1 className="text-lg font-semibold text-white">Something went wrong</h1>
        <p className="mt-2 text-sm text-zinc-400">
          We couldn&apos;t find a login session. Sign in first, then try again.
        </p>
        <a
          href={`/login?redirect=${encodeURIComponent(redirect)}`}
          className="mt-5 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
        >
          Sign in
        </a>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
          <path d="M20 6 9 17l-5-5"/>
        </svg>
      </div>
      <h1 className="text-lg font-semibold text-white">Open Klipprr</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Click the button below to open the app and log in. Your browser may not open it automatically.
      </p>
      {deepLink && (
        <>
          <a
            href={deepLink}
            className="mt-5 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
          >
            Open Klipprr
          </a>
          <p className="mt-3 text-xs text-zinc-600">
            If nothing happens, make sure Klipprr is installed and try again.
          </p>
        </>
      )}
    </Card>
  );
}

export default function Page() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
      </div>
      <div className="relative flex min-h-screen items-center justify-center px-4">
        <Suspense fallback={
          <Card>
            <div className="flex justify-center">
              <svg className="h-5 w-5 animate-spin text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          </Card>
        }>
          <CallbackInner />
        </Suspense>
      </div>
    </div>
  );
}
