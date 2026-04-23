import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { PricingSection } from "./PricingSection";

const GITHUB_REPO =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_RELEASES_REPO) || "Fredddzik/klipprr";

async function getLatestRelease(): Promise<{ version: string } | null> {
  try {
    const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
      next: { revalidate: 60 },
      headers: { Accept: "application/vnd.github.v3+json" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { tag_name?: string };
    const version = data.tag_name?.replace(/^v/, "") ?? null;
    if (!version) return null;
    return { version };
  } catch {
    return null;
  }
}

export const metadata: Metadata = {
  title: "Klipprr — Clip & Download Videos | YouTube, Twitch & More",
  description:
    "Klipprr is a desktop app for editors and creators. Clip any YouTube, Twitch, Instagram or X video — export just the part you want. No full download needed.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Klipprr — Clip & Download Videos | YouTube, Twitch & More",
    description:
      "Clip and download exactly the part of any video you want. Supports YouTube, Twitch, Reels, Twitter/X and local files. Free to start.",
    url: "https://klipprr.com",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "@klipprr",
    creator: "@klipprr",
    title: "Klipprr — Clip & Download Videos | YouTube, Twitch & More",
    description:
      "Clip and download exactly the part of any video you want. Supports YouTube, Twitch, Reels, Twitter/X and local files. Free to start.",
  },
};

export default async function Home() {
  const release = await getLatestRelease();
  const softwareApplicationJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Klipprr",
    url: "https://klipprr.com",
    downloadUrl: "https://klipprr.com/download",
    image: "https://klipprr.com/og-image",
    screenshot: "https://klipprr.com/og-image",
    applicationCategory: "MultimediaApplication",
    operatingSystem: "macOS, Windows (coming soon)",
    softwareVersion: release?.version ?? "0.1.19",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "12",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: "$12 monthly or $10/mo when billed yearly upfront.",
      },
      {
        "@type": "Offer",
        name: "Max",
        price: "39",
        priceCurrency: "USD",
        availability: "https://schema.org/InStock",
        description: "$39 monthly or $33/mo when billed yearly upfront.",
      },
    ],
    description:
      "Klipprr is a native desktop application for editors and creators. Clip any part of a YouTube, Twitch, Instagram Reels, Twitter/X, or local video file by setting precise in and out points, then export only that segment.",
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Klipprr",
    url: "https://klipprr.com",
    logo: "https://klipprr.com/logo.png",
    description:
      "Klipprr is a desktop video clipping app for creators who need fast, precise exports from online and local videos.",
    email: "hello@klipprr.com",
    foundingLocation: { "@type": "Place", addressCountry: "SK" },
    sameAs: [
      "https://x.com/klipprr",
      "https://www.instagram.com/klipprr/",
      "https://tiktok.com/@getklipprr",
    ],
  };

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Klipprr",
    url: "https://klipprr.com",
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Can I download just part of a YouTube video?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes — that's exactly what Klipprr is built for. Paste the YouTube URL, set your in and out points on the timeline, and export only the segment you want. No downloading the full video first, no screen recording, no manual trimming after the fact. It works the same way for Twitch VODs, Instagram Reels, and Twitter/X clips.",
        },
      },
      {
        "@type": "Question",
        name: "Which platforms does Klipprr support?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "YouTube, Twitch, Instagram Reels, Twitter/X, and local video files. Paste a URL or drag in a file — Klipprr handles both in the same workflow. More platforms are on the roadmap. If there's one you need urgently, email us at hello@klipprr.com.",
        },
      },
      {
        "@type": "Question",
        name: "Is Klipprr free to use?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. The free plan gives you 10 clips per month at up to 720p, with a small watermark. No credit card required to get started. When you need more — higher quality, no watermark, or more clips per month — Pro ($12/mo) and Max ($39/mo) have you covered. Both paid plans include a yearly option that works out to 2 months free.",
        },
      },
      {
        "@type": "Question",
        name: "How do I get rid of the watermark?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Upgrade to Pro or Max. Both remove the watermark entirely and raise the export quality ceiling. Pro goes up to 4K and gives you 120 clips per month. Max goes up to 8K (where the source supports it) and gives you 500 clips per month. If you're clipping for clients or publishing regularly, Pro pays for itself fast.",
        },
      },
      {
        "@type": "Question",
        name: "What's the difference between Pro and Max?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Both remove watermarks and unlock higher quality exports. The difference is scale. Pro gives you up to 4K and 120 clips per month — the right fit for most creators. Max gives you up to 8K and 500 clips per month, plus priority support. If you're running a heavy editorial or social workflow, Max removes the ceiling.",
        },
      },
      {
        "@type": "Question",
        name: "Do I need an account to use Klipprr?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Not to try it. You can download and use the free tier without signing up. An account is only required when you upgrade to Pro or Max — so your subscription and clip limits stay synced. Sign in before checkout for the smoothest experience.",
        },
      },
      {
        "@type": "Question",
        name: "What Mac do I need to run Klipprr?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Klipprr is built for Apple Silicon — M1, M2, M3, and newer. Hardware-accelerated export relies on Apple's VideoToolbox, which is why the app is fast on these chips. Intel Mac support is something we're evaluating. If you're on Intel and want to be notified, drop us a note at hello@klipprr.com.",
        },
      },
      {
        "@type": "Question",
        name: "How is Klipprr different from yt-dlp or youtube-dl?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "yt-dlp is powerful and we respect it — but it's a command-line tool. Every clip requires typing a command, managing flags, and piping through ffmpeg to trim. Klipprr gives you a visual timeline, instant preview, and one-click export. If you clip videos more than occasionally, the time saved adds up fast. Klipprr is for people who want results, not a terminal session.",
        },
      },
      {
        "@type": "Question",
        name: "Can I use Klipprr without internet?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, for local files. If the video is already on your Mac, Klipprr works without any internet connection. For URL-based sources like YouTube or Twitch, you need a connection to resolve and stream the media — but processing and export always happen locally on your machine.",
        },
      },
      {
        "@type": "Question",
        name: "Does Klipprr upload my videos anywhere?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. All clipping and export happens locally in the app on your Mac. Your video files never leave your machine. The only server interaction is for account authentication and billing — nothing related to your video content. See the Privacy Policy for the full picture.",
        },
      },
    ],
  };

  const videoObjectJsonLd = {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    name: "Klipprr Demo — Clip Any Part of a Video on Mac",
    description:
      "See how Klipprr lets you paste a YouTube, Twitch, Instagram or X URL, set precise in and out points on a visual timeline, and export only that segment in seconds.",
    thumbnailUrl: "https://klipprr.com/logo.png",
    uploadDate: "2025-06-01",
    duration: "PT1M30S",
    contentUrl: "https://klipprr.com/demo.mp4",
    publisher: {
      "@type": "Organization",
      name: "Klipprr",
      logo: {
        "@type": "ImageObject",
        url: "https://klipprr.com/logo.png",
      },
    },
  };

  const features = [
    {
      title: "YouTube, Twitch, Instagram & X",
      description: "Paste any video URL and start clipping instantly. No full download required.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
    },
    {
      title: "Frame-Perfect Trimming",
      description: "Set precise in and out points with a visual timeline. What you see is what you export.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12h20M12 2v20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07"/>
          <circle cx="12" cy="12" r="3"/>
        </svg>
      ),
    },
    {
      title: "Local File Support",
      description: "Already have the video? Load it directly from your Mac and clip away.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
        </svg>
      ),
    },
    {
      title: "Hardware-Accelerated Exports",
      description: "Exports in seconds using your Mac's GPU. Not minutes. Seconds.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>
      ),
    },
    {
      title: "Multiple Clips, One Export",
      description: "Mark multiple clips from one video and batch export them all at once.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect width="8" height="8" x="2" y="2" rx="2"/>
          <path d="M14 2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2"/>
          <path d="M20 2c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2"/>
          <rect width="8" height="8" x="2" y="14" rx="2"/>
          <path d="M14 14c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2"/>
          <path d="M20 14c1.1 0 2 .9 2 2v4c0 1.1-.9 2-2 2"/>
        </svg>
      ),
    },
    {
      title: "Native macOS App",
      description: "Built for Mac. No browser tab. No cloud upload. Your files stay on your machine.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <rect width="20" height="14" x="2" y="3" rx="2"/>
          <path d="M8 21h8M12 17v4"/>
        </svg>
      ),
    },
  ];

  const steps = [
    {
      step: "01",
      title: "Paste URL or Upload",
      description:
        "Paste a supported URL from YouTube, Twitch, Instagram, or X, or load a local file from your Mac. Klipprr resolves the media and prepares a clean preview timeline. This keeps setup fast and removes guesswork before clipping.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
    },
    {
      step: "02",
      title: "Select Your Clip",
      description:
        "Mark exact in and out points with a timeline built for precise trimming. Create multiple clips from one source, adjust ranges quickly, and rename clips before export. What you set in the timeline is what gets exported.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v3"/>
          <path d="M21 16v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-3"/>
          <path d="M4 12H2M8 12H6M12 12h-2M16 12h-2M20 12h-2"/>
        </svg>
      ),
    },
    {
      step: "03",
      title: "Export & Share",
      description:
        "Export in the format and quality you need, from quick social clips to higher-quality deliverables. Klipprr prioritizes local processing for speed and control. Your final clip is ready to publish without extra conversion steps.",
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" x2="12" y1="3" y2="15"/>
        </svg>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoObjectJsonLd) }}
      />

      {/* Nav */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-zinc-950/80 backdrop-blur-xl">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="Klipprr" width={30} height={30} className="rounded-lg" priority />
            <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-zinc-400 transition-colors duration-150 hover:text-white">
              Features
            </a>
            <a href="#how-it-works" className="text-sm text-zinc-400 transition-colors duration-150 hover:text-white">
              How It Works
            </a>
            <a href="#pricing" className="text-sm text-zinc-400 transition-colors duration-150 hover:text-white">
              Pricing
            </a>
            <Link href="/blog" className="text-sm text-zinc-400 transition-colors duration-150 hover:text-white">
              Blog
            </Link>
            <Link href="/login" className="text-sm text-zinc-400 transition-colors duration-150 hover:text-white">
              Sign In
            </Link>
            <Link
              href="/download"
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-zinc-950 transition-all duration-150 hover:bg-zinc-100"
            >
              Download for Mac
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden pt-36 pb-20 px-6">
        {/* Ambient background blobs */}
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div
            className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/4 h-[600px] w-[900px] rounded-full opacity-20"
            style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 70%)" }}
          />
          <div
            className="absolute -right-32 top-32 h-[400px] w-[400px] rounded-full opacity-10"
            style={{ background: "radial-gradient(ellipse at center, #c935ff 0%, transparent 70%)" }}
          />
          <div
            className="absolute -left-32 top-48 h-[300px] w-[300px] rounded-full opacity-8"
            style={{ background: "radial-gradient(ellipse at center, #ff2e92 0%, transparent 70%)" }}
          />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            <span className="text-zinc-300">macOS</span>
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-500">Windows coming soon</span>
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
            Clip Any Part of Any Video.{" "}
            <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-transparent">
              Download in Seconds.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-zinc-400">
            Klipprr is a desktop app built for editors and creators. Paste a YouTube, Twitch,
            Instagram or X URL — or load a local file — set your in and out points, and export just
            that clip. No full downloads. No screen recording. Just the clip you need.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/download"
              className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition-all duration-200 hover:from-violet-500 hover:to-fuchsia-500 hover:shadow-violet-500/40"
            >
              Download for Mac
            </Link>
            <Link
              href="/download"
              className="rounded-full border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-zinc-300 transition-all duration-200 hover:border-violet-500/60 hover:text-white"
            >
              Windows? Join the waitlist →
            </Link>
            <a
              href="#demo"
              className="rounded-full border border-zinc-700 bg-zinc-900/60 px-6 py-3 text-sm font-medium text-white transition-all duration-200 hover:border-zinc-600 hover:bg-zinc-800/60"
            >
              Watch Demo
            </a>
          </div>
        </div>
      </section>

      {/* Product Demo Video */}
      <section id="demo" className="px-6 pb-24">
        <div className="mx-auto max-w-5xl">
          <div className="relative">
            {/* Glow behind video */}
            <div
              className="absolute inset-0 -z-10 rounded-3xl opacity-40 blur-2xl"
              style={{ background: "radial-gradient(ellipse at center, #7c3aed 0%, transparent 60%)" }}
              aria-hidden="true"
            />
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 shadow-2xl shadow-violet-900/20">
              {/* Window chrome bar */}
              <div className="flex items-center gap-2 border-b border-white/[0.06] bg-zinc-900/80 px-5 py-3.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-amber-500/80" />
                <span className="h-3 w-3 rounded-full bg-emerald-500/80" />
                <span className="ml-3 text-xs text-zinc-500">Klipprr — Demo</span>
              </div>
              <video
                src="/demo.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full"
                style={{ display: "block" }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-zinc-800/60 py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Everything You Need to Clip Faster
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              Built for content creators, streamers, and editors
            </p>
          </div>
          <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="group rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-6 transition-all duration-200 hover:border-violet-500/30 hover:bg-zinc-900/70"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 transition-colors duration-200 group-hover:bg-violet-500/20">
                  {f.icon}
                </div>
                <h3 className="mt-4 text-base font-semibold text-white">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-400">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Supported Platforms */}
      <section className="border-t border-zinc-800/60 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">Clip from any platform</h2>
            <p className="mt-3 text-zinc-400">Same workflow — paste the URL, set your points, export the clip.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link href="/youtube-clip-downloader" className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-violet-500/50 hover:bg-violet-500/5 transition">
              <div className="mb-3 text-2xl">▶</div>
              <h3 className="font-semibold text-white group-hover:text-violet-300 transition">YouTube</h3>
              <p className="mt-1 text-sm text-zinc-500">Clip any segment from any YouTube video — no full download.</p>
              <span className="mt-3 inline-block text-xs text-violet-400 group-hover:text-violet-300 transition">Learn more →</span>
            </Link>
            <Link href="/twitch-clip-downloader" className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-violet-500/50 hover:bg-violet-500/5 transition">
              <div className="mb-3 text-2xl">🎮</div>
              <h3 className="font-semibold text-white group-hover:text-violet-300 transition">Twitch</h3>
              <p className="mt-1 text-sm text-zinc-500">Pull highlights from VODs of any length, frame by frame.</p>
              <span className="mt-3 inline-block text-xs text-violet-400 group-hover:text-violet-300 transition">Learn more →</span>
            </Link>
            <Link href="/instagram-reel-downloader" className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-violet-500/50 hover:bg-violet-500/5 transition">
              <div className="mb-3 text-2xl">📸</div>
              <h3 className="font-semibold text-white group-hover:text-violet-300 transition">Instagram</h3>
              <p className="mt-1 text-sm text-zinc-500">Save Reels to your Mac locally — no extension required.</p>
              <span className="mt-3 inline-block text-xs text-violet-400 group-hover:text-violet-300 transition">Learn more →</span>
            </Link>
            <Link href="/twitter-clip-downloader" className="group rounded-xl border border-zinc-800 bg-zinc-900/40 p-6 hover:border-violet-500/50 hover:bg-violet-500/5 transition">
              <div className="mb-3 text-2xl">𝕏</div>
              <h3 className="font-semibold text-white group-hover:text-violet-300 transition">Twitter / X</h3>
              <p className="mt-1 text-sm text-zinc-500">Save videos from tweets before they get deleted.</p>
              <span className="mt-3 inline-block text-xs text-violet-400 group-hover:text-violet-300 transition">Learn more →</span>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-t border-zinc-800/60 py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Clip in Three Simple Steps
            </h2>
            <p className="mt-4 text-base text-zinc-400">
              From video to viral clip in under a minute
            </p>
          </div>
          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.step} className="relative text-center">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div
                    className="absolute top-5 left-[calc(50%+2.5rem)] hidden h-px w-[calc(100%-5rem)] bg-gradient-to-r from-violet-500/40 to-transparent sm:block"
                    aria-hidden="true"
                  />
                )}
                <div className="relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400">
                  {s.icon}
                  <span className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-[10px] font-bold text-white">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-base font-semibold text-white">{s.title}</h3>
                <p className="mt-2.5 text-sm leading-relaxed text-zinc-400">{s.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="border-t border-zinc-800/60 py-20 px-6">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-center text-2xl font-bold text-white sm:text-3xl">What creators say</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                quote: "I used to spend 20 minutes trimming clips in Final Cut. Now I do it in Klipprr in about 30 seconds. The timeline is just faster.",
                name: "Alex K.",
                role: "YouTube creator, 180k subscribers",
              },
              {
                quote: "For pulling Twitch highlights, nothing comes close. I set my in/out points and it exports before I even switch tabs. Hardware acceleration is no joke.",
                name: "Mika T.",
                role: "Twitch streamer & editor",
              },
              {
                quote: "I manage social for 4 brands. Klipprr saves me an hour a week just on Instagram Reels — paste, trim if needed, export. Done.",
                name: "Sophie R.",
                role: "Social media manager",
              },
            ].map((t) => (
              <div key={t.name} className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-6">
                <p className="text-sm leading-relaxed text-zinc-300">"{t.quote}"</p>
                <div className="mt-5">
                  <p className="text-sm font-semibold text-white">{t.name}</p>
                  <p className="text-xs text-zinc-500">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* FAQ */}
      <section id="faq" className="border-t border-zinc-800/60 py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">Frequently Asked Questions</h2>
            <p className="mt-4 text-zinc-400">Everything you need to know before downloading.</p>
          </div>
          <div className="mt-12 space-y-2">
            {[
              {
                q: "Can I download just part of a YouTube video?",
                a: "Yes — that's exactly what Klipprr is built for. Paste the YouTube URL, set your in and out points on the timeline, and export only the segment you want. No downloading the full video first, no screen recording, no manual trimming after the fact. It works the same way for Twitch VODs, Instagram Reels, and Twitter/X clips.",
              },
              {
                q: "Which platforms does Klipprr support?",
                a: "YouTube, Twitch, Instagram Reels, Twitter/X, and local video files. Paste a URL or drag in a file — Klipprr handles both in the same workflow. More platforms are on the roadmap. If there's one you need urgently, email us at hello@klipprr.com.",
              },
              {
                q: "Is Klipprr free to use?",
                a: "Yes. The free plan gives you 10 clips per month at up to 720p, with a small watermark. No credit card required to get started. When you need more — higher quality, no watermark, or more clips per month — Pro ($12/mo) and Max ($39/mo) have you covered. Both paid plans include a yearly option that works out to 2 months free.",
              },
              {
                q: "How do I get rid of the watermark?",
                a: "Upgrade to Pro or Max. Both remove the watermark entirely and raise the export quality ceiling. Pro goes up to 4K and gives you 120 clips per month. Max goes up to 8K (where the source supports it) and gives you 500 clips per month. If you're clipping for clients or publishing regularly, Pro pays for itself fast.",
              },
              {
                q: "What's the difference between Pro and Max?",
                a: "Both remove watermarks and unlock higher quality exports. The difference is scale. Pro gives you up to 4K and 120 clips per month — the right fit for most creators. Max gives you up to 8K and 500 clips per month, plus priority support. If you're running a heavy editorial or social workflow, Max removes the ceiling.",
              },
              {
                q: "Do I need an account?",
                a: "Not to try it. You can download and use the free tier without signing up. An account is only required when you upgrade to Pro or Max — so your subscription and clip limits stay synced. Sign in before checkout for the smoothest experience.",
              },
              {
                q: "What Mac do I need?",
                a: "Klipprr is built for Apple Silicon — M1, M2, M3, and newer. Hardware-accelerated export relies on Apple's VideoToolbox, which is why the app is fast on these chips. Intel Mac support is something we're evaluating. If you're on Intel and want to be notified, drop us a note at hello@klipprr.com.",
              },
              {
                q: "How is Klipprr different from yt-dlp or youtube-dl?",
                a: "yt-dlp is powerful and we respect it — but it's a command-line tool. Every clip requires typing a command, managing flags, and piping through ffmpeg to trim. Klipprr gives you a visual timeline, instant preview, and one-click export. If you clip videos more than occasionally, the time saved adds up fast. Klipprr is for people who want results, not a terminal session.",
              },
              {
                q: "Can I use Klipprr offline?",
                a: "Yes, for local files. If the video is already on your Mac, Klipprr works without any internet connection. For URL-based sources like YouTube or Twitch, you need a connection to resolve and stream the media — but processing and export always happen locally on your machine.",
              },
              {
                q: "Does Klipprr upload my videos anywhere?",
                a: "No. All clipping and export happens locally in the app on your Mac. Your video files never leave your machine. The only server interaction is for account authentication and billing — nothing related to your video content. See the Privacy Policy for the full picture.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border border-zinc-800/80 bg-zinc-900/30 open:border-zinc-700/80 open:bg-zinc-900/60 transition-all duration-150"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 marker:hidden [&::-webkit-details-marker]:hidden">
                  <h3 className="text-sm font-semibold text-white">{item.q}</h3>
                  <svg
                    className="h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 group-open:rotate-180"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 16 16"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"
                      clipRule="evenodd"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-4">
                  <p className="text-sm leading-relaxed text-zinc-400">{item.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section className="border-t border-zinc-800/60 py-16 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-8">
            <h2 className="text-xl font-bold text-white">Built by a Small Team of Creators</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Klipprr is independently built by a small EU-based team focused on practical tools for
              editors and content creators. We prioritize speed, reliability, and straightforward workflows
              over feature bloat.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-zinc-400">
              Founded in 2025 by Frederik Hypky in Slovakia, Klipprr is an independent product which started as a side project. The idea was to create a tool to allow users export just the part of a video they need, without having to download the whole video or use a screen recorder. To put it simply, Klipprr allows you to go from long-form video to publish-ready clips in minutes, while providing you with full control.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-16 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="flex flex-col gap-12 md:flex-row md:items-start md:justify-between">
            <div>
              <Link href="/" className="flex items-center gap-2.5">
                <Image src="/logo.png" alt="Klipprr" width={28} height={28} className="rounded-lg" priority />
                <span className="text-base font-semibold tracking-tight text-white">Klipprr</span>
              </Link>
              <p className="mt-3 max-w-xs text-sm text-zinc-500">
                Create viral clips from any video in seconds.
              </p>
            </div>
            <div className="grid gap-8 sm:grid-cols-4">
              <div>
                <h4 className="text-sm font-semibold text-white">Product</h4>
                <ul className="mt-3 space-y-2.5">
                  <li>
                    <Link href="/download" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Download
                    </Link>
                  </li>
                  <li>
                    <a href="#features" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Features
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Pricing
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Resources</h4>
                <ul className="mt-3 space-y-2.5">
                  <li>
                    <Link href="/blog" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Blog
                    </Link>
                  </li>
                  <li>
                    <a href="mailto:hello@klipprr.com" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Support
                    </a>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Company</h4>
                <ul className="mt-3 space-y-2.5">
                  <li>
                    <a href="mailto:hello@klipprr.com" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Contact
                    </a>
                  </li>
                  <li>
                    <Link href="/privacy" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Privacy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Terms
                    </Link>
                  </li>
                  <li>
                    <Link href="/refunds" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Refunds
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Cookies
                    </Link>
                  </li>
                  <li>
                    <Link href="/copyright" className="text-sm text-zinc-500 transition-colors hover:text-white">
                      Copyright
                    </Link>
                  </li>
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Follow Us</h4>
                <ul className="mt-3 space-y-2.5">
                  <li>
                    <a
                      href="https://x.com/klipprr"
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      Twitter / X
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://www.instagram.com/klipprr/"
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      Instagram
                    </a>
                  </li>
                  <li>
                    <a
                      href="https://tiktok.com/@getklipprr"
                      className="text-sm text-zinc-500 transition-colors hover:text-white"
                    >
                      TikTok
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-zinc-800/60 pt-8 sm:flex-row">
            <p className="text-sm text-zinc-600">© 2026 Klipprr. All rights reserved.</p>
            <p className="text-sm text-zinc-600">macOS · Windows coming soon</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
