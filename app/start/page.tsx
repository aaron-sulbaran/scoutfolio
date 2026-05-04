import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { StartForm } from "./start-form";

export default async function StartPage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  if (session.user?.onboardingNarrative) {
    redirect("/connect");
  }

  const fullName = session.user?.displayName ?? session.user?.name;
  const firstName = fullName?.split(" ")[0];

  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="app" />

        <main className="flex-1 px-6 pb-24 pt-20 md:pt-28">
          <div className="mx-auto max-w-xl">
            <header className="text-center">
              <p className="eyebrow mb-4">Step 1 of 2</p>
              <p className="font-sans text-lg text-foreground">
                Hi, <span className="font-serif italic">{firstName ?? "there"}</span>.
              </p>
              <h1 className="mt-0.5 font-serif text-3xl leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
                First, tell me about yourself
              </h1>
              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted">
                In a sentence or two, share who you are and what you&rsquo;re
                looking for. The agent uses this to decide what to feature.
              </p>
            </header>

            <div className="mt-12">
              <StartForm />
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
