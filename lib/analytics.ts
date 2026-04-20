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

export function trackDownload(platform: "mac" | "windows" | "linux" = "mac") {
  ga("klipprr_download", { platform });
  fb("Lead", { content_name: "download", platform }, true);
}

export function trackSignup(method: "email" | "google") {
  ga("klipprr_signup", { method });
  fb("CompleteRegistration", { method }, true);
}

export function trackPurchase(plan: string, billing?: string, transactionId?: string) {
  const value = planValueUSD(plan, billing);
  ga("klipprr_purchase", {
    plan,
    billing: billing ?? "unknown",
    value,
    currency: "USD",
    transaction_id: transactionId,
  });
  fb("Purchase", { value, currency: "USD", content_name: plan }, true);
}

export function trackCheckoutStarted(plan: string, billing: string) {
  const value = planValueUSD(plan, billing);
  ga("klipprr_checkout_started", { plan, billing, value, currency: "USD" });
  fb("InitiateCheckout", { value, currency: "USD", content_name: plan }, true);
}
