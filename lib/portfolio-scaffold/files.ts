import {
  BODY_FONTS,
  DISPLAY_FONTS,
  MONO_FONTS,
  dotColorFor,
  selectionFgFor,
  type Theme,
} from "./themes";

export type ScaffoldFile = { path: string; content: string };

const PACKAGE_JSON = `{
  "name": "PROJECT_NAME",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start"
  },
  "dependencies": {
    "next": "16.2.4",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4",
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "tailwindcss": "^4",
    "typescript": "^5"
  }
}
`;

const TSCONFIG = `{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
`;

const NEXT_CONFIG = `import type { NextConfig } from "next";

const nextConfig: NextConfig = {};

export default nextConfig;
`;

const POSTCSS_CONFIG = `module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
`;

const GITIGNORE = `# deps
node_modules
.pnpm-store

# next
.next
out

# env
.env*.local

# misc
.DS_Store
*.pem
.vercel
*.tsbuildinfo
next-env.d.ts
`;

function buildLayout(theme: Theme, title: string): string {
  const display = DISPLAY_FONTS[theme.fonts.display];
  const body = BODY_FONTS[theme.fonts.body];
  const mono = MONO_FONTS[theme.fonts.mono];

  return `import type { Metadata } from "next";
import { ${display.importName}, ${body.importName}, ${mono.importName} } from "next/font/google";
import "./globals.css";

const displayFont = ${display.importName}(${display.nextFontConfig});
const bodyFont = ${body.importName}(${body.nextFontConfig});
const monoFont = ${mono.importName}(${mono.nextFontConfig});

export const metadata: Metadata = {
  title: ${JSON.stringify(title)},
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={\`\${displayFont.variable} \${bodyFont.variable} \${monoFont.variable} antialiased\`}
    >
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}
`;
}

function buildGlobalsCss(theme: Theme): string {
  const display = DISPLAY_FONTS[theme.fonts.display];
  const body = BODY_FONTS[theme.fonts.body];
  const mono = MONO_FONTS[theme.fonts.mono];
  const dotColor = dotColorFor(theme.mode);
  const selectionFg = selectionFgFor(theme);
  const customCss = theme.customCss ? `\n${theme.customCss}\n` : "";

  return `@import "tailwindcss";

@theme {
  --color-paper: ${theme.colors.paper};
  --color-paper-soft: ${theme.colors.card};
  --color-card: ${theme.colors.card};
  --color-ink: ${theme.colors.ink};
  --color-stone: ${theme.colors.stone};
  --color-rust: ${theme.colors.rust};
  --color-rule: ${theme.colors.rule};

  --font-display: var(${display.cssVar}), "Iowan Old Style", Georgia, serif;
  --font-body: var(${body.cssVar}), ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: var(${mono.cssVar}), ui-monospace, "SF Mono", Menlo, monospace;
}

@layer base {
  html { color-scheme: ${theme.mode}; }

  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    background-image:
      radial-gradient(${dotColor} 1px, transparent 1px);
    background-size: 3px 3px;
  }

  ::selection {
    background: var(--color-rust);
    color: ${selectionFg};
  }
}

@layer utilities {
  .eyebrow,
  .scout-section-eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }

  .section-numeral,
  .scout-section-numeral {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--color-rust);
    font-weight: 300;
    line-height: 1;
  }

  .scout-emphasis {
    font-style: italic;
    color: var(--color-ink);
  }

  .drop-cap::first-letter {
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

  .hairline,
  .scout-rule {
    height: 1px;
    background: var(--color-rule);
    width: 100%;
  }

  .rule-rust {
    height: 2px;
    background: var(--color-rust);
    width: 3rem;
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
}
${customCss}`;
}

function buildReadme(theme: Theme): string {
  return `# PROJECT_NAME

A personal portfolio site, generated for you by ScoutFolio. Deploy as-is, or treat it as a starter and edit the components to taste.

## Run it locally

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open http://localhost:3000 to see your portfolio. Hot reload is on, so edit any component and the page updates live.

## Deploy to Vercel

\`\`\`bash
pnpm dlx vercel
\`\`\`

Follow the prompts. No environment variables required, no databases to wire up. The whole site is static React Server Components.

## Where to edit content

The agent put your content in one place: \`app/data.ts\`. Edit any field there and the site updates. The structure is:

- \`name\`, \`primaryRole\`, \`location\` — the hero line
- \`tagline\` plus \`taglineEmphasis\` — words to italicize get listed in \`taglineEmphasis\`
- \`intro\` — the short paragraph under your name
- \`projects[]\` — your work ledger, with \`title\`, \`role\`, \`year\`, \`summary\`, \`stack\`, \`outcome\`, \`link\`, \`featured\`
- \`about\` — \`headline\`, \`paragraphs[]\`, and a \`sidebar\` with \`basedIn\`, \`focusAreas[]\`, \`currentlyExploring\`
- \`contact\` — your closing line and any of \`email\`, \`github\`, \`linkedin\`, \`website\`

The components in \`app/components/\` (\`hero.tsx\`, \`work.tsx\`, \`about.tsx\`, \`contact.tsx\`) read from \`data.ts\` through \`app/page.tsx\`.

## Design tokens (this theme)

This portfolio shipped in **${theme.mode} mode**. Tokens are defined in \`app/globals.css\` under \`@theme\`:

\`\`\`css
--color-paper:  ${theme.colors.paper}  /* page background */
--color-ink:    ${theme.colors.ink}    /* primary text */
--color-stone:  ${theme.colors.stone}  /* secondary text */
--color-rust:   ${theme.colors.rust}   /* accent: section numerals, links, rules */
--color-card:   ${theme.colors.card}   /* secondary surfaces */
--color-rule:   ${theme.colors.rule}   /* hairline borders */
\`\`\`

Change a hex value, every utility class follows.

## Typography

Three fonts via \`next/font/google\`:

- ${DISPLAY_FONTS[theme.fonts.display].cssFamily} (display)
- ${BODY_FONTS[theme.fonts.body].cssFamily} (body)
- ${MONO_FONTS[theme.fonts.mono].cssFamily} (eyebrows and metadata)

Swap them in \`app/layout.tsx\` if you prefer something else.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4 (CSS-first config, no \`tailwind.config.ts\`)
- TypeScript (strict)

That is it. No runtime dependencies beyond the framework.
`;
}

const STATIC_FILES_BASE: Array<{ path: string; content: string }> = [
  { path: "package.json", content: PACKAGE_JSON },
  { path: "tsconfig.json", content: TSCONFIG },
  { path: "next.config.ts", content: NEXT_CONFIG },
  { path: "postcss.config.js", content: POSTCSS_CONFIG },
  { path: ".gitignore", content: GITIGNORE },
];

export function buildScaffold(opts: {
  projectName: string;
  title: string;
  theme: Theme;
}): ScaffoldFile[] {
  const dynamicFiles: ScaffoldFile[] = [
    { path: "app/layout.tsx", content: buildLayout(opts.theme, opts.title) },
    { path: "app/globals.css", content: buildGlobalsCss(opts.theme) },
    { path: "README.md", content: buildReadme(opts.theme) },
  ];
  return [
    ...STATIC_FILES_BASE.map(({ path, content }) => ({
      path,
      content: content.replace(/PROJECT_NAME/g, opts.projectName),
    })),
    ...dynamicFiles.map(({ path, content }) => ({
      path,
      content: content.replace(/PROJECT_NAME/g, opts.projectName),
    })),
  ];
}
