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
    <section className="scout-hero px-6 pt-32 pb-20 md:pt-44 md:pb-24">
      <div className="mx-auto max-w-xl">
        <h1 className="scout-hero-name font-display text-[2.75rem] leading-[1.05] tracking-[-0.02em] text-ink md:text-[3.5rem]">
          {content.name}
        </h1>
        <p className="scout-section-eyebrow mt-4 font-mono text-[11px] uppercase tracking-[0.22em] text-stone">
          {content.primaryRole}
          {content.location ? \` / \${content.location}\` : ""}
        </p>
        <p className="scout-hero-tagline mt-10 text-lg leading-[1.65] text-ink/90 md:text-xl">
          {renderTagline(content.tagline, content.taglineEmphasis)}
        </p>
        <p className="scout-hero-intro mt-6 text-[15px] leading-[1.75] text-ink/75 md:text-base">
          {content.intro}
        </p>
        <a
          href="#contact"
          className="mt-10 inline-block border-b border-ink pb-0.5 text-sm text-ink transition-colors hover:border-rust hover:text-rust"
        >
          Get in touch
        </a>
      </div>
    </section>
  );
}
`;

export const minimalStack: ComponentModule = {
  id: "minimal-stack",
  description:
    "Single-column, narrow max-width (~640px), generous rhythm. Name as a quiet display heading, role as mono eyebrow underneath, tagline + intro as plain prose, single hairline CTA. Best for minimal / quiet briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const meta = [
      escapeHtml(content.primaryRole),
      content.location ? escapeHtml(content.location) : "",
    ]
      .filter(Boolean)
      .join(" / ");
    return `
    <section class="scout-hero hero-min">
      <div class="hero-min-inner">
        <h1 class="scout-hero-name hero-min-name">${escapeHtml(content.name)}</h1>
        <p class="scout-section-eyebrow hero-min-meta">${meta}</p>
        <p class="scout-hero-tagline hero-min-tagline">${renderTaglineHtml(content.tagline, content.taglineEmphasis)}</p>
        <p class="scout-hero-intro hero-min-intro">${escapeHtml(content.intro)}</p>
        <a href="#contact" class="hero-min-cta">Get in touch</a>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .hero-min { padding: 128px 24px 80px; }
  .hero-min-inner { max-width: 560px; margin: 0 auto; }
  .hero-min-name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 44px;
    line-height: 1.05;
    letter-spacing: -0.02em;
    color: var(--color-ink);
  }
  .hero-min-meta {
    margin-top: 16px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .hero-min-tagline {
    margin-top: 40px;
    font-size: 19px;
    line-height: 1.65;
    color: color-mix(in srgb, var(--color-ink) 92%, transparent);
  }
  .hero-min-intro {
    margin-top: 24px;
    font-size: 15px;
    line-height: 1.75;
    color: color-mix(in srgb, var(--color-ink) 75%, transparent);
  }
  .hero-min-cta {
    display: inline-block;
    margin-top: 40px;
    border-bottom: 1px solid var(--color-ink);
    padding-bottom: 2px;
    font-size: 14px;
    color: var(--color-ink);
    transition: color 0.2s, border-color 0.2s;
  }
  .hero-min-cta:hover { color: var(--color-rust); border-color: var(--color-rust); }
  @media (min-width: 768px) {
    .hero-min { padding: 176px 24px 96px; }
    .hero-min-name { font-size: 56px; }
    .hero-min-tagline { font-size: 20px; }
    .hero-min-intro { font-size: 16px; }
  }
`,
};
