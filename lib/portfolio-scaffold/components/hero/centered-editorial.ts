import type { ComponentModule } from "../types";
import {
  escapeHtml,
  renderTaglineHtml,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";
import { renderTagline } from "./_shared";

export default function Hero() {
  return (
    <section className="scout-hero relative px-6 pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-3xl">
        <p className="scout-section-eyebrow eyebrow mb-8">
          <span className="text-rust">&sect; 00</span>
          <span className="mx-2 text-rule">/</span>
          {content.primaryRole}
          {content.location ? (
            <>
              <span className="mx-2 text-rule">/</span>
              {content.location}
            </>
          ) : null}
        </p>

        <h1 className="scout-hero-name font-display text-[3rem] leading-[0.92] tracking-[-0.025em] text-ink sm:text-7xl md:text-[5.25rem]">
          {content.name}
        </h1>

        <p className="scout-hero-tagline mt-12 max-w-2xl font-display text-2xl leading-[1.25] text-ink/90 md:text-[1.75rem]">
          {renderTagline(content.tagline, content.taglineEmphasis)}
        </p>

        <p className="scout-hero-intro drop-cap mt-10 max-w-xl text-base leading-[1.7] text-ink/85 md:text-lg">
          {content.intro}
        </p>

        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          <a
            href="#contact"
            className="group inline-flex items-baseline gap-2 border-b-2 border-rust pb-1 font-mono text-[11px] uppercase tracking-[0.22em] text-rust transition-colors hover:text-ink"
          >
            Get in touch
            <span className="transition-transform group-hover:translate-x-0.5">
              &rarr;
            </span>
          </a>
        </div>
      </div>

      <div className="scout-rule mx-auto mt-28 hairline max-w-3xl" />
    </section>
  );
}
`;

export const centeredEditorial: ComponentModule = {
  id: "centered-editorial",
  description:
    "Numbered eyebrow + large display name + drop-cap intro paragraph. The Studio Monograph default. Best for editorial, literary, or generalist briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const eyebrow = [
      `<span class="accent">&sect; 00</span>`,
      `<span class="sep">/</span>`,
      escapeHtml(content.primaryRole),
      content.location
        ? `<span class="sep">/</span>${escapeHtml(content.location)}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    return `
    <section class="scout-hero hero">
      <div class="container">
        <p class="eyebrow scout-section-eyebrow">${eyebrow}</p>
        <h1 class="scout-hero-name">${escapeHtml(content.name)}</h1>
        <p class="scout-hero-tagline tagline">${renderTaglineHtml(content.tagline, content.taglineEmphasis)}</p>
        <p class="scout-hero-intro intro">${escapeHtml(content.intro)}</p>
        <a href="#contact" class="cta">Get in touch &rarr;</a>
      </div>
      <div class="container hero-rule"><div class="hairline scout-rule"></div></div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-hero.hero { padding: 112px 24px 96px; }
  .scout-hero h1.scout-hero-name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 56px;
    line-height: 0.92;
    letter-spacing: -0.025em;
    color: var(--color-ink);
    margin-top: 32px;
  }
  .scout-hero .tagline.scout-hero-tagline {
    font-family: var(--font-display);
    font-size: 26px;
    line-height: 1.25;
    color: color-mix(in srgb, var(--color-ink) 92%, transparent);
    margin-top: 48px;
    max-width: 640px;
  }
  .scout-hero .intro.scout-hero-intro {
    margin-top: 40px;
    max-width: 560px;
    font-size: 17px;
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-ink) 85%, transparent);
  }
  .scout-hero .intro.scout-hero-intro::first-letter {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--color-rust);
    font-size: 4.25em;
    line-height: 0.82;
    float: left;
    padding-right: 0.08em;
    padding-top: 0.04em;
    font-weight: 400;
  }
  .scout-hero .cta {
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    margin-top: 48px;
    border-bottom: 2px solid var(--color-rust);
    padding-bottom: 4px;
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.22em;
    color: var(--color-rust);
  }
  .scout-hero .hero-rule { max-width: 720px; margin: 112px auto 0; }
  @media (min-width: 768px) {
    .scout-hero.hero { padding: 144px 24px 128px; }
    .scout-hero h1.scout-hero-name { font-size: 84px; }
    .scout-hero .tagline.scout-hero-tagline { font-size: 28px; }
    .scout-hero .intro.scout-hero-intro { font-size: 18px; }
  }
`,
};
