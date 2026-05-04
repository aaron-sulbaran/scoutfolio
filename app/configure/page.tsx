import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ConfigureClient } from "./configure-client";

export default async function ConfigurePage() {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const fullName = session.user?.displayName ?? session.user?.name;
  const firstName = fullName?.split(" ")[0];

  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="app" />

        <main className="flex-1 px-6 pb-24 pt-16 md:pt-20">
          <div className="mx-auto max-w-3xl">
            <header className="text-left">
              <p className="eyebrow mb-4">Step 02 / Design</p>
              <h1 className="font-serif text-3xl leading-[1.1] tracking-[-0.02em] text-foreground sm:text-4xl">
                Now, let&rsquo;s pick the{" "}
                <span className="italic">vibe</span>
                {firstName ? (
                  <>
                    , <span className="italic">{firstName}</span>
                  </>
                ) : null}
                .
              </h1>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-muted">
                Describe the portfolio you want. The more detail, the closer
                the result. The agent will pick the layout, palette, and tone
                from your description.
              </p>
            </header>

            <div className="mt-12">
              <ConfigureClient />
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
