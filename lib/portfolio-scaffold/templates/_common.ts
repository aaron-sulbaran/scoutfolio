// Shared helpers and types used by every component module. Lifted from the
// original templates.ts so each component can stay self-contained and small.

import type { Theme } from "../themes";

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
  theme: Theme;
};

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeJsString(s: string): string {
  return s
    .replace(/\\/g, "\\\\")
    .replace(/`/g, "\\`")
    .replace(/\$\{/g, "\\${");
}

export function ensureProtocol(url: string): string {
  if (/^https?:\/\//.test(url)) return url;
  if (url.startsWith("mailto:")) return url;
  return `https://${url.replace(/^\/+/, "")}`;
}

export function renderTaglineHtml(
  tagline: string,
  emphasis: string[]
): string {
  let html = escapeHtml(tagline);
  emphasis.forEach((phrase) => {
    if (!phrase) return;
    const safe = escapeHtml(phrase);
    html = html
      .split(safe)
      .join(`<em class="scout-emphasis">${safe}</em>`);
  });
  return html;
}

export function linkLabel(href: string): string {
  if (href.startsWith("mailto:")) return href.slice("mailto:".length);
  try {
    const url = new URL(href);
    const path = url.pathname.replace(/^\//, "").replace(/\/$/, "");
    return path ? `${url.host}/${path}` : url.host;
  } catch {
    return href;
  }
}

export function contactLinks(
  c: PortfolioContent["contact"]
): Array<{ label: string; href: string }> {
  const links: Array<{ label: string; href: string }> = [];
  if (c.email) links.push({ label: "Email", href: `mailto:${c.email}` });
  if (c.github) links.push({ label: "GitHub", href: ensureProtocol(c.github) });
  if (c.linkedin)
    links.push({ label: "LinkedIn", href: ensureProtocol(c.linkedin) });
  if (c.website)
    links.push({ label: "Website", href: ensureProtocol(c.website) });
  return links;
}

// ---------------------------------------------------------------------------
// app/data.ts: the only file containing per-user content. Theme drives the
// scaffold's globals.css/layout.tsx and is baked into static files at compose
// time, so data.ts only carries per-user content text.
// ---------------------------------------------------------------------------

export function buildDataModule(content: PortfolioContent): string {
  const { theme: _theme, ...contentWithoutTheme } = content;
  void _theme;

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

export const content: PortfolioContent = ${stringify(contentWithoutTheme)};
`;
}

// ---------------------------------------------------------------------------
// _shared.tsx: TSX primitives every component file imports. Renders the
// tagline emphasis spans and exposes `SectionHeader` for the section
// variants that use the numbered-eyebrow pattern.
// ---------------------------------------------------------------------------

export const SHARED_TSX = `import type { ReactNode } from "react";

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
              className="scout-emphasis font-display italic text-ink"
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
    <header className="scout-section-header mb-14 grid grid-cols-[auto,1fr] gap-x-6 md:gap-x-10">
      <span className="scout-section-numeral section-numeral text-5xl md:text-6xl">{numeral}</span>
      <div className="pt-2">
        <p className="scout-section-eyebrow eyebrow mb-3">{label}</p>
        <h2 className="scout-section-title font-display text-4xl leading-[0.95] tracking-[-0.015em] text-ink sm:text-5xl">
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

export function ensureUrl(input: string): string {
  if (/^https?:\\/\\//.test(input)) return input;
  if (input.startsWith("mailto:")) return input;
  return \`https://\${input.replace(/^\\/+/, "")}\`;
}

export function labelFor(href: string): string {
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

// ---------------------------------------------------------------------------
// Shared preview CSS: tokens, base reset, typography, eyebrow/section
// utilities, hairline rules. Lives outside of any one component so multiple
// section variants can reuse it without duplicating styles.
// ---------------------------------------------------------------------------

import {
  BODY_FONTS,
  DISPLAY_FONTS,
  MONO_FONTS,
  dotColorFor,
  selectionFgFor,
} from "../themes";

export function buildBasePreviewCss(theme: Theme): string {
  const display = DISPLAY_FONTS[theme.fonts.display];
  const body = BODY_FONTS[theme.fonts.body];
  const mono = MONO_FONTS[theme.fonts.mono];
  const dotColor = dotColorFor(theme.mode);
  const selectionFg = selectionFgFor(theme);

  return `
  :root {
    --color-paper: ${theme.colors.paper};
    --color-paper-soft: ${theme.colors.card};
    --color-card: ${theme.colors.card};
    --color-ink: ${theme.colors.ink};
    --color-stone: ${theme.colors.stone};
    --color-rust: ${theme.colors.rust};
    --color-rule: ${theme.colors.rule};
    --font-display: '${display.cssFamily}', 'Iowan Old Style', Georgia, serif;
    --font-body: '${body.cssFamily}', ui-sans-serif, system-ui, -apple-system, sans-serif;
    --font-mono: '${mono.cssFamily}', ui-monospace, 'SF Mono', Menlo, monospace;
  }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { color-scheme: ${theme.mode}; -webkit-font-smoothing: antialiased; text-rendering: optimizeLegibility; }
  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: 16px;
    line-height: 1.5;
    background-image: radial-gradient(${dotColor} 1px, transparent 1px);
    background-size: 3px 3px;
  }
  ::selection { background: var(--color-rust); color: ${selectionFg}; }

  a { color: inherit; text-decoration: none; }

  .scout-page { display: flex; flex-direction: column; }
  .container { max-width: 720px; margin: 0 auto; padding: 0 24px; }

  .eyebrow, .scout-section-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .eyebrow .accent { color: var(--color-rust); }
  .eyebrow .sep { margin: 0 8px; color: var(--color-rule); }

  .scout-emphasis { font-style: italic; color: var(--color-ink); }

  .section-numeral, .scout-section-numeral {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--color-rust);
    font-weight: 300;
    line-height: 1;
    font-size: 56px;
  }

  .hairline, .scout-rule { height: 1px; background: var(--color-rule); width: 100%; }
  .rule-rust { height: 2px; background: var(--color-rust); width: 48px; }

  .scout-section { padding: 80px 24px; }
  .scout-section.bordered { border-top: 1px solid var(--color-rule); }
  .scout-section-header {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 24px;
    margin-bottom: 56px;
  }
  .scout-section-title {
    font-family: var(--font-display);
    font-weight: 400;
    font-size: 36px;
    line-height: 0.95;
    letter-spacing: -0.015em;
    color: var(--color-ink);
    margin-top: 8px;
  }
  .scout-section-title .em {
    font-style: italic;
    color: var(--color-rust);
  }
  .scout-section-header .label { margin-top: 12px; margin-bottom: 12px; }

  @media (min-width: 768px) {
    .scout-section { padding: 112px 24px; }
    .scout-section-header { gap: 40px; }
    .scout-section-title { font-size: 44px; }
    .scout-section-numeral { font-size: 64px; }
  }

  .scout-pre {
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.7;
    background: color-mix(in srgb, var(--color-ink) 6%, var(--color-paper));
    color: var(--color-ink);
    padding: 24px 28px;
    border-radius: 4px;
    border: 1px solid var(--color-rule);
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
  }
  .scout-pre .scout-comment { color: var(--color-stone); font-style: italic; }
  .scout-pre .scout-keyword { color: var(--color-rust); }
  .scout-pre .scout-string { color: color-mix(in srgb, var(--color-rust) 80%, var(--color-ink)); }
`;
}
