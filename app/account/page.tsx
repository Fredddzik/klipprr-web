"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

type LicenseRow = {
  plan: string | null;
  expires_at: string | null;
  active?: boolean | null;
};

type SubscriptionSummary = {
  active: boolean;
  status?: string;
  plan?: string;
  next_billing_at?: string | null;
  amount_minor?: number | null;
  currency?: string | null;
  interval?: string | null;
  cancel_at_period_end?: boolean;
};

function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function normalizePlan(plan: string | null | undefined): "free" | "pro" | "max" {
  const p = (plan ?? "").toString().trim().toLowerCase();
  if (p === "max") return "max";
  if (p === "pro") return "pro";
  return "free";
}

function planLabel(plan: "free" | "pro" | "max") {
  if (plan === "max") return "Max";
  if (plan === "pro") return "Pro";
  return "Free";
}

function formatMoney(minor: number | null | undefined, currency: string | null | undefined): string | null {
  if (typeof minor !== "number" || !currency) return null;
  const major = minor / 100;
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: currency.toUpperCase() }).format(major);
  } catch {
    return `${major.toFixed(2)} ${currency.toUpperCase()}`;
  }
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-violet-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function AccountPage() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [license, setLicense] = useState<LicenseRow | null>(null);
  const [licenseLoading, setLicenseLoading] = useState(false);
  const [subSummary, setSubSummary] = useState<SubscriptionSummary | null>(null);
  const [subLoading, setSubLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session?.user?.id) { setLicense(null); return; }
    setLicenseLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from("licenses")
          .select("plan, expires_at, active")
          .eq("user_id", session.user.id)
          .eq("active", true)
          .maybeSingle();
        if (error) { setLicense(null); return; }
        setLicense((data as LicenseRow | null) ?? null);
      } catch { setLicense(null); }
      finally { setLicenseLoading(false); }
    })();
  }, [session?.user?.id]);

  const plan = useMemo(() => normalizePlan(license?.plan), [license?.plan]);
  const exp = useMemo(() => formatDate(license?.expires_at ?? null), [license?.expires_at]);
  const nextBilling = useMemo(() => formatDate(subSummary?.next_billing_at ?? null), [subSummary?.next_billing_at]);
  const nextAmount = useMemo(() => formatMoney(subSummary?.amount_minor, subSummary?.currency), [subSummary?.amount_minor, subSummary?.currency]);

  useEffect(() => {
    if (!session?.access_token) { setSubSummary(null); return; }
    setSubLoading(true);
    fetch("/api/stripe/subscription", {
      method: "GET",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then(async (res) => {
        const raw = await res.text();
        const json = raw ? (JSON.parse(raw) as SubscriptionSummary) : null;
        if (!res.ok) { setSubSummary(null); return; }
        setSubSummary(json);
      })
      .catch(() => setSubSummary(null))
      .finally(() => setSubLoading(false));
  }, [session?.access_token]);

  const openBillingPortal = async () => {
    if (!session?.access_token) return;
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const raw = await res.text();
      const json = raw ? (JSON.parse(raw) as { url?: string; error?: string }) : null;
      if (!res.ok || !json?.url) { alert(json?.error || `Could not open billing portal (HTTP ${res.status})`); return; }
      window.location.href = json.url;
    } catch { alert("Could not open billing portal. Please try again."); }
    finally { setPortalLoading(false); }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Spinner />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/4 rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
        </div>
        <header className="relative border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
          <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Klipprr" width={30} height={30} className="rounded-lg" priority />
              <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
            </Link>
            <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-white">Sign in</Link>
          </nav>
        </header>
        <main className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center px-6">
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-7 shadow-2xl backdrop-blur-sm text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-400">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-white">Account</h1>
            <p className="mt-2 text-sm text-zinc-400">You&apos;re signed out. Sign in to view your account.</p>
            <Link
              href="/login"
              className="mt-5 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
            >
              Sign in
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const planColor = plan === "max"
    ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
    : plan === "pro"
      ? "bg-violet-500/15 text-violet-300 border-violet-500/20"
      : "bg-zinc-700/50 text-zinc-300 border-zinc-700";

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
      </div>

      <header className="relative border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Klipprr" width={30} height={30} className="rounded-lg" priority />
            <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/download" className="text-sm text-zinc-400 transition-colors hover:text-white">Download</Link>
            <Link href="/#pricing" className="text-sm text-zinc-400 transition-colors hover:text-white">Upgrade</Link>
          </div>
        </nav>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-14">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">Account</h1>
          <p className="mt-1 text-sm text-zinc-500">Manage your Klipprr subscription and session.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Profile card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Signed in as</p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-500/20 text-violet-300 text-sm font-semibold">
                {session.user.email?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{session.user.email}</p>
                <p className="text-xs text-zinc-600">Supabase account</p>
              </div>
            </div>
          </div>

          {/* Plan card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Plan</p>
            <div className="mt-3 flex items-center gap-2">
              <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${planColor}`}>
                {planLabel(plan)}
              </span>
              {(licenseLoading || subLoading) && <Spinner />}
            </div>
            <p className="mt-2 text-sm text-zinc-400">
              {plan === "free"
                ? "You're on the Free plan."
                : nextBilling && nextAmount
                  ? `Next charge ${nextAmount} on ${nextBilling}.`
                  : exp
                    ? `Renews/ends on ${exp}.`
                    : "Active subscription."}
            </p>
            {plan === "free" && (
              <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Free exports include a <span className="text-white font-medium">watermark</span> and are capped at <span className="text-white font-medium">720p</span>. Upgrade to Pro for no watermark, up to 4K, and 120 clips/month.
                </p>
                <Link
                  href="/#pricing"
                  className="mt-2.5 inline-flex items-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-md shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  Upgrade to Pro →
                </Link>
              </div>
            )}
            {plan !== "free" && subSummary?.cancel_at_period_end && (
              <p className="mt-2 text-xs text-amber-400">
                Cancellation scheduled — access until end of current period.
              </p>
            )}
          </div>

          {/* Billing card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Billing</p>
            <p className="mt-2 text-sm text-zinc-400">
              Change your plan, manage payment methods, download invoices, or cancel.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/#pricing"
                className="rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:text-white"
              >
                Change plan
              </Link>
              <button
                type="button"
                onClick={openBillingPortal}
                disabled={portalLoading || plan === "free"}
                className="cursor-pointer rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {portalLoading ? (
                  <span className="flex items-center gap-2"><Spinner /> Opening…</span>
                ) : "Manage billing"}
              </button>
            </div>
          </div>

          {/* Session card */}
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 md:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Session</p>
            <p className="mt-2 text-sm text-zinc-400">
              If you&apos;re on a shared computer, sign out when you&apos;re done.
            </p>
            <button
              type="button"
              onClick={async () => { await supabase.auth.signOut(); window.location.href = "/login"; }}
              className="mt-4 cursor-pointer rounded-full border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-all duration-150 hover:border-red-500/40 hover:text-red-400"
            >
              Sign out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
