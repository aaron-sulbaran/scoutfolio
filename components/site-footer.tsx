import { ScoutMark } from "@/components/scout-mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-xs text-muted md:flex-row">
        <div className="flex items-center gap-2">
          <ScoutMark className="size-3.5 text-accent" />
          <span>
            Built for Vercel&rsquo;s Zero to Agent Hackathon &middot; 2026
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.2em] opacity-60">
          v0.1 / LIVE
        </span>
      </div>
    </footer>
  );
}
