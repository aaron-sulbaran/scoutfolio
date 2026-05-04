import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/auth";
import { Grain } from "@/components/grain";
import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { SettingsForm } from "./settings-form";

type SearchParams = Promise<{
  saved?: string;
  error?: string;
}>;

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session) {
    redirect("/");
  }

  const { saved, error } = await searchParams;

  const status = (() => {
    if (error === "narrative-empty") {
      return { tone: "error" as const, text: "Narrative cannot be empty." };
    }
    if (saved === "narrative") {
      return { tone: "success" as const, text: "Narrative updated." };
    }
    if (saved === "name") {
      return { tone: "success" as const, text: "Display name updated." };
    }
    if (saved === "name-cleared") {
      return {
        tone: "success" as const,
        text: "Display name cleared. Using your Google name.",
      };
    }
    return null;
  })();

  return (
    <>
      <Grain />
      <div className="relative z-[2] flex min-h-dvh flex-col">
        <SiteNav variant="app" />

        <main className="flex-1 px-6 pb-24 pt-16 md:pt-20">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/connect"
              className="inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.18em] text-muted transition-colors hover:text-foreground"
            >
              <ArrowLeft className="size-3" strokeWidth={1.75} />
              Back to portfolio builder
            </Link>

            <header className="mt-8">
              <p className="eyebrow mb-4">Account</p>
              <h1 className="font-serif text-4xl leading-[1.05] tracking-[-0.02em] text-foreground sm:text-5xl">
                Your <span className="italic">settings</span>.
              </h1>
              <p className="mt-5 max-w-md text-base leading-relaxed text-muted">
                Edit how the agent sees you. Changes take effect on your next
                portfolio generation.
              </p>
            </header>

            {status ? (
              <p
                className={`mt-8 font-mono text-[11px] uppercase tracking-[0.18em] ${
                  status.tone === "success" ? "text-accent" : "text-foreground"
                }`}
                role="status"
              >
                {status.text}
              </p>
            ) : null}

            <div className="mt-10">
              <SettingsForm
                email={session.user?.email ?? ""}
                googleName={session.user?.name ?? ""}
                displayName={session.user?.displayName ?? ""}
                narrative={session.user?.onboardingNarrative ?? ""}
              />
            </div>
          </div>
        </main>

        <SiteFooter />
      </div>
    </>
  );
}
