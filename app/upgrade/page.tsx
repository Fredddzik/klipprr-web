"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import type { AuthResponse, Session, PostgrestSingleResponse, AuthError } from "@supabase/supabase-js";
import { trackPurchase, trackCheckoutStarted } from "@/lib/analytics";

const STRIPE_CHECKOUT_API = "/api/stripe/checkout";

function createSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new Error("Missing Supabase env vars");
  return createClient(url, key);
}

type License = { plan: string; expires_at: string | null };
type PaidTier = "pro" | "max";
type BillingPeriod = "monthly" | "yearly";

function isAllowedAppRedirect(redirect: string): boolean {
  return redirect === "clipagent://auth-callback";
}

function buildDeepLink(redirect: string, accessToken: string, refreshToken: string, expiresAt?: string): string {
  let link = `${redirect}#access_token=${encodeURIComponent(accessToken)}&refresh_token=${encodeURIComponent(refreshToken)}`;
  if (expiresAt) link += `&expires_at=${encodeURIComponent(expiresAt)}`;
  return link;
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
    </svg>
  );
}

export default function UpgradePage() {
  const [session, setSession] = useState<any>(null);
  const [license, setLicense] = useState<License | null>(null);
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [supabase, setSupabase] = useState<any>(null);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [selectedTier, setSelectedTier] = useState<PaidTier>("pro");
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>("yearly");
  const successParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("success") : null;
  const sessionIdParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("session_id") : null;
  const canceledParam = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("canceled") : null;
  const [openAttempted, setOpenAttempted] = useState(false);
  const [purchaseTracked, setPurchaseTracked] = useState(false);

  useEffect(() => {
    try { setSupabase(createSupabaseClient()); } catch (e) { console.error("[Upgrade] Supabase init failed:", e); }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then((res: AuthResponse) => { setSession(res.data.session); });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => { setSession(session); });
    setMounted(true);
    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!supabase) return;
    if (!session?.access_token || !session?.refresh_token) return;
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
    const redirectTo = searchParams.get("redirectTo") || hashParams.get("redirectTo");
    if (redirectTo && isAllowedAppRedirect(redirectTo)) {
      const expiresAt = session.expires_at ? String(session.expires_at) : "";
      const deepLink = `${redirectTo}#access_token=${encodeURIComponent(session.access_token)}&refresh_token=${encodeURIComponent(session.refresh_token)}` + (expiresAt ? `&expires_at=${encodeURIComponent(expiresAt)}` : "");
      window.location.href = deepLink;
    }
  }, [supabase, session]);

  useEffect(() => {
    if (successParam !== "1") return;
    if (openAttempted) return;
    if (!session?.access_token || !session?.refresh_token) return;
    const t = setTimeout(() => {
      const deepLink = buildDeepLink("clipagent://auth-callback", session.access_token, session.refresh_token, session.expires_at ? String(session.expires_at) : undefined);
      setOpenAttempted(true);
      window.location.href = deepLink;
    }, 500);
    return () => clearTimeout(t);
  }, [openAttempted, session?.access_token, session?.expires_at, session?.refresh_token, successParam]);

  const refreshLicense = () => {
    if (!supabase || !session?.user?.id) return;
    supabase.from("licenses").select("plan, expires_at, active").eq("user_id", session.user.id).eq("active", true).maybeSingle()
      .then((res: PostgrestSingleResponse<any>) => {
        const data = res.data;
        if (!data) { setLicense(null); return; }
        if (!data.expires_at || new Date(data.expires_at) > new Date()) setLicense({ plan: data.plan, expires_at: data.expires_at });
        else setLicense(null);
      });
  };

  useEffect(() => { if (!supabase || !session?.user?.id) return; refreshLicense(); }, [supabase, session]);
  useEffect(() => { if (successParam === "1" && supabase && session?.user?.id) refreshLicense(); }, [successParam, supabase, session?.user?.id]);

  useEffect(() => {
    if (purchaseTracked) return;
    if (successParam !== "1") return;
    if (!license?.plan) return;
    const key = sessionIdParam ? `klipprr_purchase_tracked_${sessionIdParam}` : null;
    try {
      if (key && sessionStorage.getItem(key)) { setPurchaseTracked(true); return; }
      if (key) sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    trackPurchase(license.plan, billingPeriod, sessionIdParam ?? undefined);
    setPurchaseTracked(true);
  }, [billingPeriod, license?.plan, purchaseTracked, sessionIdParam, successParam]);

  if (!mounted) return null;

  const isSuccess = successParam === "1";
  const canDeepLink = !!session?.access_token && !!session?.refresh_token;
  const successDeepLink = canDeepLink
    ? buildDeepLink("clipagent://auth-callback", session.access_token, session.refresh_token, session.expires_at ? String(session.expires_at) : undefined)
    : null;

  // Success state
  if (isSuccess && session && license) {
    const planLabel = (license.plan || "").toLowerCase() === "max" ? "Max" : "Pro";
    return (
      <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-15"
            style={{ background: "radial-gradient(ellipse at center, #10b981 0%, transparent 70%)" }} />
        </div>
        <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
          <Link href="/" className="mb-8 flex items-center gap-2.5">
            <Image src="/logo.png" alt="Klipprr" width={32} height={32} className="rounded-xl" />
            <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
          </Link>
          <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 border border-emerald-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <path d="M20 6 9 17l-5-5"/>
              </svg>
            </div>
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">Payment successful</p>
            <h1 className="mt-2 text-xl font-bold text-white">You&apos;re all set</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Your <strong className="text-white">{planLabel}</strong> plan is active for{" "}
              <strong className="text-white">{session.user?.email}</strong>.
            </p>
            {successDeepLink ? (
              <>
                <button
                  type="button"
                  onClick={() => { window.location.href = successDeepLink; }}
                  className="mt-6 flex w-full cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
                >
                  Open Klipprr
                </button>
                <p className="mt-2 text-xs text-zinc-600">Make sure Klipprr is installed, then click the button.</p>
              </>
            ) : (
              <Link href="/login" className="mt-6 flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500">
                Sign in again
              </Link>
            )}
            <div className="mt-6 flex items-center justify-center gap-4 text-sm">
              <Link href="/account" className="text-zinc-500 transition-colors hover:text-white">View account</Link>
              <span className="text-zinc-700">·</span>
              <Link href="/" className="text-zinc-500 transition-colors hover:text-white">Back to home</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const subscribeWithStripe = async () => {
    if (!session?.access_token) { setStatus("Please log in first."); return; }
    setStripeLoading(true);
    setStatus(null);
    trackCheckoutStarted(selectedTier, billingPeriod);
    try {
      const res = await fetch(STRIPE_CHECKOUT_API, {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tier: selectedTier, billing: billingPeriod }),
      });
      const raw = await res.text();
      let data: any = null;
      try { data = raw ? JSON.parse(raw) : null; } catch { data = null; }
      if (!res.ok) { setStatus((data && data.error) || `Could not start checkout (HTTP ${res.status})`); return; }
      if (data?.url) window.location.href = data.url;
      else setStatus(data?.error || "Missing checkout URL.");
    } catch (e) {
      setStatus("Checkout failed. Try again.");
    } finally { setStripeLoading(false); }
  };

  const redeemCode = async () => {
    if (!supabase) return;
    if (!code.trim()) return;
    setLoading(true);
    setStatus(null);
    const { error } = await supabase.functions.invoke("redeem_activation_code", { body: { code } });
    if (error) {
      setStatus(error.message || "Activation failed.");
    } else {
      setStatus("Activation successful. You can return to the app.");
      const { data: freshLicense } = await supabase.from("licenses").select("plan, active").eq("user_id", session.user.id).maybeSingle();
      if (!freshLicense || freshLicense.active !== true) { setStatus("Activation succeeded, but subscription is not active yet. Please refresh."); setLoading(false); return; }
      supabase.from("licenses").select("plan, expires_at").eq("user_id", session.user.id).maybeSingle()
        .then((res: PostgrestSingleResponse<any>) => {
          const data = res.data;
          if (!data) { setLicense(null); return; }
          if (!data.expires_at || new Date(data.expires_at) > new Date()) setLicense(data);
        });
    }
    setLoading(false);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
      </div>
      <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="mb-8 flex items-center gap-2.5">
          <Image src="/logo.png" alt="Klipprr" width={32} height={32} className="rounded-xl" />
          <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
        </Link>

        <div className="w-full max-w-sm rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-7 shadow-2xl backdrop-blur-sm">
          <h1 className="text-xl font-bold text-white">Upgrade Klipprr</h1>

          {!session && (
            <div className="mt-5 space-y-3">
              <p className="text-sm text-zinc-400">Sign in to manage your subscription or redeem an activation code.</p>
              <Link href="/login" className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500">
                Sign in
              </Link>
              <Link href="/#pricing" className="flex w-full items-center justify-center rounded-full border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:text-white">
                View pricing
              </Link>
            </div>
          )}

          {session && license && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                  <path d="M20 6 9 17l-5-5"/>
                </svg>
                <p className="text-sm text-emerald-400">Your plan is active.</p>
              </div>
              <p className="text-sm text-zinc-400">Manage billing from your account page.</p>
              <Link href="/account" className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500">
                Go to account
              </Link>
            </div>
          )}

          {successParam === "1" && session && !license && (
            <p className="mt-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-3 py-2 text-sm text-amber-400">
              Payment successful. Refreshing your license…
            </p>
          )}

          {canceledParam === "1" && (
            <p className="mt-4 text-sm text-zinc-500">Checkout was canceled. You can subscribe or use an activation code below.</p>
          )}

          {session && !license && (
            <div className="mt-5 space-y-4">
              <p className="text-sm text-zinc-400">Subscribe with Stripe, or enter an activation code.</p>

              {/* Tier selector */}
              <div className="grid grid-cols-2 gap-2">
                {(["pro", "max"] as PaidTier[]).map((tier) => (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`cursor-pointer rounded-xl border py-2.5 text-sm font-semibold capitalize transition-all duration-150 ${
                      selectedTier === tier
                        ? tier === "max"
                          ? "border-emerald-500 bg-emerald-600 text-white"
                          : "border-violet-500 bg-violet-600 text-white"
                        : "border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:text-white"
                    }`}
                  >
                    {tier.charAt(0).toUpperCase() + tier.slice(1)}
                  </button>
                ))}
              </div>

              {/* Billing toggle */}
              <div className="relative grid grid-cols-2 gap-1 rounded-xl border border-zinc-700/80 bg-zinc-800/50 p-1">
                <button
                  type="button"
                  onClick={() => setBillingPeriod("monthly")}
                  className={`cursor-pointer rounded-lg py-2 text-sm font-medium transition-all duration-150 ${billingPeriod === "monthly" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {selectedTier === "pro" ? "$12 / mo" : "$39 / mo"}
                </button>
                <button
                  type="button"
                  onClick={() => setBillingPeriod("yearly")}
                  className={`relative cursor-pointer rounded-lg py-2 text-sm font-medium transition-all duration-150 ${billingPeriod === "yearly" ? "bg-zinc-700 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
                >
                  {selectedTier === "pro" ? "$120 / yr" : "$396 / yr"}
                  <span className="absolute -top-2.5 right-1 rounded-full bg-emerald-500 px-1.5 py-px text-[10px] font-bold text-white">
                    2 mo free
                  </span>
                </button>
              </div>

              <button
                type="button"
                onClick={subscribeWithStripe}
                disabled={stripeLoading}
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {stripeLoading ? (
                  <><Spinner /> Redirecting…</>
                ) : billingPeriod === "yearly"
                  ? `Subscribe to ${selectedTier === "pro" ? "Pro" : "Max"} — 2 months free`
                  : `Subscribe to ${selectedTier === "pro" ? "Pro" : "Max"} — Monthly`}
              </button>

              <p className="text-xs text-zinc-600">
                By continuing, you agree to our{" "}
                <Link className="text-zinc-400 hover:text-white" href="/terms">Terms</Link>,{" "}
                <Link className="text-zinc-400 hover:text-white" href="/privacy">Privacy Policy</Link>, and{" "}
                <Link className="text-zinc-400 hover:text-white" href="/refunds">Refunds</Link>.
              </p>

              <div className="border-t border-zinc-800 pt-4">
                <p className="mb-2 text-xs text-zinc-500">Or enter your activation code:</p>
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="BETA-CLIP-001"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-xl border border-zinc-700/80 bg-zinc-800/50 px-3.5 py-2.5 text-sm text-white placeholder-zinc-600 transition-colors focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                  />
                  <button
                    type="button"
                    onClick={redeemCode}
                    disabled={loading}
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 py-2.5 text-sm font-medium text-zinc-300 transition-all duration-150 hover:border-zinc-600 hover:text-white disabled:opacity-50"
                  >
                    {loading ? <><Spinner /> Activating…</> : "Activate code"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {status && (
            <p className={`mt-4 rounded-lg border px-3 py-2 text-sm ${status.toLowerCase().includes("fail") || status.toLowerCase().includes("error") ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-zinc-700 bg-zinc-800/50 text-zinc-300"}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
