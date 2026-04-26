"use client";

import { useState } from "react";
import { Loader2, Sparkles, Star } from "lucide-react";

export type InventoryItem = {
  title: string;
  description: string;
  source: string;
  strengthScore: number;
  reasoning: string;
  suggestedAction: "feature" | "include" | "skip";
};

export type Inventory = {
  headline: string;
  items: InventoryItem[];
  suggestedNext: string[];
};

type Props = {
  loading: boolean;
  inventory?: Inventory;
  error?: string;
};

const ACTION_LABEL: Record<InventoryItem["suggestedAction"], string> = {
  feature: "Feature",
  include: "Include",
  skip: "Skip",
};

export function InventoryPanel({ loading, inventory, error }: Props) {
  if (loading) {
    return (
      <section className="mt-16 rounded-2xl border border-accent/30 bg-card p-8 md:p-12">
        <div className="flex items-center gap-3">
          <Loader2 className="size-4 animate-spin text-accent" />
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            Agent at work
          </p>
        </div>
        <p className="mt-4 font-serif text-2xl italic text-foreground">
          Compiling your portfolio inventory&hellip;
        </p>
        <p className="mt-2 text-sm text-muted">
          Reading every source, weighing what&rsquo;s portfolio-worthy, drafting
          recruiter-facing copy. Usually 8&ndash;15 seconds.
        </p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="mt-16 rounded-2xl border border-red-200 bg-red-50/40 p-6 text-sm text-red-900">
        {error}
      </section>
    );
  }

  if (!inventory) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3.5 text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Discovery complete
        </p>
      </div>
      <h2 className="mt-3 font-serif text-3xl tracking-[-0.02em] text-foreground sm:text-4xl">
        <span className="italic">&ldquo;{inventory.headline}&rdquo;</span>
      </h2>
      <p className="mt-2 text-sm text-muted">
        {inventory.items.length} item{inventory.items.length === 1 ? "" : "s"}{" "}
        ranked by recruiter fit. Edit, reorder, or skip any of them. Featured
        items will appear most prominently on your generated site.
      </p>

      <ul className="mt-8 space-y-4">
        {inventory.items.map((item, i) => (
          <InventoryItemCard key={item.title + i} item={item} index={i} />
        ))}
      </ul>

      {inventory.suggestedNext.length > 0 && (
        <div className="mt-12 rounded-2xl border border-border bg-card p-7">
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            What to build next
          </p>
          <p className="mt-2 font-serif text-xl italic text-foreground">
            To strengthen the portfolio for your target role.
          </p>
          <ul className="mt-5 space-y-2.5">
            {inventory.suggestedNext.map((next, i) => (
              <li key={i} className="flex items-baseline gap-3 text-sm">
                <span className="font-mono text-[11px] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-foreground">{next}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function InventoryItemCard({
  item,
  index,
}: {
  item: InventoryItem;
  index: number;
}) {
  const [action, setAction] = useState(item.suggestedAction);

  const cardTone =
    action === "feature"
      ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
      : action === "skip"
        ? "border-border opacity-60"
        : "border-border";

  return (
    <li
      className={`relative rounded-2xl border bg-card p-6 transition-all ${cardTone}`}
    >
      <div className="flex items-start justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-mono text-[11px] text-muted">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {item.source}
            </span>
          </div>

          <h3 className="mt-2 font-serif text-2xl tracking-tight text-foreground">
            {item.title}
          </h3>

          <p className="mt-3 text-sm leading-relaxed text-muted">
            {item.description}
          </p>

          <div className="mt-4 flex items-baseline gap-2 text-xs">
            <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              Why
            </span>
            <span className="text-muted/80 italic">{item.reasoning}</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-3 shrink-0">
          <ScoreBadge score={item.strengthScore} />
          <ActionToggle action={action} onChange={setAction} />
        </div>
      </div>
    </li>
  );
}

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      className="flex items-baseline gap-1 rounded-full border border-border px-3 py-1"
      title={`Portfolio fit score: ${score}/10`}
    >
      <Star
        className="size-3 text-accent"
        strokeWidth={2}
        fill="currentColor"
      />
      <span className="font-mono text-xs font-medium text-foreground">
        {score}
      </span>
      <span className="font-mono text-[10px] text-muted">/10</span>
    </div>
  );
}

function ActionToggle({
  action,
  onChange,
}: {
  action: InventoryItem["suggestedAction"];
  onChange: (a: InventoryItem["suggestedAction"]) => void;
}) {
  const options: InventoryItem["suggestedAction"][] = [
    "feature",
    "include",
    "skip",
  ];
  return (
    <div className="flex rounded-full border border-border p-0.5 text-[10px] font-medium uppercase tracking-wider">
      {options.map((opt) => {
        const active = action === opt;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`rounded-full px-2.5 py-1 transition-all ${
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted hover:text-foreground"
            }`}
          >
            {ACTION_LABEL[opt]}
          </button>
        );
      })}
    </div>
  );
}
