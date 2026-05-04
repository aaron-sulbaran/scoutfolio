"use client";

import { useState } from "react";
import { ArrowRight, Loader2, Sparkles, Star } from "lucide-react";
import { NarrationPanel } from "@/components/connect/findings-view";

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
  onGenerate?: (items: InventoryItem[]) => void;
  generating?: boolean;
  generationStatuses?: string[];
  generationError?: string;
  generateRemaining?: { remaining: number; max: number; bypass?: boolean };
};

const ACTION_LABEL: Record<InventoryItem["suggestedAction"], string> = {
  feature: "Feature",
  include: "Include",
  skip: "Skip",
};

export function InventoryPanel({
  loading,
  inventory,
  error,
  onGenerate,
  generating,
  generationStatuses,
  generationError,
  generateRemaining,
}: Props) {
  const [items, setItems] = useState<InventoryItem[]>(
    () => inventory?.items ?? []
  );
  // Reset overrides when a new inventory arrives. This is the React-recommended
  // render-time-setState pattern for "adjust state when a prop changes."
  const [prevInventory, setPrevInventory] = useState(inventory);
  if (inventory !== prevInventory) {
    setPrevInventory(inventory);
    setItems(inventory?.items ?? []);
  }

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

  function handleAction(
    index: number,
    action: InventoryItem["suggestedAction"]
  ) {
    setItems((prev) =>
      prev.map((it, i) =>
        i === index ? { ...it, suggestedAction: action } : it
      )
    );
  }

  const featureOrIncludeCount = items.filter(
    (i) => i.suggestedAction !== "skip"
  ).length;
  const canGenerate = featureOrIncludeCount > 0 && !generating;

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
        {items.map((item, i) => (
          <InventoryItemCard
            key={item.title + i}
            item={item}
            index={i}
            onAction={(a) => handleAction(i, a)}
          />
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

      {onGenerate && (
        <div className="mt-12 flex flex-col items-center gap-3 text-center">
          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => onGenerate(items)}
            className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all ${
              canGenerate
                ? "cursor-pointer bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] hover:opacity-90 active:translate-y-[0.5px]"
                : "cursor-not-allowed bg-accent/30 text-accent-foreground/70"
            }`}
          >
            {generating ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Generating your portfolio&hellip;
              </>
            ) : (
              <>
                Generate portfolio
                <ArrowRight className="size-3.5" />
              </>
            )}
          </button>
          <p className="text-xs text-muted">
            {featureOrIncludeCount} item
            {featureOrIncludeCount === 1 ? "" : "s"} will go on the site.
            Skipped items are excluded.
          </p>
          {generateRemaining && (
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70">
              {generateRemaining.bypass
                ? "Unlimited portfolios (dev)"
                : `${generateRemaining.remaining} of ${generateRemaining.max} portfolio builds left today`}
            </p>
          )}
          {generationStatuses && (
            <div className="mt-2 w-full max-w-xl text-left">
              <NarrationPanel statuses={generationStatuses} />
            </div>
          )}
          {generationError && (
            <div className="mt-3 max-w-md rounded-md border border-red-200 bg-red-50/40 p-3 text-xs text-red-900">
              {generationError}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function InventoryItemCard({
  item,
  index,
  onAction,
}: {
  item: InventoryItem;
  index: number;
  onAction: (a: InventoryItem["suggestedAction"]) => void;
}) {
  const action = item.suggestedAction;
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
          <ActionToggle action={action} onChange={onAction} />
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
