---
title: "How to Clip YouTube Shorts on Mac"
description: "How to download and clip YouTube Shorts on macOS — what makes Shorts different from regular YouTube videos, and which tools actually work."
date: "2026-03-28"
author: "Klipprr Team"
slug: "how-to-clip-youtube-shorts-mac"
tags: ["youtube", "shorts", "mac", "tutorial", "video clipping"]
---

# How to Clip YouTube Shorts on Mac

You found a Short you want to save, repurpose, or use as B-roll. Maybe the creator will delete it, or you want to post it to another platform, or you need a 15-second moment from it. Whatever the reason, YouTube doesn't give you a download button.

This guide covers how to clip and download YouTube Shorts on macOS — what makes Shorts technically different from regular YouTube videos, and which methods actually work.

---

> **What is a YouTube Short?**
>
> A YouTube Short is a vertical video, up to 60 seconds long, published in YouTube's short-form format. Shorts have URLs in the format `youtube.com/shorts/VIDEO_ID` (distinct from regular YouTube videos which use `youtube.com/watch?v=VIDEO_ID`). Despite the different URL format, Shorts are hosted on YouTube's standard video infrastructure — they can be clipped and downloaded using the same tools that work on regular YouTube videos.

---

## Why clip YouTube Shorts?

**Save before deletion.** Creators delete Shorts far more often than regular uploads — they're lower-stakes posts, and channels regularly prune their short-form content when pivoting focus. If you've found a Short with information or footage you need, saving it now is the safer move.

**Repurpose for other platforms.** A Short you've downloaded is a source file. You can upload it to TikTok, Instagram Reels, or Twitter/X without needing to re-record or re-edit. The 9:16 vertical format ports directly.

**Use as B-roll.** Shorts often contain short, self-contained visual moments — a product demo, a reaction, a technique walkthrough. These drop cleanly into a larger edit as cutaway footage.

**Archive reference content.** Tutorials, how-tos, and product comparisons published as Shorts disappear from YouTube search over time. If you rely on a Short for ongoing reference, a local copy makes sense.

---

## How YouTube Shorts URLs work

Shorts use a different URL path than regular YouTube videos:

- **Short URL:** `https://www.youtube.com/shorts/dQw4w9WgXcQ`
- **Regular video URL:** `https://www.youtube.com/watch?v=dQw4w9WgXcQ`

The `VIDEO_ID` portion is the same in both cases — it's just the URL path that differs. YouTube treats these as equivalent. If you replace `/shorts/` with `/watch?v=` in a Short's URL, it resolves to the same video (though it may play in the standard horizontal player with letterboxing).

**Where to find a Short's URL:**

- In a browser: copy the URL from the address bar while the Short is playing
- On mobile: tap the Share button in the YouTube app → Copy link — this produces the `/shorts/VIDEO_ID` format
- From a shared link: any link someone sends you from the YouTube app will already be in the correct format

Both URL formats work in Klipprr and yt-dlp. You don't need to convert one to the other.

---

## Method 1: Klipprr

Klipprr is a native macOS app built for exactly this — clipping video segments without downloading the full file first. Here's the workflow for a Short:

**Step 1: Copy the Short's URL.**

In your browser, copy the URL from the address bar. Or use YouTube's Share button and copy the link. Either the `/shorts/VIDEO_ID` or `/watch?v=VIDEO_ID` format works.

**Step 2: Open Klipprr and paste the URL.**

Paste it into the input field at the top of the Klipprr window and press Enter. Klipprr resolves the video source and loads it into the preview timeline. This takes 3–10 seconds regardless of the Short's length.

**Step 3: Note the aspect ratio.**

Shorts are 9:16 vertical. When the video loads in Klipprr's preview, you'll see the vertical frame. This is correct. Klipprr preserves the original aspect ratio — your export will be vertical, not cropped to 16:9.

**Step 4: Set In and Out points (or skip if you want the full Short).**

If you want only part of the Short, scrub to your start frame and press **I** to set the In point. Scrub to your end frame and press **O** to set the Out point. The selected region highlights on the timeline.

If you want the entire Short, you can set the In point at the very beginning and the Out point at the end — or just leave the full duration selected.

**Step 5: Export.**

Click Export. Klipprr processes the clip using Apple's VideoToolbox hardware encoder. On an M1 or newer chip, a 30–60 second Short exports in under 5 seconds. The output is an MP4 in the original 9:16 vertical format.

**Plans:** Free (10 clips/month, up to 720p, watermark), Pro ($12/mo, 120 clips, up to 4K, no watermark), Max ($39/mo, 500 clips, up to 8K).

Since Shorts cap at 1080p regardless of plan, the free plan's 720p limit is the only resolution consideration — upgrading to Pro gives you the full 1080p if the Short was published at that resolution.

---

## Method 2: yt-dlp

yt-dlp is a command-line tool that handles YouTube Shorts natively. No special flags are needed for the `/shorts/` URL format.

**Download a full Short:**

```bash
yt-dlp "https://www.youtube.com/shorts/VIDEO_ID"
```

Replace `VIDEO_ID` with the actual ID from the URL. yt-dlp downloads the highest available quality by default (up to 1080p for Shorts).

**Download at a specific resolution:**

```bash
yt-dlp -f "bestvideo[height<=1080]+bestaudio/best[height<=1080]" "https://www.youtube.com/shorts/VIDEO_ID"
```

**Clip a specific segment using yt-dlp + ffmpeg:**

yt-dlp alone downloads the full file. To extract a segment, pipe through ffmpeg:

```bash
yt-dlp -o - "https://www.youtube.com/shorts/VIDEO_ID" | ffmpeg -i - -ss 00:00:05 -to 00:00:20 -c copy output.mp4
```

This approach requires ffmpeg to be installed (`brew install ffmpeg`) and some comfort with the terminal. For a single Short you want whole, the plain yt-dlp command is enough.

---

## Method 3: Online tools

Browser-based tools like SaveFrom, SnapSave, and similar sites accept YouTube URLs and return a download link. They generally work for Shorts. Trade-offs:

- **No partial clip support.** Online tools download the full Short. Trimming requires a separate step.
- **Re-compression.** Most online tools re-encode the video before serving it, which reduces quality slightly.
- **Watermarks.** Free tiers of most online tools add watermarks.
- **Your URL passes through a third-party server.** For most content this is a minor concern, but it's worth knowing.
- **Availability.** These services come and go — a tool that worked last month may have changed its terms or shut down.

For a one-off download where you don't mind re-compression and you don't need a specific segment, online tools are convenient. For regular use, a local tool is more reliable.

---

## The vertical format consideration

Shorts are 9:16 (vertical), which is the native format for TikTok, Instagram Reels, and YouTube Shorts itself. For most repurposing workflows, no conversion is needed:

- **TikTok:** native vertical, no conversion needed
- **Instagram Reels:** native vertical, no conversion needed
- **Twitter/X:** vertical video plays inline without issue
- **YouTube (regular upload):** plays fine, but the player will letterbox it — black bars on the left and right for viewers watching on a wide screen

The only case where the aspect ratio requires editing is if you're publishing to a platform that prefers 16:9 — a standard YouTube video, a Vimeo upload, or a presentation. In that case, you'd either crop the vertical frame to 16:9 (losing the top and bottom), or add side panels in an editor to fill the horizontal space. Neither is a Klipprr operation — you'd do that in Final Cut Pro, DaVinci Resolve, or CapCut after the export.

---

## Can you clip part of a YouTube Short?

Yes. Shorts run up to 60 seconds, but the relevant moment may be much shorter — 5 seconds, 10 seconds, 20 seconds. Set In and Out points in Klipprr to export only the segment you need.

There's no minimum clip length. A 3-second clip exports the same way as a 55-second clip.

---

## Short vs. regular YouTube video — differences in clipping

| Aspect | YouTube Short | Regular YouTube video |
|---|---|---|
| URL format | `/shorts/VIDEO_ID` | `/watch?v=VIDEO_ID` |
| Maximum length | 60 seconds | No maximum |
| Aspect ratio | 9:16 vertical | Usually 16:9 horizontal |
| Maximum resolution | 1080p | Up to 8K depending on upload |
| Works with Klipprr | Yes | Yes |
| Works with yt-dlp | Yes | Yes |
| Scrubbing required | Minimal (60 sec max) | Varies by video length |

The URL format is the only structural difference that matters for downloading. Both Klipprr and yt-dlp handle either URL form without additional configuration.

---

## Comparison: methods for clipping YouTube Shorts on Mac

| Method | Works with Shorts URL | Download full Short | Partial clip | Vertical format preserved |
|---|---|---|---|---|
| Klipprr | Yes | Yes | Yes | Yes |
| yt-dlp | Yes | Yes | With ffmpeg | Yes |
| Online tools | Some | Usually | Rarely | Usually |
| Screen recording | Yes | Yes | With trimming | Depends on recording setup |

---

## Frequently asked questions

**Are YouTube Shorts URLs different from regular YouTube videos?**

Yes — Shorts use `/shorts/VIDEO_ID` while regular videos use `/watch?v=VIDEO_ID`. However, both Klipprr and yt-dlp handle either format without issue. You can often swap `/shorts/` for `/watch?v=` in a Short's URL and it resolves to the same video.

**Do YouTube Shorts have higher quality than regular videos?**

No. Shorts cap at 1080p (60fps). They don't support 4K. This means for downloading Shorts, the free plan's 720p cap is the main resolution consideration — Pro gets you the full 1080p if the Short was published at that resolution.

**Can I use a YouTube Short URL shared from the mobile app?**

Yes. The share link from the YouTube iOS or Android app produces the same `/shorts/VIDEO_ID` format that Klipprr accepts. Paste it directly.

**What's the file size of a downloaded YouTube Short?**

A typical 30-second 1080p Short exported as MP4 is approximately 15–35MB depending on content complexity. Fast-moving footage with lots of detail (sports, gaming) runs larger; static talking-head or slow-moving footage runs smaller.

**What if the Short has been deleted by the time I try to download it?**

If the creator has deleted the Short, Klipprr and yt-dlp will return an error when you paste the URL — YouTube's servers no longer serve the video. There's no workaround for deleted content. This is one reason to save Shorts proactively if you know you'll need them.

**Can I batch download multiple Shorts at once?**

With yt-dlp: yes, by passing multiple URLs or a playlist. With Klipprr: the workflow is per-video, though you can queue multiple export segments from a single video load.

---

## Summary

| Step | What to do |
|---|---|
| 1 | Copy the Short's URL (either `/shorts/` or `/watch?v=` format) |
| 2 | Open Klipprr and paste the URL |
| 3 | Video loads in preview — 9:16 vertical aspect ratio preserved |
| 4 | Set In and Out points for a segment, or export the full Short |
| 5 | Export — MP4 saved to your Mac in seconds |

The vertical format ports directly to TikTok, Instagram Reels, and Twitter/X without conversion.

→ [Download Klipprr for Mac](https://klipprr.com/download) — free to start, 10 clips/month  
→ [Klipprr YouTube Clip Downloader](https://klipprr.com/youtube-clip-downloader)
