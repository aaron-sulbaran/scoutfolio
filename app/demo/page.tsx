import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { signInWithGoogle } from "@/app/actions";
import { DemoVideo } from "@/components/demo/demo-video";

export const metadata = {
  title: "Demo · ScoutFolio",
  description:
    "A self-contained walkthrough of ScoutFolio, built for Vercel's Zero to Agent hackathon. No sign-in required.",
};

export default function DemoPage() {
  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="marketing" />

        <main className="flex-1">
          <Hero />
          <VideoSection />
          <Explainer />
          <FullExperienceCTA />
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="px-6 pb-12 pt-16 md:pb-16 md:pt-24">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow reveal" style={{ animationDelay: "0.05s" }}>
          Hackathon demo
        </p>
        <h1
          className="reveal mt-5 font-serif text-[2.5rem] leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.75rem]"
          style={{ animationDelay: "0.15s" }}
        >
          ScoutFolio, <span className="italic">on rails.</span>
        </h1>
        <p
          className="reveal mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg"
          style={{ animationDelay: "0.3s" }}
        >
          This page is a self-aware demo built for Vercel&rsquo;s{" "}
          <em>Zero to Agent</em> hackathon. No sign-in, no Google account, no
          uploads. Watch the agent work end to end, then read how each piece is
          wired together.
        </p>
        <div
          className="reveal mt-8 flex flex-wrap items-center gap-x-5 gap-y-3"
          style={{ animationDelay: "0.45s" }}
        >
          <a
            href="#walkthrough"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] transition-all hover:opacity-90 active:translate-y-[0.5px]"
          >
            <Play className="size-3.5" />
            Watch the walkthrough
          </a>
          <Link
            href="/"
            className="group inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-accent"
          >
            Back to landing
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function VideoSection() {
  return (
    <section
      id="walkthrough"
      className="border-t border-border px-6 py-16 md:py-24"
    >
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-y-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">The walkthrough</p>
            <h2 className="font-serif text-3xl tracking-[-0.02em] text-foreground sm:text-4xl">
              See the agent <span className="italic">work.</span>
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted md:text-right">
            From a blank profile to a deployable site. Captured from a real run
            of the build.
          </p>
        </div>

        <div className="mt-10">
          <DemoVideo />
        </div>
      </div>
    </section>
  );
}

function Explainer() {
  const sections = [
    {
      num: "01",
      title: "Connect",
      body: "Students drop in their resume PDF, paste any personal URL, and (in the full build) link a GitHub account. The resume goes to Vercel Blob in a private store; the URL gets fetched and parsed server-side.",
      stack: ["Vercel Blob", "NextAuth (Google)", "Server Actions"],
    },
    {
      num: "02",
      title: "Extract",
      body: "A streaming agent reads each source. The PDF is handed to Claude Haiku 4.5 as a native file part with vision, so layout, sections, and even hand-styled headings come through. URLs are flattened to clean text. Each finding is streamed back as NDJSON so the user sees the agent narrate as it works.",
      stack: ["AI SDK v6", "Claude Haiku 4.5", "NDJSON streaming"],
    },
    {
      num: "03",
      title: "Discover",
      body: "Findings get synthesized into a ranked inventory: a recruiter-facing headline, scored items with concrete actions, and suggested next projects to fill gaps. Reviewer-editable Feature/Include/Skip toggles let the user steer the final cut.",
      stack: ["generateObject", "Zod schemas", "Anthropic structured output"],
    },
    {
      num: "04",
      title: "Generate",
      body: "Approved inventory feeds the portfolio agent. Claude Sonnet 4.6 fills four React components against a committed scaffold. Each TSX file is validated for default exports, allowlisted imports, and tone. Output renders in a Claude-artifact-style preview with a code view and a one-click zip export.",
      stack: ["Claude Sonnet 4.6", "Tailwind 4", "JSZip"],
    },
  ];

  return (
    <section className="border-t border-border px-6 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-3">Under the hood</p>
        <h2 className="font-serif text-3xl tracking-[-0.02em] text-foreground sm:text-4xl">
          How it&rsquo;s <span className="italic">built.</span>
        </h2>
        <p className="mt-5 max-w-2xl text-base leading-relaxed text-muted">
          Four agent stages, each streaming, each visibly working. The whole
          pipeline runs on Vercel: Functions for the routes, Blob for resume
          storage, Upstash Redis for rate limiting, and Supabase Postgres for
          persistent profile state.
        </p>

        <div className="mt-14 flex flex-col gap-16 md:gap-20">
          {sections.map((s) => (
            <div
              key={s.num}
              className="grid grid-cols-[auto,1fr] gap-x-6 gap-y-3 md:gap-x-8"
            >
              <span className="font-serif text-3xl italic text-accent/60 md:text-4xl">
                {s.num}
              </span>
              <div>
                <h3 className="font-serif text-2xl text-foreground md:text-[1.75rem]">
                  {s.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted md:text-base md:leading-relaxed">
                  {s.body}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {s.stack.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-border bg-card px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FullExperienceCTA() {
  return (
    <section className="border-t border-border px-6 py-24 md:py-28">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow mb-5">Want to try it for real?</p>
        <h2 className="font-serif text-4xl leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl">
          For the full experience, <span className="italic">sign in.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base text-muted">
          Use a Google account to connect your own sources, watch the agent run
          on your real work, and export a portfolio you can deploy today.
        </p>
        <div className="mt-10 flex justify-center">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] transition-all hover:opacity-90 active:translate-y-[0.5px]"
            >
              Get started with Google
              <ArrowRight className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
