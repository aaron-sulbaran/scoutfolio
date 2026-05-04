import type { ComponentModule } from "../types";
import {
  ensureProtocol,
  escapeHtml,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";

export default function Work() {
  if (content.projects.length === 0) return null;
  return (
    <section id="work" className="scout-section scout-work-list-stack border-t border-rule px-6 py-20 md:py-28">
      <div className="mx-auto max-w-2xl">
        <p className="scout-section-eyebrow eyebrow mb-4">Work</p>
        <ul className="scout-work-list mt-10 flex flex-col gap-12">
          {content.projects.map((p) => (
            <li key={p.title} className="scout-work-item">
              <h3 className="scout-work-title font-display text-2xl font-medium leading-[1.15] text-ink">
                {p.link ? (
                  <a
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline decoration-rust underline-offset-4"
                  >
                    {p.title}
                  </a>
                ) : (
                  p.title
                )}
              </h3>
              <p className="scout-work-summary mt-3 text-[15px] leading-[1.7] text-ink/80">
                {p.summary}
              </p>
              {p.stack.length > 0 ? (
                <ul className="scout-work-stack mt-4 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
                  {p.stack.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
`;

export const listStack: ComponentModule = {
  id: "list-stack",
  description:
    "Quiet single-column list. Each project: bold title (with hairline underline if linked) + one-paragraph summary + inline stack labels. No grid, no numbers, no decoration. Best for minimal briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    if (content.projects.length === 0) return "";
    const items = content.projects
      .map((p) => {
        const titleNode = p.link
          ? `<a href="${escapeHtml(ensureProtocol(p.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>`
          : escapeHtml(p.title);
        const stack =
          p.stack.length > 0
            ? `<ul class="scout-work-stack list-stack-tags">${p.stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
            : "";
        return `
      <li class="scout-work-item list-stack-item">
        <h3 class="scout-work-title list-stack-title">${titleNode}</h3>
        <p class="scout-work-summary list-stack-summary">${escapeHtml(p.summary)}</p>
        ${stack}
      </li>`;
      })
      .join("");

    return `
    <section id="work" class="scout-section scout-work-list-stack section bordered">
      <div class="container">
        <p class="eyebrow scout-section-eyebrow">Work</p>
        <ul class="scout-work-list list-stack-list">${items}</ul>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-work-list-stack .list-stack-list { list-style: none; margin-top: 40px; display: flex; flex-direction: column; gap: 48px; }
  .scout-work-list-stack .list-stack-title {
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 500;
    line-height: 1.15;
    color: var(--color-ink);
  }
  .scout-work-list-stack .list-stack-title a {
    text-decoration: underline;
    text-decoration-color: var(--color-rust);
    text-underline-offset: 4px;
    text-decoration-thickness: 1px;
  }
  .scout-work-list-stack .list-stack-summary {
    margin-top: 12px;
    font-size: 15px;
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-ink) 80%, transparent);
  }
  .scout-work-list-stack .list-stack-tags {
    list-style: none;
    margin-top: 16px;
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
`,
};
