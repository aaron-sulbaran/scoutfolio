import { ArrowUpRight } from "lucide-react";

const REPOS = [
  { name: "taskflow", stars: "142", note: "Multiplayer kanban on Yjs + Supabase" },
  { name: "deno-edge-cache", stars: "38", note: "Stale-while-revalidate at the edge" },
  { name: "shipped/build-log", stars: "—", note: "Why I rewrote my homepage in 4h" },
];

export function JordanCard() {
  return (
    <article className="group relative flex flex-col overflow-hidden rounded-2xl bg-accent p-7 text-accent-foreground transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(61,45,79,0.55)]">
      {/* Subtle commit-graph decoration in the corner */}
      <svg
        aria-hidden
        className="pointer-events-none absolute -right-6 top-6 h-32 w-32 opacity-20"
        viewBox="0 0 120 120"
        fill="none"
      >
        <path
          d="M10 110 V20 M10 60 H40 M10 80 H30 M10 40 H50 M40 60 V20 M40 30 H70 M70 30 V20"
          stroke="currentColor"
          strokeWidth="1"
        />
        <circle cx="10" cy="20" r="3" fill="currentColor" />
        <circle cx="10" cy="40" r="3" fill="currentColor" />
        <circle cx="10" cy="60" r="3" fill="currentColor" />
        <circle cx="10" cy="80" r="3" fill="currentColor" />
        <circle cx="40" cy="20" r="3" fill="currentColor" />
        <circle cx="40" cy="60" r="3" fill="currentColor" />
        <circle cx="50" cy="40" r="3" fill="currentColor" />
        <circle cx="70" cy="20" r="3" fill="currentColor" />
        <circle cx="30" cy="80" r="3" fill="currentColor" />
      </svg>

      <div className="relative flex items-center justify-between text-xs">
        <span className="font-mono opacity-60">02</span>
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] opacity-70">
          Software Engineering
        </span>
      </div>

      <div className="relative mt-10">
        <h3 className="font-mono text-2xl tracking-tight">jordan-park.dev</h3>
        <p className="mt-1 text-xs opacity-60">
          CS Junior &middot; UCLA, aiming at product engineering
        </p>
      </div>

      <div className="relative mt-7 rounded-md bg-black/25 p-4 font-mono text-[11px] leading-relaxed">
        <div className="mb-3 flex items-center gap-1.5 opacity-50">
          <span className="size-2 rounded-full bg-accent-foreground/40" />
          <span className="size-2 rounded-full bg-accent-foreground/40" />
          <span className="size-2 rounded-full bg-accent-foreground/40" />
          <span className="ml-2 text-[10px]">~/featured</span>
        </div>
        <ul className="space-y-2.5">
          {REPOS.map((repo) => (
            <li key={repo.name}>
              <div className="flex items-baseline gap-2">
                <span className="text-accent-foreground">&gt; {repo.name}</span>
                <span className="opacity-50">★ {repo.stars}</span>
              </div>
              <div className="ml-3 text-[10px] opacity-60">{repo.note}</div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative mt-auto pt-7">
        <div className="flex items-center justify-between border-t border-accent-foreground/20 pt-5">
          <span className="font-mono text-[10px] uppercase tracking-wider opacity-60">
            Generated in 71s
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5">
            View
            <ArrowUpRight className="size-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
