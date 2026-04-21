// Thin wrappers over GA4 gtag and Meta Pixel fbq.
// Script tags are injected by app/Analytics.tsx. All calls are no-ops on SSR
// and when the corresponding ID env var is not set.

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
export const META_PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Params = Record<string, unknown>;

function ga(event: string, params: Params = {}) {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;
  window.gtag("event", event, params);
}

function fb(event: string, params: Params = {}, standard = true) {
  if (typeof window === "undefined" || !window.fbq || !META_PIXEL_ID) return;
  window.fbq(standard ? "track" : "trackCustom", event, params);
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()\[\]\\\/\+^]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

// Fire server-side to /api/track — bypasses ad blockers, CSP, and regional fbevents 204s.
// Uses sendBeacon when available so it survives page navigation (e.g. Stripe redirect).
function server(event: string, extra: Params = {}) {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      event,
      sourceUrl: window.location.href,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      clientId: readCookie("_ga"), // GA4 client id — best-effort stitch
      ...extra,
    });
    const url = "/api/track";
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: "application/json" });
      navigator.sendBeacon(url, blob);
    } else {
      fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // never throw from analytics
  }
}

export type PlanTier = "pro" | "max";
export type BillingPeriod = "monthly" | "yearly";

const PLAN_VALUE: Record<PlanTier, Record<BillingPeriod, number>> = {
  pro: { monthly: 12, yearly: 120 },
  max: { monthly: 39, yearly: 396 },
};

export function planValueUSD(plan: string, billing?: string): number {
  const p = (plan || "").toLowerCase() as PlanTier;
  const b = (billing || "monthly").toLowerCase() as BillingPeriod;
  return PLAN_VALUE[p]?.[b] ?? 0;
}

type UserCtx = { email?: string | null; userId?: string | null };

export function trackDownload(platform: "mac" | "windows" | "linux" = "mac", user: UserCtx = {}) {
  ga("klipprr_download", { platform });
  fb("Lead", { content_name: "download", platform }, true);
  server("download", { platform, email: user.email ?? null, externalId: user.userId ?? null });
}

export function trackSignup(method: "email" | "google", user: UserCtx = {}) {
  ga("klipprr_signup", { method });
  fb("CompleteRegistration", { method }, true);
  server("signup", { method, email: user.email ?? null, externalId: user.userId ?? null });
}

export function trackPurchase(plan: string, billing?: string, transactionId?: string, user: UserCtx = {}) {
  const value = planValueUSD(plan, billing);
  ga("klipprr_purchase", {
    plan,
    billing: billing ?? "unknown",
    value,
    currency: "USD",
    transaction_id: transactionId,
  });
  fb("Purchase", { value, currency: "USD", content_name: plan }, true);
  server("purchase", {
    plan,
    billing: billing ?? "monthly",
    value,
    eventId: transactionId,
    email: user.email ?? null,
    externalId: user.userId ?? null,
  });
}

export function trackCheckoutStarted(plan: string, billing: string, user: UserCtx = {}) {
  const value = planValueUSD(plan, billing);
  ga("klipprr_checkout_started", { plan, billing, value, currency: "USD" });
  fb("InitiateCheckout", { value, currency: "USD", content_name: plan }, true);
  server("checkout_started", {
    plan,
    billing,
    value,
    email: user.email ?? null,
    externalId: user.userId ?? null,
  });
}
