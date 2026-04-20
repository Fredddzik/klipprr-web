// Capture attribution params on first visit, persist for the session, and
// attach to Supabase user_metadata at signup. Safe on SSR.

const KEY = "klipprr_attribution_v1";
const PARAMS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "gclid",
  "fbclid",
  "ref",
] as const;

export type Attribution = Partial<Record<(typeof PARAMS)[number], string>> & {
  landing_page?: string;
  referrer?: string;
  captured_at?: string;
};

export function captureAttributionFromUrl(): void {
  if (typeof window === "undefined") return;
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return; // first-touch wins for the session

    const url = new URL(window.location.href);
    const attr: Attribution = {};
    let hasAny = false;
    for (const p of PARAMS) {
      const v = url.searchParams.get(p);
      if (v) {
        attr[p] = v;
        hasAny = true;
      }
    }
    if (document.referrer) attr.referrer = document.referrer;
    attr.landing_page = url.pathname + url.search;
    attr.captured_at = new Date().toISOString();

    // Persist even when no UTM params — referrer/landing_page still useful.
    // But skip self-referrals (same-origin) when there are no UTMs.
    if (!hasAny && attr.referrer && attr.referrer.includes(url.host)) return;

    sessionStorage.setItem(KEY, JSON.stringify(attr));
  } catch {
    // sessionStorage can throw in privacy modes — ignore.
  }
}

export function getAttribution(): Attribution | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Attribution) : null;
  } catch {
    return null;
  }
}

export function clearAttribution(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
