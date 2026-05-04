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

const LAYOUT = `import type { Metadata } from "next";
import { Fraunces, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-mono",
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PORTFOLIO_TITLE",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={\`\${fraunces.variable} \${dmSans.variable} \${ibmMono.variable} antialiased\`}
    >
      <body className="min-h-dvh bg-paper text-ink">{children}</body>
    </html>
  );
}
`;

const GLOBALS_CSS = `@import "tailwindcss";

@theme {
  --color-paper: #F2EEE5;
  --color-paper-soft: #ECE7DA;
  --color-card: #EDE7D9;
  --color-ink: #14110E;
  --color-stone: #6E665C;
  --color-rust: #B5462C;
  --color-rust-soft: #C8693F;
  --color-rule: #DCD5C7;

  --font-display: var(--font-fraunces), "Iowan Old Style", Georgia, serif;
  --font-body: var(--font-dm-sans), ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: var(--font-ibm-mono), ui-monospace, "SF Mono", Menlo, monospace;
}

@layer base {
  html { color-scheme: light; }

  body {
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-feature-settings: "ss01", "cv11";
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    background-image:
      radial-gradient(rgba(20, 17, 14, 0.025) 1px, transparent 1px);
    background-size: 3px 3px;
  }

  ::selection {
    background: var(--color-rust);
    color: var(--color-paper);
  }
}

@layer utilities {
  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }

  .section-numeral {
    font-family: var(--font-display);
    font-style: italic;
    color: var(--color-rust);
    font-weight: 300;
    line-height: 1;
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

  .hairline {
    height: 1px;
    background: var(--color-rule);
    width: 100%;
  }

  .rule-rust {
    height: 2px;
    background: var(--color-rust);
    width: 3rem;
  }
}
`;

const README = `# PROJECT_NAME

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

The components in \`app/components/\` (\`hero.tsx\`, \`work.tsx\`, \`about.tsx\`, \`contact.tsx\`) read from \`data.ts\` through \`app/page.tsx\`. Layout, palette, and typography live in \`app/globals.css\` and \`app/layout.tsx\`.

## Design tokens

Defined in \`app/globals.css\` under \`@theme\`:

\`\`\`css
--color-paper:  #F2EEE5  /* page background, bone */
--color-ink:    #14110E  /* primary text, warm ink */
--color-stone:  #6E665C  /* secondary text */
--color-rust:   #B5462C  /* accent: section numerals, rules, links */
--color-card:   #EDE7D9  /* secondary surfaces */
--color-rule:   #DCD5C7  /* hairline borders */
\`\`\`

Change a variable, every utility class follows.

## Typography

Three fonts via \`next/font/google\`:

- Fraunces (display serif, italic for emphasis)
- DM Sans (body)
- IBM Plex Mono (eyebrow labels and metadata)

Swap them in \`app/layout.tsx\` if you prefer something else.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4 (CSS-first config, no \`tailwind.config.ts\`)
- TypeScript (strict)

That is it. No runtime dependencies beyond the framework.
`;

const STATIC_FILES: ScaffoldFile[] = [
  { path: "package.json", content: PACKAGE_JSON },
  { path: "tsconfig.json", content: TSCONFIG },
  { path: "next.config.ts", content: NEXT_CONFIG },
  { path: "postcss.config.js", content: POSTCSS_CONFIG },
  { path: ".gitignore", content: GITIGNORE },
  { path: "app/layout.tsx", content: LAYOUT },
  { path: "app/globals.css", content: GLOBALS_CSS },
  { path: "README.md", content: README },
];

export function buildScaffold(opts: {
  projectName: string;
  title: string;
}): ScaffoldFile[] {
  return STATIC_FILES.map(({ path, content }) => ({
    path,
    content: content
      .replace(/PROJECT_NAME/g, opts.projectName)
      .replace(/PORTFOLIO_TITLE/g, opts.title),
  }));
}

export const SCAFFOLD_GLOBALS_CSS = GLOBALS_CSS;
