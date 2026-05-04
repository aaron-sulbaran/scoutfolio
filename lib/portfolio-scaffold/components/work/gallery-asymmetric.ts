import type { ComponentModule } from "../types";
import {
  ensureProtocol,
  escapeHtml,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";

export default function Work() {
  if (content.projects.length === 0) return null;
  const [feature, ...rest] = content.projects;
  return (
    <section id="work" className="scout-section scout-work-gallery border-t border-rule px-6 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <p className="scout-section-eyebrow eyebrow mb-3">Selected work</p>
        <h2 className="scout-section-title font-display text-4xl italic leading-[0.95] tracking-[-0.025em] text-ink md:text-6xl">
          A working portfolio.
        </h2>

        {feature ? (
          <div className="scout-work-list mt-14 grid gap-10 md:grid-cols-12 md:gap-14">
            <div className="scout-work-item md:col-span-8 md:row-span-2">
              <div className="border-l-4 border-rust pl-6">
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-rust">
                  Featured
                </span>
                <h3 className="scout-work-title mt-3 font-display text-3xl leading-[1.05] text-ink md:text-5xl">
                  {feature.link ? (
                    <a href={feature.link} target="_blank" rel="noopener noreferrer">
                      {feature.title}
                    </a>
                  ) : (
                    feature.title
                  )}
                </h3>
                <p className="mt-3 font-display text-lg italic text-stone md:text-xl">
                  {feature.role}
                </p>
                <p className="scout-work-summary mt-6 max-w-xl text-base leading-[1.7] text-ink/85">
                  {feature.summary}
                </p>
                {feature.outcome ? (
                  <p className="mt-4 max-w-xl text-sm leading-[1.6] text-rust">
                    {feature.outcome}
                  </p>
                ) : null}
                {feature.stack.length > 0 ? (
                  <ul className="scout-work-stack mt-6 flex flex-wrap gap-1.5 font-mono text-[10px] uppercase tracking-[0.16em] text-stone">
                    {feature.stack.map((s) => (
                      <li key={s} className="border border-rule px-2 py-0.5">
                        {s}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </div>

            {rest.map((p, i) => (
              <div
                key={p.title}
                className={\`scout-work-item flex flex-col gap-3 md:col-span-4 \${i % 2 === 0 ? "md:mt-0" : "md:mt-12"}\`}
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-stone">
                  {p.year ?? \`\${String(i + 2).padStart(2, "0")}\`}
                </span>
                <h3 className="scout-work-title font-display text-2xl leading-[1.1] text-ink">
                  {p.link ? (
                    <a
                      href={p.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-rust/40 underline-offset-4 hover:decoration-rust"
                    >
                      {p.title}
                    </a>
                  ) : (
                    p.title
                  )}
                </h3>
                <p className="scout-work-summary text-[13px] leading-[1.6] text-ink/80">
                  {p.summary}
                </p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
`;

export const galleryAsymmetric: ComponentModule = {
  id: "gallery-asymmetric",
  description:
    "Featured-first 12-col asymmetric grid: the first project takes 8 cols on the left with a tall vertical accent stroke, oversized title, and full copy. Remaining projects are smaller 4-col cards alternating offset down the right rail. Best for visual / creative briefs with one or two hero pieces.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    if (content.projects.length === 0) return "";
    const [feature, ...rest] = content.projects;
    if (!feature) return "";

    const featureTitle = feature.link
      ? `<a href="${escapeHtml(ensureProtocol(feature.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(feature.title)}</a>`
      : escapeHtml(feature.title);
    const featureStack =
      feature.stack.length > 0
        ? `<ul class="scout-work-stack gallery-feature-stack">${feature.stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
        : "";
    const featureOutcome = feature.outcome
      ? `<p class="gallery-feature-outcome">${escapeHtml(feature.outcome)}</p>`
      : "";

    const restItems = rest
      .map((p, i) => {
        const titleNode = p.link
          ? `<a href="${escapeHtml(ensureProtocol(p.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>`
          : escapeHtml(p.title);
        const offset = i % 2 === 0 ? "gallery-side-row gallery-side-flush" : "gallery-side-row gallery-side-offset";
        const meta = p.year
          ? escapeHtml(p.year)
          : String(i + 2).padStart(2, "0");
        return `
      <div class="scout-work-item ${offset}">
        <span class="gallery-side-meta">${meta}</span>
        <h3 class="scout-work-title gallery-side-title">${titleNode}</h3>
        <p class="scout-work-summary gallery-side-summary">${escapeHtml(p.summary)}</p>
      </div>`;
      })
      .join("");

    return `
    <section id="work" class="scout-section scout-work-gallery section bordered">
      <div class="container container-wide">
        <p class="eyebrow scout-section-eyebrow">Selected work</p>
        <h2 class="scout-section-title gallery-title">A working portfolio.</h2>
        <div class="scout-work-list gallery-grid">
          <div class="scout-work-item gallery-feature">
            <div class="gallery-feature-inner">
              <span class="gallery-feature-eyebrow">Featured</span>
              <h3 class="scout-work-title gallery-feature-title">${featureTitle}</h3>
              <p class="gallery-feature-role">${escapeHtml(feature.role)}</p>
              <p class="scout-work-summary gallery-feature-summary">${escapeHtml(feature.summary)}</p>
              ${featureOutcome}
              ${featureStack}
            </div>
          </div>
          ${restItems}
        </div>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-work-gallery .gallery-title {
    margin-top: 8px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 40px;
    line-height: 0.95;
    letter-spacing: -0.025em;
    color: var(--color-ink);
  }
  .scout-work-gallery .gallery-grid {
    list-style: none;
    margin-top: 56px;
    display: grid;
    gap: 40px;
    grid-template-columns: 1fr;
  }
  .scout-work-gallery .gallery-feature-inner { border-left: 4px solid var(--color-rust); padding-left: 24px; }
  .scout-work-gallery .gallery-feature-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-rust);
  }
  .scout-work-gallery .gallery-feature-title {
    margin-top: 12px;
    font-family: var(--font-display);
    font-size: 36px;
    line-height: 1.05;
    color: var(--color-ink);
  }
  .scout-work-gallery .gallery-feature-role {
    margin-top: 12px;
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: var(--color-stone);
  }
  .scout-work-gallery .gallery-feature-summary {
    margin-top: 24px;
    max-width: 560px;
    font-size: 16px;
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-ink) 85%, transparent);
  }
  .scout-work-gallery .gallery-feature-outcome {
    margin-top: 16px;
    max-width: 560px;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-rust);
  }
  .scout-work-gallery .gallery-feature-stack {
    margin-top: 24px;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .scout-work-gallery .gallery-feature-stack li {
    border: 1px solid var(--color-rule);
    padding: 2px 8px;
  }
  .scout-work-gallery .gallery-side-row { display: flex; flex-direction: column; gap: 12px; }
  .scout-work-gallery .gallery-side-meta {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .scout-work-gallery .gallery-side-title {
    font-family: var(--font-display);
    font-size: 22px;
    line-height: 1.1;
    color: var(--color-ink);
  }
  .scout-work-gallery .gallery-side-title a {
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--color-rust) 40%, transparent);
    text-underline-offset: 4px;
  }
  .scout-work-gallery .gallery-side-summary { font-size: 13px; line-height: 1.6; color: color-mix(in srgb, var(--color-ink) 80%, transparent); }
  @media (min-width: 768px) {
    .scout-work-gallery .gallery-grid { grid-template-columns: repeat(12, 1fr); gap: 56px; }
    .scout-work-gallery .gallery-feature { grid-column: span 8; grid-row: span 2; }
    .scout-work-gallery .gallery-side-row { grid-column: span 4; }
    .scout-work-gallery .gallery-side-offset { margin-top: 48px; }
    .scout-work-gallery .gallery-feature-title { font-size: 48px; }
    .scout-work-gallery .gallery-title { font-size: 56px; }
  }
`,
};
