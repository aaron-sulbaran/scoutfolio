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
    <section id="work" className="scout-section scout-work-grid border-t border-rule px-6 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <p className="scout-section-eyebrow eyebrow mb-4">Selected work</p>
        <h2 className="scout-section-title font-display text-3xl tracking-[-0.015em] text-ink md:text-5xl">
          What I've been building.
        </h2>

        <ul className="scout-work-list mt-12 grid gap-6 sm:grid-cols-2 lg:gap-8">
          {content.projects.map((p) => (
            <li
              key={p.title}
              className="scout-work-item flex flex-col gap-4 border border-rule bg-card p-7 transition-colors hover:border-rust"
            >
              <div className="scout-work-meta flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                  {p.year ?? ""}
                </span>
                {p.featured ? (
                  <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-rust">
                    Featured
                  </span>
                ) : null}
              </div>
              <h3 className="scout-work-title font-display text-2xl leading-[1.1] text-ink">
                {p.link ? (
                  <a href={p.link} target="_blank" rel="noopener noreferrer" className="underline decoration-rust/30 underline-offset-4 hover:decoration-rust">
                    {p.title}
                  </a>
                ) : (
                  p.title
                )}
              </h3>
              <p className="font-display text-base italic text-stone">{p.role}</p>
              <p className="scout-work-summary text-[14px] leading-[1.65] text-ink/85">
                {p.summary}
              </p>
              {p.outcome ? (
                <p className="border-l-2 border-rust pl-3 text-[13px] leading-[1.55] text-ink/90">
                  {p.outcome}
                </p>
              ) : null}
              {p.stack.length > 0 ? (
                <ul className="scout-work-stack mt-auto flex flex-wrap gap-1 pt-2">
                  {p.stack.map((s) => (
                    <li
                      key={s}
                      className="border border-rule px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-stone"
                    >
                      {s}
                    </li>
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

export const cardGrid: ComponentModule = {
  id: "card-grid",
  description:
    "Two-column responsive card grid. Each project is a bordered card with year/featured meta on top, title + role + summary + outcome + stack pills inside. Best for general portfolios with several distinct project types.",
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
            ? `<ul class="scout-work-stack work-grid-stack">${p.stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
            : "";
        const outcome = p.outcome
          ? `<p class="work-grid-outcome">${escapeHtml(p.outcome)}</p>`
          : "";
        const featured = p.featured
          ? `<span class="work-grid-featured">Featured</span>`
          : `<span></span>`;
        const year = p.year ? escapeHtml(p.year) : "";
        return `
      <li class="scout-work-item work-grid-card">
        <div class="scout-work-meta work-grid-meta">
          <span class="work-grid-year">${year}</span>
          ${featured}
        </div>
        <h3 class="scout-work-title work-grid-title">${titleNode}</h3>
        <p class="work-grid-role">${escapeHtml(p.role)}</p>
        <p class="scout-work-summary work-grid-summary">${escapeHtml(p.summary)}</p>
        ${outcome}
        ${stack}
      </li>`;
      })
      .join("");

    return `
    <section id="work" class="scout-section scout-work-grid section bordered">
      <div class="container container-wide">
        <p class="eyebrow scout-section-eyebrow">Selected work</p>
        <h2 class="scout-section-title work-grid-title-h2">What I've been building.</h2>
        <ul class="scout-work-list work-grid-list">${items}</ul>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .container-wide { max-width: 1080px; }
  .scout-work-grid .scout-section-title.work-grid-title-h2 {
    margin-top: 8px;
    font-family: var(--font-display);
    font-size: 36px;
    line-height: 1;
    letter-spacing: -0.015em;
    color: var(--color-ink);
  }
  .scout-work-grid .work-grid-list {
    list-style: none;
    margin-top: 48px;
    display: grid;
    gap: 20px;
    grid-template-columns: 1fr;
  }
  .scout-work-grid .work-grid-card {
    display: flex;
    flex-direction: column;
    gap: 16px;
    border: 1px solid var(--color-rule);
    background: var(--color-card);
    padding: 28px;
    transition: border-color 0.2s ease;
  }
  .scout-work-grid .work-grid-card:hover { border-color: var(--color-rust); }
  .scout-work-grid .work-grid-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .scout-work-grid .work-grid-featured { color: var(--color-rust); letter-spacing: 0.22em; font-size: 9px; }
  .scout-work-grid .work-grid-title {
    font-family: var(--font-display);
    font-size: 24px;
    line-height: 1.1;
    color: var(--color-ink);
  }
  .scout-work-grid .work-grid-role {
    font-family: var(--font-display);
    font-size: 15px;
    font-style: italic;
    color: var(--color-stone);
  }
  .scout-work-grid .work-grid-summary { font-size: 14px; line-height: 1.65; color: color-mix(in srgb, var(--color-ink) 85%, transparent); }
  .scout-work-grid .work-grid-outcome {
    border-left: 2px solid var(--color-rust);
    padding-left: 12px;
    font-size: 13px;
    line-height: 1.55;
    color: color-mix(in srgb, var(--color-ink) 92%, transparent);
  }
  .scout-work-grid .work-grid-stack { margin-top: auto; padding-top: 8px; display: flex; flex-wrap: wrap; gap: 4px; list-style: none; }
  .scout-work-grid .work-grid-stack li {
    border: 1px solid var(--color-rule);
    padding: 2px 8px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  @media (min-width: 640px) {
    .scout-work-grid .work-grid-list { grid-template-columns: 1fr 1fr; gap: 24px; }
  }
`,
};
