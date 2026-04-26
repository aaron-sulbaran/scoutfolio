// Placeholder for v0-generated "How it works" page.
// Paste the v0 component output here, replacing this entire file.

import Link from "next/link";
import { ScoutMark } from "@/components/scout-mark";

export const metadata = {
  title: "How ScoutFolio works",
};

export default function HowItWorksPage() {
  return (
    <main className="min-h-dvh px-6 py-24">
      <div className="mx-auto max-w-2xl text-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground"
        >
          <ScoutMark className="size-4 text-accent" />
          <span className="font-serif text-xl">ScoutFolio</span>
        </Link>
        <p className="eyebrow mt-12">How it works · placeholder</p>
        <h1 className="mt-3 font-serif text-4xl tracking-[-0.02em] text-foreground sm:text-5xl">
          Paste your v0-generated content here.
        </h1>
        <p className="mt-6 text-muted">
          Replace{" "}
          <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-xs">
            app/how-it-works/page.tsx
          </code>{" "}
          with v0 output. Default-export a React component named{" "}
          <code className="rounded bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-xs">
            HowItWorksPage
          </code>
          .
        </p>
      </div>
    </main>
  );
}
