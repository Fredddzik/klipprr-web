// Server-side analytics: Meta Conversions API + GA4 Measurement Protocol.
// Fires from our server, so no ad blockers / browser network filters can stop it.
// All functions are no-ops when env vars missing — safe to call unconditionally.

import { createHash, randomUUID } from "crypto";

const META_PIXEL_ID = process.env.META_PIXEL_ID ?? process.env.NEXT_PUBLIC_META_PIXEL_ID;
const META_CAPI_ACCESS_TOKEN = process.env.META_CAPI_ACCESS_TOKEN;
const META_CAPI_TEST_CODE = process.env.META_CAPI_TEST_EVENT_CODE; // optional, for Test Events tab

const GA4_MEASUREMENT_ID = process.env.GA4_MEASUREMENT_ID ?? process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const GA4_API_SECRET = process.env.GA4_API_SECRET;

type MetaUserData = {
  email?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  fbp?: string | null; // _fbp cookie
  fbc?: string | null; // _fbc cookie (built from fbclid)
  externalId?: string | null; // e.g. supabase user id
};

type MetaEventOpts = {
  eventName: string; // "Purchase" | "CompleteRegistration" | "Lead" | "InitiateCheckout" ...
  eventId?: string; // for dedup with browser pixel; auto-generated if missing
  eventSourceUrl?: string;
  actionSource?: "website" | "app" | "other";
  userData: MetaUserData;
  customData?: Record<string, unknown>;
};

function sha256Hex(input: string): string {
  return createHash("sha256").update(input.trim().toLowerCase()).digest("hex");
}

export function makeEventId(): string {
  return randomUUID();
}

export async function sendMetaEvent(opts: MetaEventOpts): Promise<{ ok: boolean; status?: number; body?: unknown; error?: string }> {
  if (!META_PIXEL_ID || !META_CAPI_ACCESS_TOKEN) {
    return { ok: false, error: "meta_capi_not_configured" };
  }

  const user_data: Record<string, unknown> = {};
  if (opts.userData.email) user_data.em = [sha256Hex(opts.userData.email)];
  if (opts.userData.externalId) user_data.external_id = [sha256Hex(opts.userData.externalId)];
  if (opts.userData.ip) user_data.client_ip_address = opts.userData.ip;
  if (opts.userData.userAgent) user_data.client_user_agent = opts.userData.userAgent;
  if (opts.userData.fbp) user_data.fbp = opts.userData.fbp;
  if (opts.userData.fbc) user_data.fbc = opts.userData.fbc;

  const event = {
    event_name: opts.eventName,
    event_time: Math.floor(Date.now() / 1000),
    event_id: opts.eventId ?? makeEventId(),
    action_source: opts.actionSource ?? "website",
    event_source_url: opts.eventSourceUrl ?? "https://klipprr.com/",
    user_data,
    custom_data: opts.customData ?? {},
  };

  const body: Record<string, unknown> = { data: [event] };
  if (META_CAPI_TEST_CODE) body.test_event_code = META_CAPI_TEST_CODE;

  const url = `https://graph.facebook.com/v21.0/${META_PIXEL_ID}/events?access_token=${encodeURIComponent(META_CAPI_ACCESS_TOKEN)}`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text);
    } catch {}
    if (!res.ok) {
      console.error("[Meta CAPI] failed", { status: res.status, body: parsed, eventName: opts.eventName });
      return { ok: false, status: res.status, body: parsed };
    }
    return { ok: true, status: res.status, body: parsed };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[Meta CAPI] fetch error", msg);
    return { ok: false, error: msg };
  }
}

type GA4EventOpts = {
  clientId: string; // stable per-user or per-session id
  userId?: string;
  events: Array<{ name: string; params?: Record<string, unknown> }>;
};

export async function sendGA4Event(opts: GA4EventOpts): Promise<{ ok: boolean; status?: number; error?: string }> {
  if (!GA4_MEASUREMENT_ID || !GA4_API_SECRET) {
    return { ok: false, error: "ga4_mp_not_configured" };
  }

  const payload: Record<string, unknown> = {
    client_id: opts.clientId,
    events: opts.events,
  };
  if (opts.userId) payload.user_id = opts.userId;

  const url = `https://www.google-analytics.com/mp/collect?measurement_id=${encodeURIComponent(GA4_MEASUREMENT_ID)}&api_secret=${encodeURIComponent(GA4_API_SECRET)}`;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("[GA4 MP] failed", { status: res.status, body: text });
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[GA4 MP] fetch error", msg);
    return { ok: false, error: msg };
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
