import Link from "next/link";
import { ScoutMark } from "@/components/scout-mark";
import { signInWithGoogle, signOutAction } from "@/app/actions";

type SiteNavProps = {
  variant?: "marketing" | "app";
};

export function SiteNav({ variant = "marketing" }: SiteNavProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/75 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
        <Link
          href={variant === "app" ? "/connect" : "/"}
          className="group flex items-center gap-2.5 text-foreground"
        >
          <ScoutMark className="size-4 text-accent transition-transform duration-300 group-hover:rotate-12" />
          <span className="font-serif text-xl leading-none tracking-tight">
            ScoutFolio
          </span>
        </Link>
        <div className="flex items-center gap-1.5 sm:gap-3">
          {variant === "marketing" ? <MarketingNavRight /> : <AppNavRight />}
        </div>
      </nav>
    </header>
  );
}

function MarketingNavRight() {
  return (
    <>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          Sign in
        </button>
      </form>
      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_8px_24px_-12px_rgba(61,45,79,0.6)] transition-all hover:opacity-90 active:translate-y-[0.5px]"
        >
          Get started
        </button>
      </form>
    </>
  );
}

function AppNavRight() {
  return (
    <form action={signOutAction}>
      <button
        type="submit"
        className="rounded-full px-3 py-2 text-sm text-muted transition-colors hover:text-foreground"
      >
        Sign out
      </button>
    </form>
  );
}
