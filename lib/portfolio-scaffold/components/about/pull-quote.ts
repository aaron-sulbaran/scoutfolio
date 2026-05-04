import type { ComponentModule } from "../types";
import { escapeHtml, type PortfolioContent } from "../../templates/_common";

const TSX = `import { content } from "../data";

export default function About() {
  const { headline, paragraphs, sidebar } = content.about;
  const [first, ...rest] = paragraphs;
  return (
    <section
      id="about"
      className="scout-section scout-about scout-about-quote border-t border-rule px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <p className="scout-section-eyebrow eyebrow mb-4">{headline}</p>
        <blockquote className="scout-about-prose font-display text-3xl italic leading-[1.18] text-ink md:text-[2.5rem]">
          &ldquo;{first}&rdquo;
        </blockquote>
        {rest.length > 0 ? (
          <div className="mt-10 max-w-2xl space-y-5 text-[15px] leading-[1.75] text-ink/80 md:text-base">
            {rest.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </div>
        ) : null}

        <dl className="scout-about-sidebar mt-12 grid grid-cols-1 gap-6 border-t border-rule pt-8 sm:grid-cols-3">
          {sidebar.basedIn ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone">
                Based in
              </dt>
              <dd className="mt-1 font-display text-lg text-ink">
                {sidebar.basedIn}
              </dd>
            </div>
          ) : null}
          {sidebar.focusAreas.length > 0 ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone">
                Focus
              </dt>
              <dd className="mt-1 font-display text-lg italic text-ink/90">
                {sidebar.focusAreas.join(", ")}
              </dd>
            </div>
          ) : null}
          {sidebar.currentlyExploring ? (
            <div>
              <dt className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone">
                Currently
              </dt>
              <dd className="mt-1 text-sm leading-[1.55] text-ink/90">
                {sidebar.currentlyExploring}
              </dd>
            </div>
          ) : null}
        </dl>
      </div>
    </section>
  );
}
`;

export const pullQuote: ComponentModule = {
  id: "pull-quote",
  description:
    "First about-paragraph rendered as a large display-italic blockquote (3xl-5xl), remaining paragraphs as quiet body prose below, three-column meta strip at the bottom (Based in / Focus / Currently). Best for editorial / creative briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const { paragraphs, sidebar, headline } = content.about;
    const [first, ...rest] = paragraphs;
    const restHtml =
      rest.length > 0
        ? `<div class="quote-body">${rest.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}</div>`
        : "";
    const metaItems: string[] = [];
    if (sidebar.basedIn)
      metaItems.push(
        `<div><dt>Based in</dt><dd class="quote-meta-display">${escapeHtml(sidebar.basedIn)}</dd></div>`
      );
    if (sidebar.focusAreas.length > 0)
      metaItems.push(
        `<div><dt>Focus</dt><dd class="quote-meta-italic">${escapeHtml(sidebar.focusAreas.join(", "))}</dd></div>`
      );
    if (sidebar.currentlyExploring)
      metaItems.push(
        `<div><dt>Currently</dt><dd class="quote-meta-text">${escapeHtml(sidebar.currentlyExploring)}</dd></div>`
      );

    return `
    <section id="about" class="scout-section scout-about scout-about-quote section bordered">
      <div class="container">
        <p class="eyebrow scout-section-eyebrow">${escapeHtml(headline)}</p>
        <blockquote class="scout-about-prose quote-pull">&ldquo;${escapeHtml(first ?? "")}&rdquo;</blockquote>
        ${restHtml}
        <dl class="scout-about-sidebar quote-meta">${metaItems.join("")}</dl>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-about-quote .quote-pull {
    margin-top: 16px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 32px;
    line-height: 1.18;
    color: var(--color-ink);
  }
  .scout-about-quote .quote-body { margin-top: 32px; max-width: 640px; display: flex; flex-direction: column; gap: 16px; font-size: 15px; line-height: 1.75; color: color-mix(in srgb, var(--color-ink) 80%, transparent); }
  .scout-about-quote .quote-meta {
    margin-top: 48px;
    border-top: 1px solid var(--color-rule);
    padding-top: 32px;
    display: grid;
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .scout-about-quote .quote-meta dt {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .scout-about-quote .quote-meta-display {
    margin-top: 4px;
    font-family: var(--font-display);
    font-size: 18px;
    color: var(--color-ink);
  }
  .scout-about-quote .quote-meta-italic {
    margin-top: 4px;
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: color-mix(in srgb, var(--color-ink) 90%, transparent);
  }
  .scout-about-quote .quote-meta-text {
    margin-top: 4px;
    font-size: 14px;
    line-height: 1.55;
    color: color-mix(in srgb, var(--color-ink) 90%, transparent);
  }
  @media (min-width: 640px) {
    .scout-about-quote .quote-meta { grid-template-columns: repeat(3, 1fr); }
  }
  @media (min-width: 768px) {
    .scout-about-quote .quote-pull { font-size: 40px; }
  }
`,
};
