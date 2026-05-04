"use client";

import { Loader2, Save } from "lucide-react";
import { useState, useTransition } from "react";
import { updateDisplayName, updateNarrative } from "@/app/actions";

const NARRATIVE_MAX = 500;
const NAME_MAX = 60;

type Props = {
  email: string;
  googleName: string;
  displayName: string;
  narrative: string;
};

export function SettingsForm({
  email,
  googleName,
  displayName,
  narrative,
}: Props) {
  return (
    <div className="space-y-8">
      <AccountCard
        email={email}
        googleName={googleName}
        initialDisplayName={displayName}
      />
      <NarrativeCard initial={narrative} />
    </div>
  );
}

function AccountCard({
  email,
  googleName,
  initialDisplayName,
}: {
  email: string;
  googleName: string;
  initialDisplayName: string;
}) {
  const [value, setValue] = useState(initialDisplayName);
  const [isPending, startTransition] = useTransition();
  const trimmed = value.trim();
  const dirty = trimmed !== initialDisplayName.trim();

  function onSubmit(formData: FormData) {
    startTransition(() => {
      void updateDisplayName(formData);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(61,45,79,0.35)]">
      <p className="eyebrow mb-3">Account</p>
      <h2 className="font-serif text-2xl tracking-[-0.01em] text-foreground">
        Who you are
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Connected via Google. Email cannot be changed here.
      </p>

      <dl className="mt-6 grid gap-4 sm:grid-cols-[120px_1fr]">
        <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Email
        </dt>
        <dd className="text-sm text-foreground">{email || "Not available"}</dd>

        <dt className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          Google name
        </dt>
        <dd className="text-sm text-foreground">{googleName || "Not set"}</dd>
      </dl>

      <form action={onSubmit} className="mt-8 border-t border-border pt-6">
        <label
          htmlFor="displayName"
          className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted"
        >
          Display name override
        </label>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Leave empty to use your Google name. The agent uses this in greetings
          and as the candidate name on your portfolio.
        </p>
        <input
          id="displayName"
          name="displayName"
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, NAME_MAX))}
          maxLength={NAME_MAX}
          placeholder={googleName || "Your name"}
          disabled={isPending}
          className="mt-4 w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between">
          <p
            className={`font-mono text-[11px] ${
              NAME_MAX - value.length < 10 ? "text-accent" : "text-muted"
            }`}
          >
            {NAME_MAX - value.length} characters left
          </p>
          <button
            type="submit"
            disabled={!dirty || isPending}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="size-3" />
                Save name
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

function NarrativeCard({ initial }: { initial: string }) {
  const [value, setValue] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const remaining = NARRATIVE_MAX - value.length;
  const trimmed = value.trim();
  const dirty = trimmed !== initial.trim();
  const canSubmit = trimmed.length > 0 && dirty && !isPending;

  function onSubmit(formData: FormData) {
    startTransition(() => {
      void updateNarrative(formData);
    });
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(61,45,79,0.35)]">
      <p className="eyebrow mb-3">Narrative</p>
      <h2 className="font-serif text-2xl tracking-[-0.01em] text-foreground">
        About <span className="italic">you</span>
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Used by the discovery and portfolio agents to decide what to feature
        and how to talk about you.
      </p>

      <form action={onSubmit} className="mt-6">
        <textarea
          name="narrative"
          value={value}
          onChange={(e) => setValue(e.target.value.slice(0, NARRATIVE_MAX))}
          rows={5}
          maxLength={NARRATIVE_MAX}
          disabled={isPending}
          className="w-full resize-none rounded-xl border border-border bg-background px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-60"
        />
        <div className="mt-3 flex items-center justify-between">
          <p
            className={`font-mono text-[11px] ${
              remaining < 50 ? "text-accent" : "text-muted"
            }`}
          >
            {remaining} characters left
          </p>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isPending ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving
              </>
            ) : (
              <>
                <Save className="size-3" />
                Save narrative
              </>
            )}
          </button>
        </div>
      </form>
    </section>
  );
}
