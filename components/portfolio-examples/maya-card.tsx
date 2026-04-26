import { ArrowUpRight } from "lucide-react";

const SELECTED_WORK = [
  { title: "How students choose what to make next", tag: "Field study, n=22" },
  { title: "Redesigning the on-campus shuttle wait", tag: "Service blueprint" },
  { title: "What recruiters actually skim", tag: "Diary study" },
];

export function MayaCard() {
  return (
    <article className="group relative flex flex-col rounded-2xl border border-border bg-card p-7 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-30px_rgba(61,45,79,0.35)]">
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono text-muted">01</span>
        <span className="eyebrow">UX Research</span>
      </div>

      <div className="mt-10">
        <h3 className="font-serif text-3xl tracking-tight text-foreground">
          Maya Chen
        </h3>
        <p className="mt-1 text-xs text-muted">
          Junior, Information Studies &middot; UT Austin
        </p>
      </div>

      <ul className="mt-7 space-y-3">
        {SELECTED_WORK.map((work) => (
          <li
            key={work.title}
            className="flex items-baseline gap-2 text-sm leading-snug"
          >
            <span className="font-serif text-foreground">{work.title}</span>
            <span
              aria-hidden
              className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-border/80"
            />
            <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-muted">
              {work.tag}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto pt-8">
        <div className="flex items-center justify-between border-t border-border pt-5">
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
            Generated in 64s
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
