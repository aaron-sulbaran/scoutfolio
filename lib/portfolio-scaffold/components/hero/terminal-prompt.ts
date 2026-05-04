import type { ComponentModule } from "../types";
import {
  escapeHtml,
  renderTaglineHtml,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";
import { renderTagline } from "./_shared";

const PROMPT_USER = "scout";

export default function Hero() {
  const slug = content.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return (
    <section className="scout-hero font-mono px-6 pt-20 pb-16 md:pt-28 md:pb-20">
      <div className="mx-auto max-w-3xl">
        <p className="scout-section-eyebrow text-[11px] tracking-[0.18em] text-stone">
          <span className="text-rust">{PROMPT_USER}@portfolio</span>:
          <span className="text-stone/80">~/{slug}</span>
          <span className="text-rust">$</span>{" "}
          <span className="text-ink">whoami</span>
        </p>
        <pre className="scout-pre mt-6 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-[1.7] text-ink">
{\`name        \${content.name}
role        \${content.primaryRole}\${content.location ? \`
location    \${content.location}\` : ""}\`}
        </pre>

        <p className="scout-hero-name mt-12 font-display text-5xl leading-[0.9] tracking-[-0.025em] text-ink md:text-7xl">
          {content.name}
          <span className="scout-cursor ml-1 inline-block h-[0.7em] w-[0.5ch] -translate-y-[0.1em] bg-rust align-middle" aria-hidden />
        </p>

        <p className="scout-hero-tagline mt-8 max-w-2xl text-lg leading-[1.55] text-ink/90 md:text-xl">
          [tagline] {renderTagline(content.tagline, content.taglineEmphasis)}
        </p>

        <p className="scout-hero-intro mt-6 max-w-2xl text-[15px] leading-[1.7] text-ink/80 md:text-base">
          {content.intro}
        </p>

        <p className="mt-10 text-[11px] tracking-[0.18em] text-stone">
          <span className="text-rust">{PROMPT_USER}@portfolio</span>:
          <span className="text-stone/80">~/{slug}</span>
          <span className="text-rust">$</span>{" "}
          <span className="text-ink">cd ./work</span>
        </p>
      </div>
    </section>
  );
}
`;

export const terminalPrompt: ComponentModule = {
  id: "terminal-prompt",
  description:
    "Mono-first terminal aesthetic. Prompt header (`scout@portfolio:~/slug $ whoami`), name with blinking-cursor flourish, [tagline] / [intro] mono labels. Best for developer / hacker briefs. Pairs with mode: dark.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const slug = content.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const tableLines = [
      `name        ${escapeHtml(content.name)}`,
      `role        ${escapeHtml(content.primaryRole)}`,
      content.location ? `location    ${escapeHtml(content.location)}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    return `
    <section class="scout-hero hero-term">
      <div class="container">
        <p class="hero-term-prompt scout-section-eyebrow">
          <span class="hero-term-user">scout@portfolio</span>:<span class="hero-term-cwd">~/${slug}</span>
          <span class="hero-term-sigil">$</span>
          <span class="hero-term-cmd">whoami</span>
        </p>
        <pre class="scout-pre hero-term-pre">${tableLines}</pre>
        <h1 class="scout-hero-name hero-term-name">${escapeHtml(content.name)}<span class="scout-cursor" aria-hidden></span></h1>
        <p class="scout-hero-tagline hero-term-tagline">[tagline] ${renderTaglineHtml(content.tagline, content.taglineEmphasis)}</p>
        <p class="scout-hero-intro hero-term-intro">${escapeHtml(content.intro)}</p>
        <p class="hero-term-prompt hero-term-next">
          <span class="hero-term-user">scout@portfolio</span>:<span class="hero-term-cwd">~/${slug}</span>
          <span class="hero-term-sigil">$</span>
          <span class="hero-term-cmd">cd ./work</span>
        </p>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .hero-term { padding: 80px 24px 64px; font-family: var(--font-mono); }
  .hero-term-prompt {
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.18em;
    color: var(--color-stone);
  }
  .hero-term-user { color: var(--color-rust); }
  .hero-term-cwd { color: color-mix(in srgb, var(--color-stone) 80%, transparent); }
  .hero-term-sigil { color: var(--color-rust); margin: 0 6px; }
  .hero-term-cmd { color: var(--color-ink); }
  .hero-term-pre { margin-top: 24px; }
  .hero-term-name {
    margin-top: 48px;
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 56px;
    line-height: 0.9;
    letter-spacing: -0.025em;
    color: var(--color-ink);
  }
  .scout-cursor {
    display: inline-block;
    width: 0.5ch;
    height: 0.7em;
    background: var(--color-rust);
    transform: translateY(-0.1em);
    margin-left: 4px;
    animation: scout-blink 1s steps(2) infinite;
    vertical-align: middle;
  }
  @keyframes scout-blink {
    0%, 50% { opacity: 1; }
    50.01%, 100% { opacity: 0; }
  }
  .hero-term-tagline {
    margin-top: 32px;
    max-width: 720px;
    font-family: var(--font-mono);
    font-size: 17px;
    line-height: 1.55;
    color: color-mix(in srgb, var(--color-ink) 92%, transparent);
  }
  .hero-term-intro {
    margin-top: 24px;
    max-width: 720px;
    font-family: var(--font-mono);
    font-size: 14px;
    line-height: 1.7;
    color: color-mix(in srgb, var(--color-ink) 80%, transparent);
  }
  .hero-term-next { margin-top: 40px; }
  @media (min-width: 768px) {
    .hero-term { padding: 112px 24px 80px; }
    .hero-term-name { font-size: 80px; }
    .hero-term-tagline { font-size: 19px; }
    .hero-term-intro { font-size: 15px; }
  }
`,
};
