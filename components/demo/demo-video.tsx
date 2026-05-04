"use client";

import { useRef, useState } from "react";
import { Play } from "lucide-react";

const RAW_SRC =
  process.env.NEXT_PUBLIC_DEMO_WALKTHROUGH_URL?.trim() ||
  "/demo/ScoutFolio-Walkthrough.mov";
const POSTER_SRC = "/demo/walkthrough-poster.svg";

function toDriveEmbed(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/(^|\.)drive\.google\.com$/.test(u.hostname)) return null;
    if (u.pathname.endsWith("/preview")) return url;
    const m = u.pathname.match(/\/file\/d\/([^/]+)/);
    if (m) return `https://drive.google.com/file/d/${m[1]}/preview`;
    const id = u.searchParams.get("id");
    if (id) return `https://drive.google.com/file/d/${id}/preview`;
    return null;
  } catch {
    return null;
  }
}

const driveEmbed = toDriveEmbed(RAW_SRC);

export function DemoVideo() {
  if (driveEmbed) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(61,45,79,0.35)]">
        <div className="relative aspect-video w-full bg-foreground/5">
          <iframe
            src={driveEmbed}
            title="ScoutFolio walkthrough"
            allow="autoplay; fullscreen"
            allowFullScreen
            className="absolute inset-0 size-full"
          />
        </div>
      </div>
    );
  }

  return <NativeVideo />;
}

function NativeVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [started, setStarted] = useState(false);
  const [missing, setMissing] = useState(false);

  const handlePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {
      setMissing(true);
    });
    setStarted(true);
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_30px_80px_-40px_rgba(61,45,79,0.35)]">
      <div className="relative aspect-video w-full bg-foreground/5">
        <video
          ref={videoRef}
          className="absolute inset-0 size-full object-cover"
          src={RAW_SRC}
          poster={POSTER_SRC}
          controls={started}
          playsInline
          preload="metadata"
          onError={() => setMissing(true)}
        />

        {!started && !missing && (
          <button
            type="button"
            onClick={handlePlay}
            className="absolute inset-0 flex items-center justify-center bg-foreground/30 backdrop-blur-[1px] transition-colors hover:bg-foreground/40"
            aria-label="Play walkthrough"
          >
            <span className="inline-flex size-16 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_18px_40px_-12px_rgba(61,45,79,0.7)] transition-transform hover:scale-105">
              <Play className="size-6 translate-x-[1px]" />
            </span>
          </button>
        )}

        {missing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-card px-6 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Walkthrough video coming soon
            </p>
            <p className="max-w-sm text-sm text-foreground">
              Set{" "}
              <code className="font-mono text-xs text-accent">
                NEXT_PUBLIC_DEMO_WALKTHROUGH_URL
              </code>{" "}
              to a public video URL (e.g. a Vercel Blob `.mov`/`.mp4`, or a Google Drive{" "}
              <code className="font-mono text-xs text-accent">/preview</code> link).
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
