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
// HTML email template — Klipprr brand
// ---------------------------------------------------------------------------

function htmlEmail({
  name,
  body,
  ctaText,
  ctaUrl,
}: {
  name: string;
  body: string; // paragraphs separated by \n\n
  ctaText?: string;
  ctaUrl?: string;
}): string {
  const paragraphs = body
    .split("\n\n")
    .map((p) => `<p style="margin:0 0 16px 0;color:#d4d4d8;font-size:15px;line-height:1.6;">${p.trim()}</p>`)
    .join("\n");

  const cta = ctaText && ctaUrl
    ? `
      <div style="margin:28px 0 8px 0;text-align:left;">
        <a href="${ctaUrl}"
           style="display:inline-block;padding:12px 28px;background:linear-gradient(135deg,#7c3aed,#c026d3);color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;border-radius:999px;letter-spacing:0.01em;">
          ${ctaText}
        </a>
      </div>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Klipprr</title>
</head>
<body style="margin:0;padding:0;background-color:#09090b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#09090b;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:28px;">
              <img src="https://klipprr.com/logo.png" alt="Klipprr" width="40" height="40"
                   style="border-radius:10px;display:block;"/>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background-color:#18181b;border:1px solid #27272a;border-radius:16px;padding:32px 36px;">

              <!-- Greeting -->
              <p style="margin:0 0 20px 0;color:#ffffff;font-size:16px;font-weight:500;line-height:1.5;">
                Hey ${name},
              </p>

              <!-- Body -->
              ${paragraphs}

              <!-- CTA -->
              ${cta}

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding-top:24px;text-align:left;">
              <p style="margin:0;color:#52525b;font-size:12px;line-height:1.6;">
                Frederik · Klipprr<br/>
                <a href="https://klipprr.com" style="color:#52525b;text-decoration:underline;">klipprr.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Email copy — returns subject, plain text, and HTML
// ---------------------------------------------------------------------------

function buildEmail(
  key: EmailKey,
  name: string
): { subject: string; text: string; html: string } | null {
  const n = name || "there";

  switch (key) {
    case "welcome": {
      const subject = "Your Klipprr account is ready";
      const body = `Welcome to Klipprr. You're all set on the account side — the one thing left is downloading the app so you can start making clips.\n\nOnce it's installed, open it and sign in with the same Google account you just used. Your free clips are waiting.`;
      return {
        subject,
        text: `Hey ${n},\n\n${body}\n\nDownload Klipprr for Mac: https://klipprr.com/download\n\nFrederik`,
        html: htmlEmail({ name: n, body, ctaText: "Download Klipprr for Mac →", ctaUrl: "https://klipprr.com/download" }),
      };
    }

    case "day1_nudge": {
      const subject = "Did you get a chance to try it?";
      const body = `Just checking in — did you get a chance to download Klipprr and make your first clip?\n\nIf you hit any snag during setup, just reply here and I'll sort it out directly. Otherwise, paste any YouTube, Twitch, X, or Instagram URL into the app and trim from there — takes about 30 seconds.`;
      return {
        subject,
        text: `Hey ${n},\n\n${body}\n\nFrederik`,
        html: htmlEmail({ name: n, body, ctaText: "Download Klipprr →", ctaUrl: "https://klipprr.com/download" }),
      };
    }

    case "day3_inactive": {
      const subject = "What's holding you back?";
      const body = `You signed up a few days ago but haven't made a clip yet — totally fine, just curious what got in the way.\n\nWas it the download, something unclear in the app, or just haven't had the time? One line back would genuinely help me make Klipprr better for the next person.`;
      return {
        subject,
        text: `Hey ${n},\n\n${body}\n\nFrederik`,
        html: htmlEmail({ name: n, body }),
      };
    }

    case "day3_activated": {
      const subject = "Your clips can look a lot better";
      const body = `Glad you've been using Klipprr — here's something worth knowing: the free tier adds a watermark and caps export quality, so clips you share right now aren't showing the full picture.\n\nPro removes the watermark completely, unlocks full HD exports, and raises your monthly clip limit. If you're sharing clips anywhere publicly, it's worth it.`;
      return {
        subject,
        text: `Hey ${n},\n\n${body}\n\nhttps://klipprr.com/upgrade\n\nFrederik`,
        html: htmlEmail({ name: n, body, ctaText: "Upgrade to Pro →", ctaUrl: "https://klipprr.com/upgrade" }),
      };
    }

    case "day7_upgrade": {
      const subject = "Here's what you're missing on free";
      const body = `Quick comparison — free vs. Pro on Klipprr:\n\nFree: watermark on every clip, capped quality, limited clips/month\nPro: no watermark, full HD, higher clip limit\n\nIf you're making clips to post anywhere, the watermark alone makes Pro worth it.`;
      return {
        subject,
        text: `Hey ${n},\n\n${body}\n\nhttps://klipprr.com/upgrade\n\nFrederik`,
        html: htmlEmail({ name: n, body, ctaText: "Remove the watermark →", ctaUrl: "https://klipprr.com/upgrade" }),
      };
    }

    case "day14_lasttouch": {
      const subject = "Last email from me — quick question";
      const body = `This is the last email I'll send about this — I promise.\n\nYou signed up for Klipprr a couple weeks ago and I never heard from you. I'm not going to pitch you again, I just genuinely want to know: was it the wrong time, wrong platform, missing feature, price — anything?\n\nOne line back is enough. It helps more than you know.`;
      return {
        subject,
        text: `Hey ${n},\n\n${body}\n\nFrederik`,
        html: htmlEmail({ name: n, body }),
      };
    }

    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Sequence logic
// ---------------------------------------------------------------------------

function pickEmail(
  daysSince: number,
  clipsUsed: number,
  isPro: boolean,
  sent: Set<string>
): EmailKey | null {
  if (!sent.has("welcome")) return "welcome";
  if (isPro) return null;
  if (daysSince >= 1 && clipsUsed === 0 && !sent.has("day1_nudge")) return "day1_nudge";
  if (daysSince >= 3 && !sent.has("day3_inactive") && !sent.has("day3_activated")) {
    return clipsUsed === 0 ? "day3_inactive" : "day3_activated";
  }
  if (daysSince >= 7 && !sent.has("day7_upgrade")) return "day7_upgrade";
  if (daysSince >= 14 && !sent.has("day14_lasttouch")) return "day14_lasttouch";
  return null;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }

  const resend = new Resend(resendKey);
  const db = createServerClient();
  const results: { email: string; sent: EmailKey | null; error?: string }[] = [];

  // 1. Load all users + display names from auth metadata
  const { data: authUsers } = await db.auth.admin.listUsers({ perPage: 1000 });
  const displayNameById = new Map<string, string>();
  for (const u of authUsers?.users ?? []) {
    const meta = u.user_metadata as Record<string, string> | undefined;
    const name = meta?.full_name ?? meta?.name ?? "";
    if (name) displayNameById.set(u.id, name.split(" ")[0]); // first name only
  }

  // 2. Load profiles
  const { data: users, error: usersError } = await db
    .from("profiles")
    .select("id, email, created_at");

  if (usersError || !users) {
    return NextResponse.json({ error: "Failed to load users", detail: usersError }, { status: 500 });
  }

  // 3. Clip usage
  const { data: usageRows } = await db
    .from("clip_usage_monthly")
    .select("user_id, clips_used") as { data: UsageRow[] | null };

  const usageByUser = new Map<string, number>();
  for (const row of usageRows ?? []) {
    usageByUser.set(row.user_id, (usageByUser.get(row.user_id) ?? 0) + row.clips_used);
  }

  // 4. Active licenses
  const { data: licenseRows } = await db
    .from("licenses")
    .select("user_id, plan, active")
    .eq("active", true) as { data: LicenseRow[] | null };

  const planByUser = new Map<string, string>();
  for (const row of licenseRows ?? []) {
    planByUser.set(row.user_id, row.plan);
  }

  // 5. Email sequence log
  const { data: logRows } = await db
    .from("email_sequence_log")
    .select("user_id, email_key") as { data: LogRow[] | null };

  const sentByUser = new Map<string, Set<string>>();
  for (const row of logRows ?? []) {
    if (!sentByUser.has(row.user_id)) sentByUser.set(row.user_id, new Set());
    sentByUser.get(row.user_id)!.add(row.email_key);
  }

  // 6. Process each user
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

    // Prefer real display name from Google OAuth, fall back to email prefix
    const firstName =
      displayNameById.get(user.id) ??
      user.email.split("@")[0].split(".")[0].replace(/\d+/g, "");

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
        html: content.html,
      });

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
