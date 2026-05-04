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
import { Instrument_Sans, Instrument_Serif } from "next/font/google";
import "./globals.css";

const instrumentSans = Instrument_Sans({
  subsets: ["latin"],
  variable: "--font-instrument-sans",
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-instrument-serif",
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
      className={\`\${instrumentSans.variable} \${instrumentSerif.variable} antialiased\`}
    >
      <body className="min-h-dvh bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
`;

const GLOBALS_CSS = `@import "tailwindcss";

@theme {
  --color-background: #FAF8F5;
  --color-foreground: #1A1A1A;
  --color-muted: #6B5E70;
  --color-accent: #3D2D4F;
  --color-accent-foreground: #FAF8F5;
  --color-border: #EAE6E0;
  --color-card: #FDFBF8;

  --font-sans: var(--font-instrument-sans), system-ui, -apple-system, "Segoe UI", sans-serif;
  --font-serif: var(--font-instrument-serif), "Iowan Old Style", Georgia, serif;
}

@layer base {
  html { color-scheme: light; }

  body {
    background: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-sans);
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  ::selection {
    background: var(--color-accent);
    color: var(--color-accent-foreground);
  }
}
`;

const README = `# PROJECT_NAME

A personal portfolio site, generated for you. Deploy as-is, or treat it as a starter and edit the components to taste.

## Run it locally

\`\`\`bash
pnpm install
pnpm dev
\`\`\`

Open http://localhost:3000 to see your portfolio. Hot reload is on, so edit any component and the page updates live.

## Deploy to Vercel

The fastest path:

\`\`\`bash
pnpm dlx vercel
\`\`\`

Follow the prompts. No environment variables are required, no databases to wire up. The whole site is static React Server Components.

## Where to edit content

Everything that's about you lives in \`app/components/\`:

- \`hero.tsx\` — your name, headline, and primary call-to-action
- \`projects.tsx\` — featured projects, with descriptions
- \`about.tsx\` — your story, in 2 to 3 paragraphs
- \`contact.tsx\` — links to email, GitHub, LinkedIn

The composition lives in \`app/page.tsx\`. Reorder, remove, or duplicate sections there.

## Color tokens

The palette is defined as CSS variables in \`app/globals.css\` under the \`@theme\` block:

\`\`\`css
--color-background: #FAF8F5  /* warm off-white */
--color-foreground: #1A1A1A  /* near-black body text */
--color-muted:      #6B5E70  /* secondary text */
--color-accent:     #3D2D4F  /* deep aubergine, used for emphasis */
--color-card:       #FDFBF8  /* slightly warmer card surface */
--color-border:     #EAE6E0  /* hairline border */
\`\`\`

Change any variable and Tailwind utilities (\`bg-accent\`, \`text-muted\`, \`border-border\`, etc.) update everywhere. No config file to touch.

## Typography

Two fonts via \`next/font/google\`:

- Instrument Sans for body text
- Instrument Serif (italic) for display lines

Swap them in \`app/layout.tsx\` if you prefer something else.

## Stack

- Next.js 16 (App Router)
- React 19
- Tailwind CSS 4 (CSS-first config)
- TypeScript (strict)

That's it. No runtime dependencies beyond the framework.
`;

const RAW_FILES: ScaffoldFile[] = [
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
  return RAW_FILES.map(({ path, content }) => ({
    path,
    content: content
      .replace(/PROJECT_NAME/g, opts.projectName)
      .replace(/PORTFOLIO_TITLE/g, opts.title),
  }));
}

export const SCAFFOLD_CSS = GLOBALS_CSS;
