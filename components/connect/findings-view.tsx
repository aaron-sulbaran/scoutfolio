import { ExternalLink } from "lucide-react";
import type { Findings } from "@/lib/extract-client";

export function FindingsView({ data }: { data: Findings }) {
  return (
    <div className="mt-5 space-y-4 border-t border-border pt-5">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Tagline
        </p>
        <p className="mt-1.5 font-serif text-lg italic leading-snug text-foreground">
          &ldquo;{data.tagline}&rdquo;
        </p>
      </div>

      {data.projects.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Projects found ({data.projects.length})
          </p>
          <ul className="mt-2 space-y-1.5">
            {data.projects.slice(0, 4).map((project) => (
              <li
                key={project.name}
                className="flex items-baseline gap-2 text-sm"
              >
                <span className="font-medium text-foreground">
                  {project.name}
                </span>
                <span
                  aria-hidden
                  className="mx-1 flex-1 translate-y-[-3px] border-b border-dotted border-border/80"
                />
                <span className="line-clamp-1 shrink-0 max-w-[55%] text-right text-xs text-muted">
                  {project.summary}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.skills.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Skills
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {data.skills.slice(0, 8).map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border bg-background px-2.5 py-0.5 text-[11px] text-foreground"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {data.notableLinks.length > 0 && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Links
          </p>
          <ul className="mt-2 space-y-1">
            {data.notableLinks.slice(0, 4).map((link) => (
              <li key={link.url} className="text-xs">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-accent hover:underline"
                >
                  {link.label}
                  <ExternalLink className="size-2.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export function NarrationPanel({ statuses }: { statuses: string[] }) {
  if (statuses.length === 0) return null;
  return (
    <ol className="mt-5 space-y-1.5 border-t border-border pt-4">
      {statuses.map((status, i) => {
        const isLast = i === statuses.length - 1;
        return (
          <li
            key={`${i}-${status}`}
            className="flex items-baseline gap-2 text-xs"
          >
            <span
              className={`mt-1 size-1.5 shrink-0 rounded-full ${
                isLast ? "animate-pulse bg-accent" : "bg-muted/40"
              }`}
            />
            <span
              className={isLast ? "text-foreground" : "text-muted/80"}
            >
              {status}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
