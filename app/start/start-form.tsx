"use client";

import { ArrowRight, Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { saveNarrative } from "@/app/actions";

const MAX = 500;
const PLACEHOLDER =
  "I'm an electrical engineering student pivoting to product management. Looking for PM internships at consumer tech companies.";

export function StartForm() {
  const [value, setValue] = useState("");
  const [isPending, startTransition] = useTransition();

  const remaining = MAX - value.length;
  const trimmed = value.trim();
  const canSubmit = trimmed.length > 0 && !isPending;

  function onSubmit(formData: FormData) {
    startTransition(() => {
      void saveNarrative(formData);
    });
  }

  return (
    <form
      action={onSubmit}
      className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(61,45,79,0.35)]"
    >
      <textarea
        name="narrative"
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX))}
        placeholder={PLACEHOLDER}
        rows={5}
        autoFocus
        maxLength={MAX}
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
              Continue
              <ArrowRight className="size-3" />
            </>
          )}
        </button>
      </div>
    </form>
  );
}
