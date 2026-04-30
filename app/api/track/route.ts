import { sendMetaEvent, sendGA4Event, sendPostHogEvent, makeEventId } from "@/lib/server-analytics";

export const runtime = "nodejs";

/**
 * POST /api/track
 *
 * Server-side relay for analytics events. Client posts here instead of (or in
 * addition to) firing the browser pixel. Bypasses ad blockers and regional
 * tracker-blocking at the network/ISP level.
 *
 * Body: {
 *   event: "signup" | "download" | "checkout_started" | "purchase",
 *   method?: "email" | "google",
 *   platform?: "mac" | "windows" | "linux",
 *   plan?: "pro" | "max",
 *   billing?: "monthly" | "yearly",
 *   value?: number,
 *   currency?: string,
 *   email?: string,
 *   externalId?: string,              // supabase user id
 *   clientId?: string,                // GA4 client_id for stitching; falls back to externalId or random
 *   eventId?: string,                 // optional dedup id
 *   fbp?: string, fbc?: string,       // Meta attribution cookies if available
 *   sourceUrl?: string,
 * }
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  const event = String(body.event ?? "").toLowerCase();
  if (!event) return Response.json({ error: "missing_event" }, { status: 400 });

  const headers = req.headers;
  const ip =
    (headers.get("x-forwarded-for") ?? "").split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    null;
  const userAgent = headers.get("user-agent");

  const email = typeof body.email === "string" ? body.email : null;
  const externalId = typeof body.externalId === "string" ? body.externalId : null;
  const clientId =
    (typeof body.clientId === "string" && body.clientId) ||
    externalId ||
    makeEventId();
  const eventId = typeof body.eventId === "string" ? body.eventId : makeEventId();
  const sourceUrl = typeof body.sourceUrl === "string" ? body.sourceUrl : undefined;
  const fbp = typeof body.fbp === "string" ? body.fbp : null;
  const fbc = typeof body.fbc === "string" ? body.fbc : null;

  let metaEventName: string | null = null;
  let ga4EventName: string | null = null;
  let ga4Custom: string | null = null;
  let customData: Record<string, unknown> = {};
  const ga4Params: Record<string, unknown> = {};

  switch (event) {
    case "page_view":
    case "pageview": {
      metaEventName = "PageView";
      ga4EventName = "page_view";
      ga4Custom = null;
      const path = typeof body.path === "string" ? body.path : undefined;
      const title = typeof body.title === "string" ? body.title : undefined;
      const referrer = typeof body.referrer === "string" ? body.referrer : undefined;
      customData = { path, title };
      Object.assign(ga4Params, {
        page_location: sourceUrl,
        page_path: path,
        page_title: title,
        page_referrer: referrer,
        engagement_time_msec: 100, // required for realtime/active-user attribution
      });
      break;
    }
    case "signup":
    case "complete_registration": {
      metaEventName = "CompleteRegistration";
      ga4EventName = "sign_up";
      ga4Custom = "klipprr_signup";
      const method = typeof body.method === "string" ? body.method : "unknown";
      customData = { content_name: "signup", method };
      ga4Params.method = method;
      break;
    }
    case "download":
    case "lead": {
      metaEventName = "Lead";
      ga4EventName = "generate_lead";
      ga4Custom = "klipprr_download";
      const platform = typeof body.platform === "string" ? body.platform : "mac";
      customData = { content_name: "download", platform };
      ga4Params.platform = platform;
      break;
    }
    case "checkout_started":
    case "initiate_checkout": {
      metaEventName = "InitiateCheckout";
      ga4EventName = "begin_checkout";
      ga4Custom = "klipprr_checkout_started";
      const plan = typeof body.plan === "string" ? body.plan : "pro";
      const billing = typeof body.billing === "string" ? body.billing : "monthly";
      const value = typeof body.value === "number" ? body.value : 0;
      customData = { content_name: plan, value, currency: "USD" };
      Object.assign(ga4Params, { plan, billing, value, currency: "USD" });
      break;
    }
    case "purchase": {
      metaEventName = "Purchase";
      ga4EventName = "purchase";
      ga4Custom = "klipprr_purchase";
      const plan = typeof body.plan === "string" ? body.plan : "pro";
      const billing = typeof body.billing === "string" ? body.billing : "monthly";
      const value = typeof body.value === "number" ? body.value : 0;
      customData = { content_name: plan, value, currency: "USD", order_id: eventId };
      Object.assign(ga4Params, { transaction_id: eventId, plan, billing, value, currency: "USD" });
      break;
    }
    case "clip_exported": {
      // Fired by the desktop app after each successful export.
      // No Meta or GA4 mapping — PostHog only (see below).
      metaEventName = null;
      ga4EventName = null;
      ga4Custom = null;
      const plan = typeof body.plan === "string" ? body.plan : "free";
      const clipCount = typeof body.clip_count === "number" ? body.clip_count : undefined;
      const quality = typeof body.quality === "string" ? body.quality : undefined;
      Object.assign(ga4Params, { plan, ...(clipCount !== undefined && { clip_count: clipCount }), ...(quality && { quality }) });
      break;
    }
    default:
      return Response.json({ error: "unknown_event", event }, { status: 400 });
  }

  const sessionId = typeof body.sessionId === "string" ? body.sessionId : undefined;
  const phDistinctId = externalId ?? clientId;

  const [metaRes, gaRes, phRes] = await Promise.allSettled([
    metaEventName
      ? sendMetaEvent({
          eventName: metaEventName,
          eventId,
          eventSourceUrl: sourceUrl,
          userData: { email, externalId, ip, userAgent, fbp, fbc },
          customData,
        })
      : Promise.resolve({ ok: true, skipped: true }),
    ga4EventName
      ? sendGA4Event({
          clientId,
          userId: externalId ?? undefined,
          sessionId,
          events: [
            { name: ga4EventName, params: ga4Params },
            ...(ga4Custom ? [{ name: ga4Custom, params: ga4Params }] : []),
          ],
        })
      : Promise.resolve({ ok: true, skipped: true }),
    sendPostHogEvent({
      distinctId: phDistinctId,
      event: `klipprr_${event}`,
      properties: {
        ...ga4Params,
        ...(email ? { email } : {}),
        source: "server",
      },
    }),
  ]);

  return Response.json({
    ok: true,
    eventId,
    meta: metaRes.status === "fulfilled" ? metaRes.value : { ok: false, error: String(metaRes.reason) },
    ga4: gaRes.status === "fulfilled" ? gaRes.value : { ok: false, error: String(gaRes.reason) },
    posthog: phRes.status === "fulfilled" ? phRes.value : { ok: false, error: String(phRes.reason) },
  });
}
