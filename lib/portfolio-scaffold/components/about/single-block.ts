import type { ComponentModule } from "../types";
import { escapeHtml, type PortfolioContent } from "../../templates/_common";

const TSX = `import { content } from "../data";

export default function About() {
  const { headline, paragraphs, sidebar } = content.about;
  const meta = [
    sidebar.basedIn,
    sidebar.focusAreas.join(", ") || null,
    sidebar.currentlyExploring,
  ].filter(Boolean);
  return (
    <section
      id="about"
      className="scout-section scout-about scout-about-single border-t border-rule px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-xl">
        <p className="scout-section-eyebrow eyebrow mb-4">{headline}</p>
        <div className="scout-about-prose flex flex-col gap-5 text-[15px] leading-[1.8] text-ink/85 md:text-base">
          {paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        {meta.length > 0 ? (
          <p className="scout-about-sidebar mt-10 font-mono text-[11px] uppercase tracking-[0.16em] text-stone">
            {meta.join(" · ")}
          </p>
        ) : null}
      </div>
    </section>
  );
}
`;

export const singleBlock: ComponentModule = {
  id: "single-block",
  description:
    "About rendered as a single quiet column of body prose, narrow max-width. Sidebar collapsed into a single mono middot-separated line at the bottom. Best for minimal briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const { paragraphs, sidebar, headline } = content.about;
    const meta = [
      sidebar.basedIn,
      sidebar.focusAreas.length > 0 ? sidebar.focusAreas.join(", ") : null,
      sidebar.currentlyExploring,
    ]
      .filter(Boolean)
      .map((s) => escapeHtml(s as string));

    return `
    <section id="about" class="scout-section scout-about scout-about-single section bordered">
      <div class="container container-narrow">
        <p class="eyebrow scout-section-eyebrow">${escapeHtml(headline)}</p>
        <div class="scout-about-prose single-about-prose">
          ${paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
        </div>
        ${meta.length > 0 ? `<p class="scout-about-sidebar single-about-meta">${meta.join(" &middot; ")}</p>` : ""}
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .container-narrow { max-width: 560px; }
  .scout-about-single .single-about-prose { margin-top: 16px; display: flex; flex-direction: column; gap: 18px; font-size: 15px; line-height: 1.8; color: color-mix(in srgb, var(--color-ink) 85%, transparent); }
  .scout-about-single .single-about-meta {
    margin-top: 32px;
    font-family: var(--font-mono);
    font-size: 11px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
`,
};
