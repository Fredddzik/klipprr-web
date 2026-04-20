"use client";

import { trackDownload } from "@/lib/analytics";

type Props = {
  href: string;
  version?: string;
  label?: string;
};

export function DownloadButton({ href, version, label }: Props) {
  return (
    <a
      href={href}
      onClick={() => trackDownload("mac")}
      className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all duration-150 hover:from-violet-500 hover:to-fuchsia-500"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" x2="12" y1="15" y2="3" />
      </svg>
      Download Klipprr{version ? ` v${version}` : ""}
      {label ? <span className="text-violet-200 font-normal">({label})</span> : null}
    </a>
  );
}
