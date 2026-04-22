"use client";

import Script from "next/script";
import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { GA_MEASUREMENT_ID, META_PIXEL_ID } from "@/lib/analytics";
import { captureAttributionFromUrl } from "@/lib/utm";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name.replace(/[.$?*|{}()\[\]\\\/\+^]/g, "\\$&") + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

function getOrCreateSessionId(): string {
  const KEY = "klipprr_ga_session";
  try {
    const existing = sessionStorage.getItem(KEY);
    if (existing) return existing;
    const fresh = String(Math.floor(Date.now() / 1000));
    sessionStorage.setItem(KEY, fresh);
    return fresh;
  } catch {
    return String(Math.floor(Date.now() / 1000));
  }
}

function serverPageView() {
  if (typeof window === "undefined") return;
  try {
    const body = JSON.stringify({
      event: "page_view",
      path: window.location.pathname,
      title: document.title,
      referrer: document.referrer || null,
      sourceUrl: window.location.href,
      fbp: readCookie("_fbp"),
      fbc: readCookie("_fbc"),
      clientId: readCookie("_ga") || getOrCreateSessionId(),
      sessionId: getOrCreateSessionId(),
    });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // never throw
  }
}

export function Analytics() {
  const pathname = usePathname();

  useEffect(() => {
    captureAttributionFromUrl();
  }, []);

  // Fire a server-side PageView on every route change. Bypasses ad blockers
  // and regional fbevents 204s — goes browser → our server → Meta/GA4.
  useEffect(() => {
    serverPageView();
  }, [pathname]);

  return (
    <>
      {GA_MEASUREMENT_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              gtag('config', '${GA_MEASUREMENT_ID}', { send_page_view: true });
              gtag('config', 'AW-18112435043');
            `}
          </Script>
        </>
      )}

      {META_PIXEL_ID && (
        <>
          <Script id="meta-pixel-init" strategy="afterInteractive">
            {`
              !function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${META_PIXEL_ID}');
              fbq('track', 'PageView');
            `}
          </Script>
          <noscript>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              height="1"
              width="1"
              style={{ display: "none" }}
              src={`https://www.facebook.com/tr?id=${META_PIXEL_ID}&ev=PageView&noscript=1`}
              alt=""
            />
          </noscript>
        </>
      )}
    </>
  );
}
