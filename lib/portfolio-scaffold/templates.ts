import type { ScaffoldFile } from "./files";

// ---------------------------------------------------------------------------
// PortfolioContent: the structured data the agent emits. Both the export TSX
// and the preview HTML are deterministic functions of this shape, so what
// judges see in the iframe is byte-equivalent in layout to what the user
// actually downloads.
// ---------------------------------------------------------------------------

export type PortfolioProject = {
  title: string;
  role: string;
  year?: string;
  summary: string;
  stack: string[];
  outcome?: string;
  link?: string;
  featured: boolean;
};

export type PortfolioContent = {
  name: string;
  primaryRole: string;
  location?: string;
  tagline: string;
  taglineEmphasis: string[];
  intro: string;
  projects: PortfolioProject[];
  about: {
    headline: string;
    paragraphs: string[];
    sidebar: {
      basedIn?: string;
      focusAreas: string[];
      currentlyExploring?: string;
    };
  };
  contact: {
    headline: string;
    closingLine: string;
    email?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
};

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeJsString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

function jsArray(items: string[]): string {
  return `[${items.map((i) => `"${escapeJsString(i)}"`).join(", ")}]`;
}

function ensureProtocol(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("mailto:")) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

// ---------------------------------------------------------------------------
// app/data.ts: the only file containing per-user content.
// ---------------------------------------------------------------------------

export function buildDataModule(content: PortfolioContent): string {
  const stringify = (val: unknown, indent = 0): string => {
    const pad = "  ".repeat(indent);
    if (val === undefined) return "undefined";
    if (val === null) return "null";
    if (typeof val === "string") return `"${escapeJsString(val)}"`;
    if (typeof val === "number" || typeof val === "boolean") return String(val);
    if (Array.isArray(val)) {
      if (val.length === 0) return "[]";
      const items = val.map((v) => `${pad}  ${stringify(v, indent + 1)}`);
      return `[\n${items.join(",\n")},\n${pad}]`;
    }
    if (typeof val === "object") {
      const obj = val as Record<string, unknown>;
      const entries = Object.entries(obj).filter(([, v]) => v !== undefined);
      if (entries.length === 0) return "{}";
      const lines = entries.map(
        ([k, v]) => `${pad}  ${k}: ${stringify(v, indent + 1)}`
      );
      return `{\n${lines.join(",\n")},\n${pad}}`;
    }
    return "undefined";
  };

  return `export type PortfolioProject = {
  title: string;
  role: string;
  year?: string;
  summary: string;
  stack: string[];
  outcome?: string;
  link?: string;
  featured: boolean;
};

export type PortfolioContent = {
  name: string;
  primaryRole: string;
  location?: string;
  tagline: string;
  taglineEmphasis: string[];
  intro: string;
  projects: PortfolioProject[];
  about: {
    headline: string;
    paragraphs: string[];
    sidebar: {
      basedIn?: string;
      focusAreas: string[];
      currentlyExploring?: string;
    };
  };
  contact: {
    headline: string;
    closingLine: string;
    email?: string;
    github?: string;
    linkedin?: string;
    website?: string;
  };
};

export const content: PortfolioContent = ${stringify(content)};
`;
}

// ---------------------------------------------------------------------------
// TSX component sources (committed templates, content-agnostic).
// These are static strings. Per-user content lives only in data.ts.
// ---------------------------------------------------------------------------

const SHARED_TSX = `import type { ReactNode } from "react";

export function renderTagline(
  tagline: string,
  emphasis: string[]
): ReactNode[] {
  let nodes: ReactNode[] = [tagline];
  emphasis.forEach((phrase, idx) => {
    if (!phrase) return;
    nodes = nodes.flatMap((node) => {
      if (typeof node !== "string") return [node];
      const out: ReactNode[] = [];
      const parts = node.split(phrase);
      parts.forEach((part, i) => {
        if (i > 0) {
          out.push(
            <em
              key={\`em-\${idx}-\${i}\`}
              className="font-display italic text-ink"
            >
              {phrase}
            </em>
          );
        }
        if (part) out.push(part);
      });
      return out;
    });
  });
  return nodes;
}

export function SectionHeader({
  numeral,
  label,
  title,
  emphasized,
}: {
  numeral: string;
  label: string;
  title: string;
  emphasized?: string;
}) {
  return (
    <header className="mb-14 grid grid-cols-[auto,1fr] gap-x-6 md:gap-x-10">
      <span className="section-numeral text-5xl md:text-6xl">{numeral}</span>
      <div className="pt-2">
        <p className="eyebrow mb-3">{label}</p>
        <h2 className="font-display text-4xl leading-[0.95] tracking-[-0.015em] text-ink sm:text-5xl">
          {title}
          {emphasized ? (
            <>
              {" "}
              <em className="italic text-rust">{emphasized}</em>
            </>
          ) : null}
        </h2>
      </div>
    </header>
  );
}
`;

const HERO_TSX = `import { content } from "../data";
import { renderTagline } from "./_shared";

export default function Hero() {
  return (
    <section className="relative px-6 pb-24 pt-28 md:pb-32 md:pt-36">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-8">
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

        <h1 className="font-display text-[3rem] leading-[0.92] tracking-[-0.025em] text-ink sm:text-7xl md:text-[5.25rem]">
          {content.name}
        </h1>

        <p className="mt-12 max-w-2xl font-display text-2xl leading-[1.25] text-ink/90 md:text-[1.75rem]">
          {renderTagline(content.tagline, content.taglineEmphasis)}
        </p>

        <p className="drop-cap mt-10 max-w-xl text-base leading-[1.7] text-ink/85 md:text-lg">
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

      <div className="mx-auto mt-28 hairline max-w-3xl" />
    </section>
  );
}
`;

const WORK_TSX = `import { content } from "../data";
import { SectionHeader } from "./_shared";

export default function Work() {
  if (content.projects.length === 0) return null;
  return (
    <section id="work" className="px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          numeral="§01"
          label="Selected work"
          title="What I've"
          emphasized="been making."
        />

        <ol className="flex flex-col">
          {content.projects.map((project, i) => (
            <li
              key={project.title}
              className="grid grid-cols-[auto,1fr] gap-x-6 border-t border-rule py-10 md:gap-x-10 md:py-14"
            >
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-stone">
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
                <h3 className="font-display text-2xl leading-[1.1] tracking-[-0.01em] text-ink md:text-3xl">
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

                <p className="mt-5 max-w-2xl text-[15px] leading-[1.7] text-ink/85">
                  {project.summary}
                </p>

                {project.outcome ? (
                  <p className="mt-4 max-w-2xl border-l-2 border-rust pl-4 text-sm leading-[1.6] text-ink/90">
                    {project.outcome}
                  </p>
                ) : null}

                {project.stack.length > 0 ? (
                  <ul className="mt-6 flex flex-wrap gap-x-1.5 gap-y-1.5">
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

const ABOUT_TSX = `import { content } from "../data";
import { SectionHeader } from "./_shared";

export default function About() {
  const { headline, paragraphs, sidebar } = content.about;
  return (
    <section id="about" className="border-t border-rule px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          numeral="§02"
          label="About"
          title=""
          emphasized={headline}
        />

        <div className="grid grid-cols-1 gap-12 md:grid-cols-[1.6fr,1fr] md:gap-16">
          <div className="flex flex-col gap-5 text-[15px] leading-[1.75] text-ink/85 md:text-base md:leading-[1.8]">
            {paragraphs.map((p, i) => (
              <p key={i} className={i === 0 ? "drop-cap" : undefined}>
                {p}
              </p>
            ))}
          </div>

          <aside className="border-l-2 border-rust pl-6 md:pl-8">
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

const CONTACT_TSX = `import { content } from "../data";
import { SectionHeader } from "./_shared";

export default function Contact() {
  const { headline, closingLine, email, github, linkedin, website } =
    content.contact;
  const links: Array<{ label: string; href: string }> = [];
  if (email) links.push({ label: "Email", href: \`mailto:\${email}\` });
  if (github) links.push({ label: "GitHub", href: ensureUrl(github) });
  if (linkedin) links.push({ label: "LinkedIn", href: ensureUrl(linkedin) });
  if (website) links.push({ label: "Website", href: ensureUrl(website) });

  return (
    <section
      id="contact"
      className="border-t border-rule px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          numeral="§03"
          label="Contact"
          title=""
          emphasized={headline}
        />

        <p className="font-display text-2xl leading-[1.3] text-ink md:text-3xl">
          {closingLine}
        </p>

        <div className="mt-10 rule-rust" />

        <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="group inline-flex items-baseline gap-3 text-ink transition-colors hover:text-rust"
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  l.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone group-hover:text-rust">
                  {l.label}
                </span>
                <span className="font-display text-lg italic">
                  {labelFor(l.href)}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-20 font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
          Built with ScoutFolio &middot; A Vercel Zero to Agent project
        </p>
      </div>
    </section>
  );
}

function ensureUrl(input: string): string {
  if (/^https?:\\/\\//.test(input)) return input;
  return \`https://\${input.replace(/^\\/+/, "")}\`;
}

function labelFor(href: string): string {
  if (href.startsWith("mailto:")) return href.slice("mailto:".length);
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/^\\//, "").replace(/\\/$/, "");
    return path ? \`\${url.host}/\${path}\` : url.host;
  } catch {
    return href;
  }
}
`;

const PAGE_TSX = `import Hero from "./components/hero";
import Work from "./components/work";
import About from "./components/about";
import Contact from "./components/contact";

export default function Home() {
  return (
    <main>
      <Hero />
      <Work />
      <About />
      <Contact />
    </main>
  );
}
`;

export function buildComponentFiles(): ScaffoldFile[] {
  return [
    { path: "app/components/_shared.tsx", content: SHARED_TSX },
    { path: "app/components/hero.tsx", content: HERO_TSX },
    { path: "app/components/work.tsx", content: WORK_TSX },
    { path: "app/components/about.tsx", content: ABOUT_TSX },
    { path: "app/components/contact.tsx", content: CONTACT_TSX },
    { path: "app/page.tsx", content: PAGE_TSX },
  ];
}

// ---------------------------------------------------------------------------
// Preview HTML: a single self-contained HTML document that visually mirrors
// the export. Hand-written CSS, no Tailwind dependency, Google Fonts via CDN.
// ---------------------------------------------------------------------------

function renderTaglineHtml(tagline: string, emphasis: string[]): string {
  let html = escapeHtml(tagline);
  emphasis.forEach((phrase) => {
    if (!phrase) return;
    const safe = escapeHtml(phrase);
    html = html
      .split(safe)
      .join(
        `<em class="emphasis">${safe}</em>`
      );
  });
  return html;
}

function linkLabel(href: string): string {
  if (href.startsWith("mailto:")) return href.slice("mailto:".length);
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/^\//, "").replace(/\/$/, "");
    return path ? `${url.host}/${path}` : url.host;
  } catch {
    return href;
  }
}

const PREVIEW_CSS = `
  :root {
    --color-paper: #F2EEE5;
    --color-paper-soft: #ECE7DA;
    --color-card: #EDE7D9;
    --color-ink: #14110E;
    --color-stone: #6E665C;
    --color-rust: #B5462C;
    --color-rule: #DCD5C7;
    --font-display: 'Fraunces', 'Iowan Old Style', Georgia, serif;
    --font-body: 'DM Sans', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-mono: 'IBM Plex Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { color-scheme: light; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.5;
    background-image: radial-gradient(rgba(20, 17, 14, 0.025) 1px, transparent 1px);
    background-size: 3px 3px;
  }
  ::selection { background: var(--color-rust); color: var(--color-paper); }

  a { color: inherit; text-decoration: none; }

  .container { max-width: 720px; margin: 0 auto; padding: 0 24px; }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .eyebrow .accent { color: var(--color-rust); }
  .eyebrow .sep { margin: 0 8px; color: var(--color-rule); }

  .section-numeral {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--color-rust);
    font-weight: 300;
    line-height: 1;
    font-size: 56px;
  }

  .hairline { height: 1px; background: var(--color-rule); width: 100%; }
  .rule-rust { height: 2px; background: var(--color-rust); width: 48px; }

  /* ---- Hero ---- */
  .hero { padding: 112px 24px 96px; }
  .hero h1 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 56px;
    line-height: 0.92;
    letter-spacing: -0.025em;
    color: var(--color-ink);
    margin-top: 32px;
  }
  .hero .tagline {
    font-family: var(--font-display);
    font-size: 26px;
    line-height: 1.25;
    color: rgba(20, 17, 14, 0.92);
    margin-top: 48px;
    max-width: 640px;
  }
  .hero .tagline .emphasis {
    font-style: italic;
    color: var(--color-ink);
  }
  .hero .intro {
    margin-top: 40px;
    max-width: 560px;
    font-size: 17px;
    line-height: 1.7;
    color: rgba(20, 17, 14, 0.85);
  }
  .hero .intro::first-letter {
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
  .hero .cta {
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
  .hero-rule { max-width: 720px; margin: 112px auto 0; }

  @media (min-width: 768px) {
    .hero { padding: 144px 24px 128px; }
    .hero h1 { font-size: 84px; }
    .hero .tagline { font-size: 28px; }
    .hero .intro { font-size: 18px; }
  }

  /* ---- Section header ---- */
  .section { padding: 80px 24px; }
  .section.bordered { border-top: 1px solid var(--color-rule); }
  .section-header {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    margin-bottom: 56px;
  }
  .section-header h2 {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 36px;
    line-height: 0.95;
    letter-spacing: -0.015em;
    color: var(--color-ink);
    margin-top: 8px;
  }
  .section-header h2 .em {
    font-style: italic;
    color: var(--color-rust);
  }
  .section-header .label { margin-top: 12px; margin-bottom: 12px; }

  @media (min-width: 768px) {
    .section { padding: 112px 24px; }
    .section-header { gap: 40px; }
    .section-header h2 { font-size: 44px; }
    .section-numeral { font-size: 64px; }
  }

  /* ---- Work ---- */
  .work-list { display: flex; flex-direction: column; }
  .work-item {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    padding: 40px 0;
    border-top: 1px solid var(--color-rule);
  }
  .work-meta {
    font-family: var(--font-mono);
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--color-stone);
  }
  .work-meta .num { color: var(--color-rust); }
  .work-meta .year { margin-top: 8px; }
  .work-meta .featured {
    margin-top: 8px;
    display: inline-block;
    border: 1px solid var(--color-rust);
    color: var(--color-rust);
    padding: 2px 6px;
    font-size: 9px;
    letter-spacing: 0.2em;
  }
  .work-title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 26px;
    line-height: 1.1;
    letter-spacing: -0.01em;
    color: var(--color-ink);
  }
  .work-title a {
    text-decoration: underline;
    text-decoration-color: rgba(181, 70, 44, 0.4);
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
  .work-summary {
    margin-top: 20px;
    max-width: 640px;
    font-size: 15px;
    line-height: 1.7;
    color: rgba(20, 17, 14, 0.85);
  }
  .work-outcome {
    margin-top: 16px;
    max-width: 640px;
    border-left: 2px solid var(--color-rust);
    padding-left: 16px;
    font-size: 14px;
    line-height: 1.6;
    color: rgba(20, 17, 14, 0.92);
  }
  .work-stack { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 6px; }
  .work-stack li {
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
    .work-item { gap: 40px; padding: 56px 0; }
    .work-title { font-size: 30px; }
  }

  /* ---- About ---- */
  .about-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 48px;
  }
  .about-prose { display: flex; flex-direction: column; gap: 20px; font-size: 15px; line-height: 1.75; color: rgba(20, 17, 14, 0.85); }
  .about-prose p:first-child::first-letter {
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
  .about-sidebar {
    border-left: 2px solid var(--color-rust);
    padding-left: 24px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }
  .about-sidebar dt { margin-bottom: 8px; }
  .about-sidebar dd.value-display {
    font-family: var(--font-display);
    font-size: 22px;
    color: var(--color-ink);
  }
  .about-sidebar ul { list-style: none; display: flex; flex-direction: column; gap: 4px; }
  .about-sidebar li {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
    color: rgba(20, 17, 14, 0.9);
  }
  .about-sidebar dd.value-text { font-size: 14px; line-height: 1.65; color: rgba(20, 17, 14, 0.9); }

  @media (min-width: 768px) {
    .about-grid { grid-template-columns: 1.6fr 1fr; gap: 64px; }
    .about-prose { font-size: 16px; line-height: 1.8; }
    .about-sidebar { padding-left: 32px; }
  }

  /* ---- Contact ---- */
  .contact-line {
    font-family: var(--font-display);
    font-size: 26px;
    line-height: 1.3;
    color: var(--color-ink);
  }
  .contact-list { list-style: none; margin-top: 40px; display: flex; flex-wrap: wrap; gap: 16px 40px; }
  .contact-list a {
    display: inline-flex;
    align-items: baseline;
    gap: 12px;
    color: var(--color-ink);
    transition: color 0.2s ease;
  }
  .contact-list a:hover { color: var(--color-rust); }
  .contact-list .key {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .contact-list .value {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
  }
  .contact-rule { margin-top: 40px; }
  .contact-footer {
    margin-top: 80px;
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-stone);
  }

  @media (min-width: 768px) {
    .contact-line { font-size: 32px; }
  }
`;

export function buildPreviewHtml(content: PortfolioContent): string {
  const links: Array<{ label: string; href: string }> = [];
  if (content.contact.email)
    links.push({ label: "Email", href: `mailto:${content.contact.email}` });
  if (content.contact.github)
    links.push({
      label: "GitHub",
      href: ensureProtocol(content.contact.github),
    });
  if (content.contact.linkedin)
    links.push({
      label: "LinkedIn",
      href: ensureProtocol(content.contact.linkedin),
    });
  if (content.contact.website)
    links.push({
      label: "Website",
      href: ensureProtocol(content.contact.website),
    });

  const heroEyebrow = [
    `<span class="accent">&sect; 00</span>`,
    `<span class="sep">/</span>`,
    escapeHtml(content.primaryRole),
    content.location
      ? `<span class="sep">/</span>${escapeHtml(content.location)}`
      : "",
  ]
    .filter(Boolean)
    .join("");

  const hero = `
    <section class="hero">
      <div class="container">
        <p class="eyebrow">${heroEyebrow}</p>
        <h1>${escapeHtml(content.name)}</h1>
        <p class="tagline">${renderTaglineHtml(content.tagline, content.taglineEmphasis)}</p>
        <p class="intro">${escapeHtml(content.intro)}</p>
        <a href="#contact" class="cta">Get in touch &rarr;</a>
      </div>
      <div class="container hero-rule"><div class="hairline"></div></div>
    </section>
  `;

  const workItems = content.projects
    .map((p, i) => {
      const num = String(i + 1).padStart(2, "0");
      const titleNode = p.link
        ? `<a href="${escapeHtml(ensureProtocol(p.link))}" target="_blank" rel="noopener noreferrer">${escapeHtml(p.title)}</a>`
        : escapeHtml(p.title);
      const stack =
        p.stack.length > 0
          ? `<ul class="work-stack">${p.stack.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}</ul>`
          : "";
      const outcome = p.outcome
        ? `<p class="work-outcome">${escapeHtml(p.outcome)}</p>`
        : "";
      const year = p.year
        ? `<div class="year">${escapeHtml(p.year)}</div>`
        : "";
      const featured = p.featured ? `<div class="featured">Featured</div>` : "";
      return `
      <li class="work-item">
        <div class="work-meta">
          <div class="num">${num}</div>
          ${year}
          ${featured}
        </div>
        <div>
          <h3 class="work-title">${titleNode}</h3>
          <p class="work-role">${escapeHtml(p.role)}</p>
          <p class="work-summary">${escapeHtml(p.summary)}</p>
          ${outcome}
          ${stack}
        </div>
      </li>`;
    })
    .join("");

  const work =
    content.projects.length > 0
      ? `
    <section id="work" class="section">
      <div class="container">
        <div class="section-header">
          <span class="section-numeral">&sect;01</span>
          <div>
            <p class="eyebrow label">Selected work</p>
            <h2>What I've <span class="em">been making.</span></h2>
          </div>
        </div>
        <ol class="work-list" style="list-style:none;">${workItems}</ol>
      </div>
    </section>
  `
      : "";

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

  const about = `
    <section id="about" class="section bordered">
      <div class="container">
        <div class="section-header">
          <span class="section-numeral">&sect;02</span>
          <div>
            <p class="eyebrow label">About</p>
            <h2><span class="em">${escapeHtml(content.about.headline)}</span></h2>
          </div>
        </div>
        <div class="about-grid">
          <div class="about-prose">
            ${content.about.paragraphs.map((p) => `<p>${escapeHtml(p)}</p>`).join("")}
          </div>
          <aside class="about-sidebar">
            <dl>${sidebarHtml.join("")}</dl>
          </aside>
        </div>
      </div>
    </section>
  `;

  const contactLinks = links
    .map((l) => {
      const isMail = l.href.startsWith("mailto:");
      return `
      <li>
        <a href="${escapeHtml(l.href)}"${isMail ? "" : ` target="_blank" rel="noopener noreferrer"`}>
          <span class="key">${escapeHtml(l.label)}</span>
          <span class="value">${escapeHtml(linkLabel(l.href))}</span>
        </a>
      </li>`;
    })
    .join("");

  const contact = `
    <section id="contact" class="section bordered">
      <div class="container">
        <div class="section-header">
          <span class="section-numeral">&sect;03</span>
          <div>
            <p class="eyebrow label">Contact</p>
            <h2><span class="em">${escapeHtml(content.contact.headline)}</span></h2>
          </div>
        </div>
        <p class="contact-line">${escapeHtml(content.contact.closingLine)}</p>
        <div class="rule-rust contact-rule"></div>
        <ul class="contact-list">${contactLinks}</ul>
        <p class="contact-footer">Built with ScoutFolio &middot; A Vercel Zero to Agent project</p>
      </div>
    </section>
  `;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(content.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700&family=DM+Sans:wght@400;500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet" />
<style>${PREVIEW_CSS}</style>
</head>
<body>
${hero}
${work}
${about}
${contact}
</body>
</html>`;
}
