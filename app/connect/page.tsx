import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { ConnectorGrid } from "@/components/connect/connector-grid";
import { getWorkspace } from "@/lib/workspace";

export default async function ConnectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }
  if (!session.user?.onboardingNarrative) {
    redirect("/start");
  }
  const { error } = await searchParams;
  const githubConfigError = error === "github-not-configured";
  const workspace = await getWorkspace(session.user!.email!);

  const fullName = session.user?.displayName ?? session.user?.name;
  const firstName = fullName?.split(" ")[0] ?? "you";

  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="app" />

        <main className="flex-1 px-6 pb-24 pt-16 md:pt-20">
          <div className="mx-auto max-w-3xl">
            <header className="text-center">
              <p className="eyebrow mb-4">Step 1 of 2</p>
              <h1 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl md:text-[3.25rem]">
                Let&rsquo;s find your work,{" "}
                <span className="italic">{firstName}.</span>
              </h1>
              <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-muted md:text-lg">
                ScoutFolio reads from the places your work already lives.
                Connect at least one to get started. The more you connect, the
                better the result.
              </p>
            </header>

            <div className="mt-14">
              <ConnectorGrid
                githubLogin={session.user?.githubLogin}
                githubConnected={Boolean(session.user?.githubToken)}
                githubConfigError={githubConfigError}
                initialWorkspace={workspace}
              />
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
