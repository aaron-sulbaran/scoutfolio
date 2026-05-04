import type { ComponentModule } from "../types";
import {
  ensureProtocol,
  escapeHtml,
  type PortfolioContent,
} from "../../templates/_common";

function fakeHash(seed: string, index: number): string {
  let h = 0;
  const input = seed + index;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

const TSX = `import { content } from "../data";

function fakeHash(seed: string, index: number): string {
  let h = 0;
  const input = seed + index;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h.toString(16).padStart(7, "0").slice(0, 7);
}

export default function Work() {
  if (content.projects.length === 0) return null;
  return (
    <section id="work" className="scout-section scout-work-gitlog font-mono px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="scout-section-eyebrow text-[11px] tracking-[0.18em] text-stone">
          $ git log --oneline --decorate
        </p>

        <ol className="scout-work-list mt-8 flex flex-col">
          {content.projects.map((p, i) => {
            const hash = fakeHash(p.title, i);
            return (
              <li
                key={p.title}
                className="scout-work-item border-t border-rule py-6 first:border-t-0"
              >
                <div className="scout-work-meta flex flex-wrap items-baseline gap-x-3 gap-y-1 text-[12px] text-stone">
                  <span className="text-rust">{hash}</span>
                  {p.featured ? (
                    <span className="rounded-sm bg-rust/15 px-1.5 py-0.5 text-[10px] uppercase tracking-[0.18em] text-rust">
                      HEAD &rarr; main
                    </span>
                  ) : null}
                  {p.year ? (
                    <span className="ml-auto text-[11px] text-stone/80">{p.year}</span>
                  ) : null}
                </div>
                <h3 className="scout-work-title mt-2 font-mono text-base leading-[1.45] text-ink md:text-lg">
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-stone underline-offset-4 hover:decoration-rust hover:text-rust"
                    >
                      feat({p.title.toLowerCase().replace(/\\s+/g, "-").slice(0, 24)}): {p.role}
                    </a>
                  ) : (
                    \`feat(\${p.title.toLowerCase().replace(/\\s+/g, "-").slice(0, 24)}): \${p.role}\`
                  )}
                </h3>
                <p className="scout-work-summary mt-3 max-w-2xl pl-4 text-[13px] leading-[1.65] text-ink/80 before:mr-2 before:text-stone before:content-['#']">
                  {p.summary}
                </p>
                {p.outcome ? (
                  <p className="mt-2 max-w-2xl pl-4 text-[12px] leading-[1.55] text-rust/90 before:mr-2 before:content-['+']">
                    {p.outcome}
                  </p>
                ) : null}
                {p.stack.length > 0 ? (
                  <p className="mt-3 pl-4 text-[11px] text-stone">
                    <span className="text-stone/70">tags: </span>
                    {p.stack.join(", ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
`;

export const gitLog: ComponentModule = {
  id: "git-log",
  description:
    "Commit-style log. Each project is a row with a fake hash (mono accent), optional `HEAD -> main` chip for featured items, role formatted as a conventional-commit subject (`feat(slug): role`), summary indented like a `#` comment, outcome as a `+` line, stack as `tags:`. Best for developer briefs. Pairs well with terminal-prompt hero.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    if (content.projects.length === 0) return "";
    const items = content.projects
      .map((p, i) => {
        const hash = fakeHash(p.title, i);
        const slug = p.title
          .toLowerCase()
          .replace(/\s+/g, "-")
          .slice(0, 24);
        const titleText = `feat(${slug}): ${p.role}`;
        const titleNode = p.link
          ? `<a href="${escapeHtml(ensureProtocol(p.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(titleText)}</a>`
          : escapeHtml(titleText);
        const headChip = p.featured
          ? `<span class="gitlog-head">HEAD &rarr; main</span>`
          : "";
        const year = p.year
          ? `<span class="gitlog-year">${escapeHtml(p.year)}</span>`
          : "";
        const outcome = p.outcome
          ? `<p class="gitlog-outcome">${escapeHtml(p.outcome)}</p>`
          : "";
        const tags =
          p.stack.length > 0
            ? `<p class="gitlog-tags"><span class="gitlog-tags-key">tags: </span>${escapeHtml(p.stack.join(", "))}</p>`
            : "";
        return `
      <li class="scout-work-item gitlog-row">
        <div class="scout-work-meta gitlog-meta">
          <span class="gitlog-hash">${hash}</span>
          ${headChip}
          ${year}
        </div>
        <h3 class="scout-work-title gitlog-title">${titleNode}</h3>
        <p class="scout-work-summary gitlog-summary">${escapeHtml(p.summary)}</p>
        ${outcome}
        ${tags}
      </li>`;
      })
      .join("");

    return `
    <section id="work" class="scout-section scout-work-gitlog section">
      <div class="container">
        <p class="eyebrow scout-section-eyebrow gitlog-prompt">$ git log --oneline --decorate</p>
        <ol class="scout-work-list gitlog-list">${items}</ol>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-work-gitlog { font-family: var(--font-mono); }
  .scout-work-gitlog .gitlog-prompt {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .scout-work-gitlog .gitlog-list { list-style: none; margin-top: 32px; display: flex; flex-direction: column; }
  .scout-work-gitlog .gitlog-row { padding: 24px 0; border-top: 1px solid var(--color-rule); }
  .scout-work-gitlog .gitlog-row:first-child { border-top: 0; }
  .scout-work-gitlog .gitlog-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: 4px 12px;
    font-family: var(--font-mono);
    font-size: 12px;
    color: var(--color-stone);
  }
  .scout-work-gitlog .gitlog-hash { color: var(--color-rust); }
  .scout-work-gitlog .gitlog-head {
    background: color-mix(in srgb, var(--color-rust) 15%, transparent);
    color: var(--color-rust);
    padding: 2px 6px;
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    border-radius: 2px;
  }
  .scout-work-gitlog .gitlog-year { margin-left: auto; font-size: 11px; color: color-mix(in srgb, var(--color-stone) 80%, transparent); }
  .scout-work-gitlog .gitlog-title {
    margin-top: 8px;
    font-family: var(--font-mono);
    font-size: 16px;
    line-height: 1.45;
    color: var(--color-ink);
  }
  .scout-work-gitlog .gitlog-title a {
    text-decoration: underline;
    text-decoration-color: var(--color-stone);
    text-underline-offset: 4px;
  }
  .scout-work-gitlog .gitlog-title a:hover { color: var(--color-rust); text-decoration-color: var(--color-rust); }
  .scout-work-gitlog .gitlog-summary {
    margin-top: 12px;
    max-width: 640px;
    padding-left: 16px;
    font-size: 13px;
    line-height: 1.65;
    color: color-mix(in srgb, var(--color-ink) 80%, transparent);
    position: relative;
  }
  .scout-work-gitlog .gitlog-summary::before {
    content: "#";
    color: var(--color-stone);
    position: absolute;
    left: 0;
  }
  .scout-work-gitlog .gitlog-outcome {
    margin-top: 6px;
    max-width: 640px;
    padding-left: 16px;
    font-size: 12px;
    line-height: 1.55;
    color: color-mix(in srgb, var(--color-rust) 92%, transparent);
    position: relative;
  }
  .scout-work-gitlog .gitlog-outcome::before {
    content: "+";
    color: var(--color-rust);
    position: absolute;
    left: 0;
  }
  .scout-work-gitlog .gitlog-tags { margin-top: 12px; padding-left: 16px; font-size: 11px; color: var(--color-stone); }
  .scout-work-gitlog .gitlog-tags-key { color: color-mix(in srgb, var(--color-stone) 70%, transparent); }
  @media (min-width: 768px) {
    .scout-work-gitlog .gitlog-title { font-size: 17px; }
  }
`,
};
