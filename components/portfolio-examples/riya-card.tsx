import { ArrowUpRight } from "lucide-react";

export function RiyaCard() {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(61,45,79,0.35)]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted">03</span>
        <span className="eyebrow">Product Design</span>
      </div>

      <div className="mt-10">
        <h3 className="font-serif text-3xl italic tracking-tight text-foreground">
          Riya Patel
        </h3>
        <p className="mt-1 text-xs text-muted">
          Senior, Design &middot; RISD, exploring brand systems
        </p>
      </div>

      <div className="mt-7 grid grid-cols-2 gap-2.5">
        {/* Concentric circle composition */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-accent/[0.07]">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-16 rounded-full border border-accent/30" />
            <div className="absolute size-10 rounded-full bg-accent/20" />
            <div className="absolute size-2 rounded-full bg-accent" />
          </div>
          <span className="absolute bottom-2 left-2.5 font-mono text-[9px] uppercase tracking-wider text-muted">
            Identity / 24
          </span>
        </div>

        {/* Thin frame composition */}
        <div className="relative aspect-[4/5] overflow-hidden rounded-md bg-foreground/[0.04]">
          <div className="absolute inset-x-4 bottom-4 top-10 border border-foreground/25" />
          <div className="absolute inset-x-6 bottom-6 top-12 bg-accent/[0.08]" />
          <span className="absolute bottom-2 left-2.5 font-mono text-[9px] uppercase tracking-wider text-muted">
            Editorial
          </span>
        </div>

        {/* Wide horizontal composition */}
        <div className="relative col-span-2 aspect-[5/2] overflow-hidden rounded-md bg-accent/[0.10]">
          <div className="absolute inset-y-3 left-3 w-[2px] bg-accent/50" />
          <div className="absolute inset-y-3 left-7 right-3 border-y border-accent/30" />
          <div className="absolute right-3 top-1/2 size-2 -translate-y-1/2 rounded-full bg-accent" />
          <span className="absolute bottom-2 left-3 font-mono text-[9px] uppercase tracking-wider text-muted">
            System / Color
          </span>
        </div>
      </div>

      <div className="mt-auto pt-7">
        <div className="flex items-center justify-between border-t border-border pt-5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Generated in 58s
          </span>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-accent transition-transform group-hover:translate-x-0.5">
            View
            <ArrowUpRight className="size-3" />
          </span>
        </div>
      </div>
    </article>
  );
}
