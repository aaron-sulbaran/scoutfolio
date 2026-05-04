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
    <section className="scout-hero relative overflow-hidden px-6 pt-24 pb-24 md:pt-32 md:pb-28">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[80px,1fr] md:gap-14">
        <div className="hidden md:flex md:flex-col md:items-start md:gap-6 md:pt-3">
          <div className="h-32 w-1 bg-rust" />
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-stone vertical-rl">
            00 / Hero
          </p>
        </div>
        <div className="md:max-w-[42rem]">
          <p className="scout-section-eyebrow eyebrow mb-6">
            <span className="text-rust">{content.primaryRole}</span>
            {content.location ? (
              <>
                <span className="mx-2 text-rule">/</span>
                {content.location}
              </>
            ) : null}
          </p>
          <h1 className="scout-hero-name font-display text-[3.6rem] leading-[0.85] tracking-[-0.04em] text-ink sm:text-[5rem] md:text-[7rem]">
            {content.name}
          </h1>
          <p className="scout-hero-tagline mt-10 max-w-xl font-display text-2xl italic leading-[1.18] text-ink/90 md:text-[2rem]">
            {renderTagline(content.tagline, content.taglineEmphasis)}
          </p>
          <p className="scout-hero-intro mt-10 max-w-lg text-base leading-[1.7] text-ink/80 md:text-lg">
            {content.intro}
          </p>
          <a
            href="#work"
            className="mt-12 inline-flex items-baseline gap-2 font-mono text-[11px] uppercase tracking-[0.24em] text-rust"
          >
            See the work
            <span aria-hidden>&darr;</span>
          </a>
        </div>
      </div>
    </section>
  );
}
`;

export const asymmetricDisplay: ComponentModule = {
  id: "asymmetric-display",
  description:
    "Oversized display name (clamp 56-112px), italic tagline, vertical rust accent stroke on the left rail. Best for visual / creative briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const eyebrow = [
      `<span class="accent">${escapeHtml(content.primaryRole)}</span>`,
      content.location
        ? `<span class="sep">/</span>${escapeHtml(content.location)}`
        : "",
    ]
      .filter(Boolean)
      .join("");

    return `
    <section class="scout-hero hero-asym">
      <div class="hero-asym-inner">
        <div class="hero-asym-rail">
          <div class="hero-asym-stroke"></div>
          <p class="hero-asym-marker">00 / Hero</p>
        </div>
        <div class="hero-asym-body">
          <p class="eyebrow scout-section-eyebrow">${eyebrow}</p>
          <h1 class="scout-hero-name">${escapeHtml(content.name)}</h1>
          <p class="scout-hero-tagline hero-asym-tagline">${renderTaglineHtml(content.tagline, content.taglineEmphasis)}</p>
          <p class="scout-hero-intro hero-asym-intro">${escapeHtml(content.intro)}</p>
          <a href="#work" class="hero-asym-cta">See the work &darr;</a>
        </div>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .hero-asym { padding: 96px 24px; overflow: hidden; }
  .hero-asym-inner { max-width: 1100px; margin: 0 auto; display: grid; gap: 40px; }
  .hero-asym-rail { display: none; }
  .hero-asym-stroke { width: 4px; height: 128px; background: var(--color-rust); }
  .hero-asym-marker {
    margin-top: 16px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .hero-asym-body { max-width: 720px; }
  .scout-hero .scout-hero-name {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: clamp(56px, 12vw, 112px);
    line-height: 0.85;
    letter-spacing: -0.04em;
    color: var(--color-ink);
    margin-top: 24px;
  }
  .hero-asym-tagline {
    margin-top: 40px;
    max-width: 600px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: clamp(22px, 3vw, 32px);
    line-height: 1.18;
    color: color-mix(in srgb, var(--color-ink) 92%, transparent);
  }
  .hero-asym-intro {
    margin-top: 32px;
    max-width: 540px;
    font-size: 17px;
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-ink) 80%, transparent);
  }
  .hero-asym-cta {
    margin-top: 40px;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.24em;
    text-transform: uppercase;
    color: var(--color-rust);
  }
  @media (min-width: 768px) {
    .hero-asym { padding: 128px 24px 112px; }
    .hero-asym-inner { grid-template-columns: 80px 1fr; gap: 56px; }
    .hero-asym-rail { display: flex; flex-direction: column; padding-top: 12px; }
  }
`,
};
