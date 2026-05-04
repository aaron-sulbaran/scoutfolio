import type { ComponentModule } from "../types";
import { escapeHtml, type PortfolioContent } from "../../templates/_common";

const TSX = `import { content } from "../data";
import { SectionHeader } from "./_shared";

export default function About() {
  const { headline, paragraphs, sidebar } = content.about;
  return (
    <section id="about" className="scout-section scout-about border-t border-rule px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          numeral="§02"
          label="About"
          title=""
          emphasized={headline}
        />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.6fr,1fr] md:gap-16">
          <div className="scout-about-prose flex flex-col gap-5 text-[15px] leading-[1.75] text-ink/85 md:text-base md:leading-[1.8]">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "drop-cap" : undefined}>
                {p}
              </p>
            ))}
          </div>

          <aside className="scout-about-sidebar border-l-2 border-rust pl-6 md:pl-8">
            <dl className="flex flex-col gap-7">
              {sidebar.basedIn ? (
                <div>
                  <dt className="eyebrow mb-2">Based in</dt>
                  <dd className="font-display text-xl text-ink">
                    {sidebar.basedIn}
                  </dd>
                </div>
              ) : null}
              {sidebar.focusAreas.length > 0 ? (
                <div>
                  <dt className="eyebrow mb-2">Focus</dt>
                  <dd>
                    <ul className="flex flex-col gap-1">
                      {sidebar.focusAreas.map((f) => (
                        <li
                          key={f}
                          className="font-display text-lg italic text-ink/90"
                        >
                          {f}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              ) : null}
              {sidebar.currentlyExploring ? (
                <div>
                  <dt className="eyebrow mb-2">Currently</dt>
                  <dd className="text-sm leading-[1.65] text-ink/90">
                    {sidebar.currentlyExploring}
                  </dd>
                </div>
              ) : null}
            </dl>
          </aside>
        </div>
      </div>
    </section>
  );
}
`;

export const dropCap: ComponentModule = {
  id: "drop-cap",
  description:
    "First-paragraph drop cap, two-column grid with prose left and a tight sidebar (Based in / Focus / Currently) right (Studio Monograph default).",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const sidebarHtml: string[] = [];
    if (content.about.sidebar.basedIn) {
      sidebarHtml.push(`
      <div>
        <dt class="eyebrow">Based in</dt>
        <dd class="value-display">${escapeHtml(content.about.sidebar.basedIn)}</dd>
      </div>
    `);
    }
    if (content.about.sidebar.focusAreas.length > 0) {
      sidebarHtml.push(`
      <div>
        <dt class="eyebrow">Focus</dt>
        <dd>
          <ul>
            ${content.about.sidebar.focusAreas.map((f) => `<li>${escapeHtml(f)}</li>`).join("")}
          </ul>
        </dd>
      </div>
    `);
    }
    if (content.about.sidebar.currentlyExploring) {
      sidebarHtml.push(`
      <div>
        <dt class="eyebrow">Currently</dt>
        <dd class="value-text">${escapeHtml(content.about.sidebar.currentlyExploring)}</dd>
      </div>
    `);
    }

    return `
    <section id="about" class="scout-section scout-about section bordered">
      <div class="container">
        <div class="scout-section-header section-header">
          <span class="scout-section-numeral section-numeral">&sect;02</span>
          <div>
            <p class="eyebrow scout-section-eyebrow label">About</p>
            <h2 class="scout-section-title"><span class="em">${escapeHtml(content.about.headline)}</span></h2>
          </div>
        </div>
        <div class="about-grid">
          <div class="scout-about-prose about-prose">
            ${content.about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
          </div>
          <aside class="scout-about-sidebar about-sidebar">
            <dl>${sidebarHtml.join("")}</dl>
          </aside>
        </div>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .about-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .scout-about-prose.about-prose { display: flex; flex-direction: column; gap: 20px; font-size: 15px; line-height: 1.75; color: color-mix(in srgb, var(--color-ink) 85%, transparent); }
  .scout-about-prose.about-prose p:first-child::first-letter {
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
  .scout-about-sidebar.about-sidebar {
    border-left: 2px solid var(--color-rust);
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .scout-about-sidebar dt { margin-bottom: 8px; }
  .scout-about-sidebar dd.value-display {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--color-ink);
  }
  .scout-about-sidebar ul { list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .scout-about-sidebar li {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: color-mix(in srgb, var(--color-ink) 90%, transparent);
  }
  .scout-about-sidebar dd.value-text { font-size: 14px; line-height: 1.65; color: color-mix(in srgb, var(--color-ink) 90%, transparent); }
  @media (min-width: 768px) {
    .about-grid { grid-template-columns: 1.6fr 1fr; gap: 64px; }
    .scout-about-prose.about-prose { font-size: 16px; line-height: 1.8; }
    .scout-about-sidebar.about-sidebar { padding-left: 32px; }
  }
`,
};
