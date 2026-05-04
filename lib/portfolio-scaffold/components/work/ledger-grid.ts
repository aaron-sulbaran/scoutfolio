import type { ComponentModule } from "../types";
import {
  ensureProtocol,
  escapeHtml,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";
import { SectionHeader } from "./_shared";

export default function Work() {
  if (content.projects.length === 0) return null;
  return (
    <section id="work" className="scout-section px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          numeral="§01"
          label="Selected work"
          title="What I've"
          emphasized="been making."
        />

        <ol className="scout-work-list flex flex-col">
          {content.projects.map((project, i) => (
            <li
              key={project.title}
              className="scout-work-item grid grid-cols-[auto,1fr] gap-x-6 border-t border-rule py-10 md:gap-x-10 md:py-14"
            >
              <div className="scout-work-meta font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
                <div className="text-rust">
                  {String(i + 1).padStart(2, "0")}
                </div>
                {project.year ? (
                  <div className="mt-2">{project.year}</div>
                ) : null}
                {project.featured ? (
                  <div className="mt-2 inline-block border border-rust px-1.5 py-0.5 text-[9px] tracking-[0.2em] text-rust">
                    Featured
                  </div>
                ) : null}
              </div>

              <div>
                <h3 className="scout-work-title font-display text-2xl leading-[1.1] tracking-[-0.01em] text-ink md:text-3xl">
                  {project.link ? (
                    <a
                      href={project.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-rust/40 underline-offset-[6px] decoration-1 transition-colors hover:decoration-rust"
                    >
                      {project.title}
                    </a>
                  ) : (
                    project.title
                  )}
                </h3>

                <p className="mt-2 font-display text-lg italic text-stone">
                  {project.role}
                </p>

                <p className="scout-work-summary mt-5 max-w-2xl text-[15px] leading-[1.7] text-ink/85">
                  {project.summary}
                </p>

                {project.outcome ? (
                  <p className="mt-4 max-w-2xl border-l-2 border-rust pl-4 text-sm leading-[1.6] text-ink/90">
                    {project.outcome}
                  </p>
                ) : null}

                {project.stack.length > 0 ? (
                  <ul className="scout-work-stack mt-6 flex flex-wrap gap-x-1.5 gap-y-1.5">
                    {project.stack.map((tech) => (
                      <li
                        key={tech}
                        className="border border-rule bg-paper-soft px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] text-stone"
                      >
                        {tech}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
`;

export const ledgerGrid: ComponentModule = {
  id: "ledger-grid",
  description:
    "Numbered grid: each project is a row with [num/year/featured] meta on the left and title + role + summary + outcome + stack pills on the right (Studio Monograph default).",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    if (content.projects.length === 0) return "";
    const items = content.projects
      .map((p, i) => {
        const num = String(i + 1).padStart(2, "0");
        const titleNode = p.link
          ? `<a href="${escapeHtml(ensureProtocol(p.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>`
          : escapeHtml(p.title);
        const stack =
          p.stack.length > 0
            ? `<ul class="scout-work-stack work-stack">${p.stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
            : "";
        const outcome = p.outcome
          ? `<p class="work-outcome">${escapeHtml(p.outcome)}</p>`
          : "";
        const year = p.year
          ? `<div class="year">${escapeHtml(p.year)}</div>`
          : "";
        const featured = p.featured ? `<div class="featured">Featured</div>` : "";
        return `
      <li class="scout-work-item work-item">
        <div class="scout-work-meta work-meta">
          <div class="num">${num}</div>
          ${year}
          ${featured}
        </div>
        <div>
          <h3 class="scout-work-title work-title">${titleNode}</h3>
          <p class="work-role">${escapeHtml(p.role)}</p>
          <p class="scout-work-summary work-summary">${escapeHtml(p.summary)}</p>
          ${outcome}
          ${stack}
        </div>
      </li>`;
      })
      .join("");

    return `
    <section id="work" class="scout-section section">
      <div class="container">
        <div class="scout-section-header section-header">
          <span class="scout-section-numeral section-numeral">&sect;01</span>
          <div>
            <p class="eyebrow scout-section-eyebrow label">Selected work</p>
            <h2 class="scout-section-title">What I've <span class="em">been making.</span></h2>
          </div>
        </div>
        <ol class="scout-work-list work-list" style="list-style:none;">${items}</ol>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-work-list { display: flex; flex-direction: column; }
  .scout-work-item.work-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    padding: 40px 0;
    border-top: 1px solid var(--color-rule);
  }
  .scout-work-meta.work-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-stone);
  }
  .scout-work-meta .num { color: var(--color-rust); }
  .scout-work-meta .year { margin-top: 8px; }
  .scout-work-meta .featured {
    margin-top: 8px;
    display: inline-block;
    border: 1px solid var(--color-rust);
    color: var(--color-rust);
    padding: 2px 6px;
    font-size: 9px;
    letter-spacing: 0.2em;
  }
  .scout-work-title.work-title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 26px;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--color-ink);
  }
  .scout-work-title a {
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--color-rust) 40%, transparent);
    text-underline-offset: 6px;
    text-decoration-thickness: 1px;
  }
  .work-role {
    margin-top: 8px;
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: var(--color-stone);
  }
  .scout-work-summary.work-summary {
    margin-top: 20px;
    max-width: 640px;
    font-size: 15px;
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-ink) 85%, transparent);
  }
  .work-outcome {
    margin-top: 16px;
    max-width: 640px;
    border-left: 2px solid var(--color-rust);
    padding-left: 16px;
    font-size: 14px;
    line-height: 1.6;
    color: color-mix(in srgb, var(--color-ink) 92%, transparent);
  }
  .scout-work-stack.work-stack { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px; }
  .scout-work-stack li {
    list-style: none;
    border: 1px solid var(--color-rule);
    background: var(--color-paper-soft);
    padding: 4px 10px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  @media (min-width: 768px) {
    .scout-work-item.work-item { gap: 40px; padding: 56px 0; }
    .scout-work-title.work-title { font-size: 30px; }
  }
`,
};
