"use client";

import { Suspense, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

function ClipAgentAuthInner() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get("redirect") ?? "clipagent://auth-callback";
    const loginUrl = `https://klipprr.com/login?redirect=${encodeURIComponent(redirect)}`;
    window.location.replace(loginUrl);
  }, [searchParams]);

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <svg className="h-5 w-5 animate-spin text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
      </svg>
      <p className="text-sm text-zinc-400">Redirecting to sign in…</p>
    </div>
  );
}

export default function ClipAgentAuthPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
      </div>
      <div className="relative flex min-h-screen flex-col items-center justify-center gap-6 px-4">
        <Link href="/">
          <Image src="/logo.png" alt="Klipprr" width={36} height={36} className="rounded-xl" />
        </Link>
        <Suspense fallback={
          <svg className="h-5 w-5 animate-spin text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
        }>
          <ClipAgentAuthInner />
        </Suspense>
      </div>
    </div>
  );
}
