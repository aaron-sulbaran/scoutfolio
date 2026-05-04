import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { MayaCard } from "@/components/portfolio-examples/maya-card";
import { JordanCard } from "@/components/portfolio-examples/jordan-card";
import { RiyaCard } from "@/components/portfolio-examples/riya-card";
import { signInWithGoogle } from "@/app/actions";

export default function Home() {
  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="marketing" />

        <main className="flex-1">
          <Hero />
          <HowItWorks />
          <Examples />
          <ClosingCTA />
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

function Hero() {
  return (
    <section className="relative px-6 pb-28 pt-20 md:pb-36 md:pt-28 lg:pb-44 lg:pt-32">
      <div className="mx-auto grid max-w-6xl grid-cols-1 gap-y-14 lg:grid-cols-12 lg:gap-x-12">
        <div className="lg:col-span-8">
          <p
            className="eyebrow reveal"
            style={{ animationDelay: "0.05s" }}
          >
            For students who build
          </p>
          <h1
            className="reveal mt-5 font-serif text-[2.75rem] leading-[0.95] tracking-[-0.02em] text-foreground sm:text-6xl md:text-7xl lg:text-[5.5rem]"
            style={{ animationDelay: "0.15s" }}
          >
            Your portfolio is hiding in{" "}
            <span className="italic">plain&nbsp;sight.</span>
          </h1>
          <p
            className="reveal mt-7 max-w-xl text-base leading-relaxed text-muted sm:text-lg md:text-xl md:leading-relaxed"
            style={{ animationDelay: "0.3s" }}
          >
            ScoutFolio is an agent that finds your best work across GitHub,
            your resume, and the web. It writes it for recruiters and ships
            you a site you&rsquo;d actually share.
          </p>
          <div
            className="reveal mt-10 flex flex-wrap items-center gap-x-6 gap-y-4"
            style={{ animationDelay: "0.45s" }}
          >
            <form action={signInWithGoogle}>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] transition-all hover:opacity-90 active:translate-y-[0.5px]"
              >
                Build mine
                <ArrowRight className="size-3.5" />
              </button>
            </form>
            <a
              href="#examples"
              className="group inline-flex items-center gap-1.5 text-sm text-foreground transition-colors hover:text-accent"
            >
              See examples
              <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
          <p
            className="reveal mt-12 text-xs text-muted"
            style={{ animationDelay: "0.6s" }}
          >
            <span className="mr-1.5 text-accent">&dagger;</span>
            Free during beta. No credit card.
          </p>
        </div>

        <aside
          className="reveal lg:col-span-4 lg:pt-32"
          style={{ animationDelay: "0.55s" }}
        >
          <div className="border-l-2 border-accent pl-5">
            <p className="font-serif text-[1.65rem] italic leading-snug text-foreground">
              &ldquo;Most students forget half of what they&rsquo;ve done.&rdquo;
            </p>
            <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Problem we set out to fix
            </p>
          </div>

          <div className="mt-10 hidden grid-cols-2 gap-4 lg:grid">
            <Stat label="Sources read" value="GitHub · Resume · URLs" />
            <Stat label="Time to ship" value="~5 min" />
          </div>
        </aside>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </p>
      <p className="mt-1.5 text-sm text-foreground">{value}</p>
    </div>
  );
}

function HowItWorks() {
  const steps = [
    { num: "01", title: "Connect", desc: "Link your sources" },
    { num: "02", title: "Discover", desc: "Agent reads everything" },
    { num: "03", title: "Ship", desc: "Get a site you&apos;d share" },
  ];

  return (
    <section className="border-t border-border px-6 py-16 md:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <div className="flex flex-1 flex-wrap items-center gap-x-10 gap-y-6 md:gap-x-14 lg:gap-x-20">
            {steps.map((step, i) => (
              <div key={step.num} className="flex items-baseline gap-3">
                <span className="font-serif text-2xl italic text-accent/60 md:text-3xl">
                  {step.num}
                </span>
                <div>
                  <p className="font-serif text-lg text-foreground md:text-xl">
                    {step.title}
                  </p>
                  <p
                    className="mt-0.5 text-xs text-muted"
                    dangerouslySetInnerHTML={{ __html: step.desc }}
                  />
                </div>
                {i < steps.length - 1 && (
                  <span className="ml-6 hidden h-px w-8 bg-border lg:block" />
                )}
              </div>
            ))}
          </div>

          <Link
            href="/how-it-works"
            className="group inline-flex items-center gap-1.5 whitespace-nowrap text-sm text-foreground transition-colors hover:text-accent"
          >
            See how it works
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}

function Examples() {
  return (
    <section
      id="examples"
      className="border-t border-border px-6 py-20 md:py-28 lg:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-y-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow mb-3">Portfolios, generated</p>
            <h2 className="font-serif text-4xl tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.25rem]">
              Three students.{" "}
              <span className="italic">Three voices.</span>
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-muted md:text-right">
            Each portfolio is composed by the agent and themed for the
            student&rsquo;s field.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 lg:gap-8">
          <MayaCard />
          <JordanCard />
          <RiyaCard />
        </div>

        <div className="mt-10 flex items-center justify-center gap-3 text-xs text-muted">
          <span className="hairline h-px w-12" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
            Examples are illustrative
          </span>
          <span className="hairline h-px w-12" />
        </div>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="border-t border-border px-6 py-24 md:py-28 lg:py-36">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow mb-5">Built in 5 minutes</p>
        <h2 className="font-serif text-5xl leading-[0.95] tracking-[-0.02em] text-foreground sm:text-6xl md:text-7xl">
          Yours <span className="italic">forever.</span>
        </h2>
        <p className="mx-auto mt-6 max-w-md text-base text-muted md:text-lg">
          Connect your sources. Watch the agent work. Ship a site you actually
          like.
        </p>
        <div className="mt-10 flex justify-center">
          <form action={signInWithGoogle}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] transition-all hover:opacity-90 active:translate-y-[0.5px]"
            >
              Build mine
              <ArrowRight className="size-3.5" />
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
