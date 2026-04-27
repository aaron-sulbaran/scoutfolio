import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { signInWithGoogle } from "@/app/actions";

export const metadata = {
  title: "How ScoutFolio Works",
  description:
    "Connect your sources, let the agent discover your best work, and ship a portfolio you'd actually share.",
};

export default function HowItWorksPage() {
  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="marketing" />

        <main className="flex-1">
          {/* Header */}
          <section className="px-6 pb-16 pt-20 md:pb-20 md:pt-28">
            <div className="mx-auto max-w-3xl text-center">
              <p className="eyebrow reveal" style={{ animationDelay: "0.05s" }}>
                Three steps to launch
              </p>
              <h1
                className="reveal mt-5 font-serif text-[2.5rem] leading-[0.95] tracking-[-0.02em] text-foreground sm:text-5xl md:text-6xl"
                style={{ animationDelay: "0.15s" }}
              >
                How <span className="italic">ScoutFolio</span> works
              </h1>
            </div>
          </section>

          {/* Steps */}
          <section className="px-6 pb-24 md:pb-32">
            <div className="mx-auto max-w-2xl">
              <div className="flex flex-col gap-20 md:gap-28">
                <Step
                  number="01"
                  headline="Connect"
                  description="Link your GitHub, upload your resume, or paste any URL. We gather the raw material."
                  decorativeElement={<HairlineRule />}
                  delay={0.25}
                />

                <Step
                  number="02"
                  headline="Discover"
                  description="The agent reads everything, extracts your best work, and drafts copy a recruiter would scan."
                  decorativeElement={<DottedCurve />}
                  delay={0.4}
                />

                <Step
                  number="03"
                  headline="Ship"
                  description="Preview, tweak, publish. You get a portfolio site you'd actually share in under five minutes."
                  decorativeElement={<ThreeDots />}
                  delay={0.55}
                />
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className="border-t border-border px-6 py-24 md:py-32">
            <div
              className="reveal mx-auto max-w-xl text-center"
              style={{ animationDelay: "0.7s" }}
            >
              <p className="font-serif text-2xl italic text-foreground md:text-3xl">
                Ready to see what you&apos;ve built?
              </p>
              <div className="mt-8 flex justify-center">
                <form action={signInWithGoogle}>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-medium text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] transition-all hover:opacity-90 active:translate-y-[0.5px]"
                  >
                    Build my portfolio
                    <ArrowRight className="size-3.5" />
                  </button>
                </form>
              </div>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}

function Step({
  number,
  headline,
  description,
  decorativeElement,
  delay,
}: {
  number: string;
  headline: string;
  description: string;
  decorativeElement: React.ReactNode;
  delay: number;
}) {
  return (
    <div
      className="reveal relative"
      style={{ animationDelay: `${delay}s` }}
    >
      {/* Large number */}
      <span className="font-serif text-[6rem] italic leading-none tracking-tight text-accent/20 sm:text-[8rem] md:text-[10rem]">
        {number}
      </span>

      {/* Content positioned over the number */}
      <div className="relative -mt-10 ml-4 sm:-mt-14 sm:ml-6 md:-mt-16 md:ml-8">
        <h2 className="font-serif text-3xl tracking-[-0.02em] text-foreground sm:text-4xl md:text-5xl">
          {headline}
        </h2>
        <p className="mt-4 max-w-md text-base leading-relaxed text-muted md:text-lg">
          {description}
        </p>

        {/* Decorative element */}
        <div className="mt-6">{decorativeElement}</div>
      </div>
    </div>
  );
}

/* Decorative Elements */

function HairlineRule() {
  return (
    <div className="flex items-center gap-2">
      <div className="h-px w-16 bg-gradient-to-r from-accent/40 to-transparent" />
      <div className="h-px w-8 bg-accent/20" />
      <div className="h-px w-4 bg-accent/10" />
    </div>
  );
}

function DottedCurve() {
  return (
    <svg
      width="80"
      height="24"
      viewBox="0 0 80 24"
      fill="none"
      className="text-accent/30"
    >
      <path
        d="M4 20C20 20 20 4 40 4C60 4 60 20 76 20"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeDasharray="2 6"
      />
    </svg>
  );
}

function ThreeDots() {
  return (
    <div className="flex items-center gap-2">
      <span className="size-1.5 rounded-full bg-accent/50" />
      <span className="size-1.5 rounded-full bg-accent/35" />
      <span className="size-1.5 rounded-full bg-accent/20" />
    </div>
  );
}
