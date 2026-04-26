import { NextResponse } from "next/server";
import { Resend } from "resend";
import { createServerClient } from "@/lib/supabase-server";

// ---------------------------------------------------------------------------
// Internal / test accounts — never include in email sequences
// ---------------------------------------------------------------------------
const EXCLUDED_EMAILS = new Set([
  "freddy.hypky@gmail.com",
  "frederik.hypky@gmail.com",
  "veronika.hypka@gmail.com",
  "denisprikryl16@gmail.com",
  "tobi.pudis@gmail.com",
  "dagestangriffin@gmail.com",
  "adams.notebooklm@gmail.com",
  "adams.tools@tuta.com",
  "ufcxtra.clips@gmail.com",
]);

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EmailKey =
  | "welcome"
  | "day1_nudge"
  | "day3_inactive"
  | "day3_activated"
  | "day7_upgrade"
  | "day14_lasttouch";

interface UserRow {
  id: string;
  email: string;
  created_at: string;
}

interface UsageRow {
  user_id: string;
  clips_used: number;
}

interface LicenseRow {
  user_id: string;
  plan: string;
  active: boolean;
}

interface LogRow {
  user_id: string;
  email_key: string;
}

// ---------------------------------------------------------------------------
// Email copy
// ---------------------------------------------------------------------------

function buildEmail(
  key: EmailKey,
  firstName: string
): { subject: string; text: string } | null {
  const name = firstName || "there";

  switch (key) {
    case "welcome":
      return {
        subject: "Your Klipprr account is ready",
        text: `Hey ${name},

Welcome to Klipprr. You're all set on the account side — the one thing left is downloading the app so you can start making clips.

Download Klipprr for Mac: https://klipprr.com/download

Once it's installed, open it and sign in with the same Google account you just used. Your free clips are waiting.

Frederik`,
      };

    case "day1_nudge":
      return {
        subject: "Did you get a chance to try it?",
        text: `Hey ${name},

Just checking in — did you get a chance to download Klipprr and make your first clip?

If you hit any snag during setup, just reply here and I'll sort it out directly. Otherwise, paste any YouTube, Twitch, X, or Instagram URL into the app and trim from there — takes about 30 seconds.

Frederik`,
      };

    case "day3_inactive":
      return {
        subject: "What's holding you back?",
        text: `Hey ${name},

You signed up a few days ago but haven't made a clip yet — totally fine, just curious what got in the way.

Was it the download, something unclear in the app, or just haven't had the time? One line back would genuinely help me make Klipprr better for the next person.

Frederik`,
      };

    case "day3_activated":
      return {
        subject: "Your clips can look a lot better",
        text: `Hey ${name},

Glad you've been using Klipprr — here's something worth knowing: the free tier adds a watermark and caps export quality, so clips you share right now aren't showing the full picture.

Pro removes the watermark completely, unlocks full HD exports, and raises your monthly clip limit: https://klipprr.com/upgrade

If you're sharing clips anywhere publicly, it's worth it.

Frederik`,
      };

    case "day7_upgrade":
      return {
        subject: "Here's what you're missing on free",
        text: `Hey ${name},

Quick comparison — free vs. Pro on Klipprr:

Free: watermark on every clip, capped quality, limited clips/month
Pro: no watermark, full HD, higher clip limit

If you're making clips to post anywhere, the watermark alone makes Pro worth it: https://klipprr.com/upgrade

Frederik`,
      };

    case "day14_lasttouch":
      return {
        subject: "Last email from me — quick question",
        text: `Hey ${name},

This is the last email I'll send about this — I promise.

You signed up for Klipprr a couple weeks ago and I never heard from you. I'm not going to pitch you again, I just genuinely want to know: was it the wrong time, wrong platform, missing feature, price — anything?

One line back is enough. It helps more than you know.

Frederik`,
      };

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Sequence logic — determines which email (if any) to send to a user today
// ---------------------------------------------------------------------------

function pickEmail(
  daysSince: number,
  clipsUsed: number,
  isPro: boolean,
  sent: Set<string>
): EmailKey | null {
  // Exit sequence entirely once the user is Pro/Max
  // (still send welcome if it somehow never went out)
  const hasSentWelcome = sent.has("welcome");

  if (!hasSentWelcome) return "welcome";

  if (isPro) return null; // upgraded — nothing more to send

  if (daysSince >= 1 && clipsUsed === 0 && !sent.has("day1_nudge")) {
    return "day1_nudge";
  }

  if (daysSince >= 3 && !sent.has("day3_inactive") && !sent.has("day3_activated")) {
    return clipsUsed === 0 ? "day3_inactive" : "day3_activated";
  }

  if (daysSince >= 7 && !sent.has("day7_upgrade")) {
    return "day7_upgrade";
  }

  if (daysSince >= 14 && !sent.has("day14_lasttouch")) {
    return "day14_lasttouch";
  }

  return null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  // Protect the endpoint — Vercel passes this header on cron invocations,
  // and we also allow a manual secret for local testing.
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  const isVercelCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;
  const isManualTrigger = cronSecret && authHeader === `Bearer ${cronSecret}`;

  if (!isVercelCron && !isManualTrigger) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const db = createServerClient();
  const results: { email: string; sent: EmailKey | null; error?: string }[] = [];

  // 1. Load all users
  const { data: users, error: usersError } = await db
    .from("profiles")
    .select("id, email, created_at");

  if (usersError || !users) {
    return NextResponse.json({ error: "Failed to load users", detail: usersError }, { status: 500 });
  }

  // 2. Load clip usage (all rows — aggregate per user in memory)
  const { data: usageRows } = await db
    .from("clip_usage_monthly")
    .select("user_id, clips_used") as { data: UsageRow[] | null };

  const usageByUser = new Map<string, number>();
  for (const row of usageRows ?? []) {
    usageByUser.set(row.user_id, (usageByUser.get(row.user_id) ?? 0) + row.clips_used);
  }

  // 3. Load active licenses
  const { data: licenseRows } = await db
    .from("licenses")
    .select("user_id, plan, active")
    .eq("active", true) as { data: LicenseRow[] | null };

  const planByUser = new Map<string, string>();
  for (const row of licenseRows ?? []) {
    planByUser.set(row.user_id, row.plan);
  }

  // 4. Load already-sent email log
  const { data: logRows } = await db
    .from("email_sequence_log")
    .select("user_id, email_key") as { data: LogRow[] | null };

  const sentByUser = new Map<string, Set<string>>();
  for (const row of logRows ?? []) {
    if (!sentByUser.has(row.user_id)) sentByUser.set(row.user_id, new Set());
    sentByUser.get(row.user_id)!.add(row.email_key);
  }

  // 5. Process each user
  const now = Date.now();

  for (const user of users as UserRow[]) {
    if (EXCLUDED_EMAILS.has(user.email.toLowerCase())) {
      results.push({ email: user.email, sent: null });
      continue;
    }

    const signupMs = new Date(user.created_at).getTime();
    const daysSince = (now - signupMs) / (1000 * 60 * 60 * 24);
    const clipsUsed = usageByUser.get(user.id) ?? 0;
    const plan = planByUser.get(user.id) ?? null;
    const isPro = plan === "pro" || plan === "max";
    const sent = sentByUser.get(user.id) ?? new Set();

    const emailKey = pickEmail(daysSince, clipsUsed, isPro, sent);

    if (!emailKey) {
      results.push({ email: user.email, sent: null });
      continue;
    }

    const firstName = user.email.split("@")[0].split(".")[0];
    const content = buildEmail(emailKey, firstName);

    if (!content) {
      results.push({ email: user.email, sent: null });
      continue;
    }

    try {
      await resend.emails.send({
        from: "Frederik from Klipprr <hello@klipprr.com>",
        to: user.email,
        subject: content.subject,
        text: content.text,
      });

      // Log it so we never send again
      await db.from("email_sequence_log").insert({
        user_id: user.id,
        email_key: emailKey,
      });

      results.push({ email: user.email, sent: emailKey });
    } catch (err) {
      results.push({
        email: user.email,
        sent: null,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const sent = results.filter((r) => r.sent);
  const skipped = results.filter((r) => !r.sent && !r.error);
  const failed = results.filter((r) => r.error);

  return NextResponse.json({
    ok: true,
    sent: sent.length,
    skipped: skipped.length,
    failed: failed.length,
    details: results,
  });
}
