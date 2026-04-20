import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { WindowsWaitlist } from "./WindowsWaitlist";
import { DownloadButton } from "./DownloadButton";

const GITHUB_REPO =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELEASES_REPO) || "Fredddzik/klipprr";

async function getLatestRelease(): Promise<{
  version: string;
  macUrl: string | null;
  macLabel: string;
  windowsUrl: string | null;
  windowsLabel: string;
} | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as {
      tag_name?: string;
      assets?: { name: string; browser_download_url: string }[];
    };
    const version = data.tag_name?.replace(/^v/, "") ?? null;
    const assets = data.assets ?? [];
    const dmg = assets.find((a) => a.name.endsWith(".dmg"));
    const appTarGz = assets.find((a) => a.name.endsWith(".app.tar.gz"));
    const macAsset = dmg ?? appTarGz;
    const msi = assets.find((a) => a.name.endsWith(".msi"));
    if (!version) return null;
    const macLabel = dmg ? ".dmg" : ".app.tar.gz";
    const windowsLabel = msi ? ".msi" : "";
    return {
      version,
      macUrl: macAsset?.browser_download_url ?? null,
      macLabel,
      windowsUrl: msi?.browser_download_url ?? null,
      windowsLabel,
    };
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Download Klipprr — Mac Video Clip Downloader | YouTube, Twitch & More",
  description:
    "Download the Klipprr desktop app for macOS. Clip any part of a YouTube, Twitch, Instagram or X video and export just that moment. Free to start.",
  alternates: { canonical: "/download" },
  openGraph: {
    title: "Download Klipprr — Mac Video Clip Downloader | YouTube, Twitch & More",
    description: "Clip any part of a YouTube, Twitch, Instagram or X video and export just that moment. Free to start.",
    url: "https://klipprr.com/download",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@klipprr",
    creator: "@klipprr",
    title: "Download Klipprr — Mac Video Clip Downloader | YouTube, Twitch & More",
    description: "Clip any part of a YouTube, Twitch, Instagram or X video and export just that moment. Free to start.",
  },
};

export default async function DownloadPage() {
  const release = await getLatestRelease();
  const macDirectUrl = process.env.NEXT_PUBLIC_MAC_DOWNLOAD_URL ?? null;

  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Klipprr",
    url: "https://klipprr.com/download",
    downloadUrl: "https://klipprr.com/download",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "macOS, Windows (coming soon)",
    softwareVersion: release?.version ?? "0.1.19",
    description: "Klipprr is a native desktop application for clipping and exporting exact segments from YouTube, Twitch, Instagram, Twitter/X, and local video files.",
    offers: [
      { "@type": "Offer", name: "Free", price: "0", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      { "@type": "Offer", name: "Pro", price: "12", priceCurrency: "USD", availability: "https://schema.org/InStock" },
      { "@type": "Offer", name: "Max", price: "39", priceCurrency: "USD", availability: "https://schema.org/InStock" },
    ],
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://klipprr.com/" },
      { "@type": "ListItem", position: 2, name: "Download", item: "https://klipprr.com/download" },
    ],
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-zinc-950 text-zinc-100">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

      {/* Ambient glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/3 rounded-full opacity-10"
          style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }} />
      </div>

      <header className="relative border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Klipprr" width={30} height={30} className="rounded-lg" priority />
            <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-zinc-400 transition-colors hover:text-white">Home</Link>
            <Link href="/login" className="text-sm text-zinc-400 transition-colors hover:text-white">Sign In</Link>
          </div>
        </nav>
      </header>

      <main className="relative mx-auto max-w-3xl px-6 py-16">
        {/* Heading */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">Download Klipprr</h1>
          <p className="mt-4 text-base text-zinc-400">
            Native desktop app for clipping and exporting exact video segments.
          </p>
        </div>

        {/* Intro */}
        <div className="mt-10 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 text-sm leading-relaxed text-zinc-400">
          <p>
            Klipprr is built for creators who need precise clip extraction without fighting a command-line
            workflow. Paste a video URL from YouTube, Twitch, Instagram Reels, or X, set in and out
            points, and export only the part you want. Local file clipping works too.
          </p>
          <p className="mt-3">
            Current platform support is macOS with Apple Silicon (M1, M2, M3, and newer). Windows support
            is in progress. Minimum OS requirements may change as the app evolves.
          </p>
        </div>

        {/* Platform cards */}
        <div className="mt-10 space-y-4">
          {/* macOS */}
          <section className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 7c-3 0-4 3-4 5.5 0 3 2 7.5 4 7.5 1 .01 1.75-.49 3-.5 1.25-.01 1.75.5 3 .5 2 0 4-4.5 4-7.5C19 10 18 7 15 7c-1 0-2 .5-3 .5C11 7.5 10 7 9 7z"/>
                  <path d="M12 4a2 2 0 0 0 2-2 2 2 0 0 0-2 2"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">macOS — Apple Silicon</h2>
                <p className="text-xs text-zinc-500">M1 / M2 / M3 and newer</p>
              </div>
            </div>
            <ul className="mt-4 space-y-1.5 text-sm text-zinc-400">
              {[
                "Processor: Apple Silicon (M1 or newer)",
                "Recommended OS: recent macOS release",
                "Disk space: ~225 MB (app + export overhead)",
                "Internet required for URL-based sources; local files work offline",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5"/>
                  </svg>
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5">
              {(release?.macUrl ?? macDirectUrl) ? (
                <DownloadButton
                  href={(release?.macUrl ?? macDirectUrl)!}
                  version={release?.version}
                  label={release?.macLabel}
                />
              ) : (
                <p className="text-sm text-zinc-600">Releases are not publicly available. Build from source or request access.</p>
              )}
            </div>
          </section>

          {/* Windows */}
          <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 opacity-70">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Windows</h2>
                <p className="text-xs text-zinc-500">Coming soon</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-zinc-400">
              Windows support is in progress. Join the waitlist and we&apos;ll email you when the Windows build is ready.
            </p>
            <div className="mt-4">
              <WindowsWaitlist />
            </div>
          </section>

          {/* Linux */}
          <section className="rounded-2xl border border-zinc-800/60 bg-zinc-900/30 p-6 opacity-50">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-zinc-600">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-zinc-400">Linux</h2>
                <p className="text-xs text-zinc-600">Coming soon</p>
              </div>
            </div>
          </section>
        </div>

        {/* Installation guide */}
        <section className="mt-8 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6">
          <h2 className="text-base font-semibold text-white">Installation Guide (macOS)</h2>
          <ol className="mt-4 space-y-2.5">
            {[
              "Download the latest macOS build from the button above.",
              "Open the .dmg and drag Klipprr into your Applications folder.",
              "Launch Klipprr and allow it in macOS security prompts if required.",
              "Paste a URL or load a local file, set clip points, and export.",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3 text-sm text-zinc-400">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-[10px] font-bold text-zinc-500">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        {/* Formats & Plans */}
        <section className="mt-4 rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 text-sm text-zinc-400">
          <h2 className="text-base font-semibold text-white">Formats, Codecs, and Plans</h2>
          <p className="mt-3 leading-relaxed">
            Klipprr exports in creator-friendly formats (MP4) and handles codec compatibility for social
            and editing workflows. Free supports up to 10 clips/month at 720p with watermarking. Pro and
            Max remove watermarking and unlock higher quality and larger monthly limits.
          </p>
          <p className="mt-3 leading-relaxed">
            Pricing: Pro is $12/month ($10/month billed yearly), Max is $39/month ($33/month billed yearly).
            See our{" "}
            <Link href="/privacy" className="text-violet-400 transition-colors hover:text-violet-300">Privacy Policy</Link>
            {" "}for processing details.
          </p>
        </section>

        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-zinc-600">Existing installs: use <strong className="text-zinc-500">Check for updates</strong> inside the app.</p>
          <Link href="/" className="text-sm text-zinc-500 transition-colors hover:text-white">← Back to home</Link>
        </div>
      </main>
    </div>
  );
}
