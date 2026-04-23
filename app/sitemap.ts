import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";

function getBlogPosts(): { slug: string; date: string }[] {
  const dir = path.join(process.cwd(), "public", "blog");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".md"))
    .map((file) => {
      const raw = fs.readFileSync(path.join(dir, file), "utf8");
      const match = raw.match(/^---\n[\s\S]*?date:\s*"?([^"\n]+)"?[\s\S]*?\n---/);
      const date = match?.[1] ?? "2026-01-01";
      return { slug: file.replace(/\.md$/, ""), date };
    });
}

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://klipprr.com";
  const blogPosts = getBlogPosts();

  return [
    { url: `${base}/`, lastModified: new Date("2026-04-23"), changeFrequency: "weekly", priority: 1.0 },
    { url: `${base}/download`, lastModified: new Date("2026-04-23"), changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/youtube-clip-downloader`, lastModified: new Date("2026-04-23"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/twitch-clip-downloader`, lastModified: new Date("2026-04-23"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/instagram-reel-downloader`, lastModified: new Date("2026-04-23"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/twitter-clip-downloader`, lastModified: new Date("2026-04-23"), changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/blog`, lastModified: new Date("2026-04-23"), changeFrequency: "weekly", priority: 0.8 },
    ...blogPosts.map(({ slug, date }) => ({
      url: `${base}/blog/${slug}`,
      lastModified: new Date(date),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    { url: `${base}/privacy`, lastModified: new Date("2026-04-10"), changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/terms`, lastModified: new Date("2026-04-10"), changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/cookies`, lastModified: new Date("2026-04-10"), changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/refunds`, lastModified: new Date("2026-04-10"), changeFrequency: "yearly", priority: 0.1 },
    { url: `${base}/copyright`, lastModified: new Date("2026-04-10"), changeFrequency: "yearly", priority: 0.1 },
  ];
}
