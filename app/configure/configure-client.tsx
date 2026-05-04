"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Loader2, Sparkles } from "lucide-react";
import { COLOR_PALETTES, THEME_PRESETS } from "@/lib/portfolio-scaffold/presets";
import {
  ABOUT_VARIANT_IDS,
  CONTACT_VARIANT_IDS,
  HERO_VARIANT_IDS,
  WORK_VARIANT_IDS,
  type AboutVariant,
  type ContactVariant,
  type HeroVariant,
  type WorkVariant,
} from "@/lib/portfolio-scaffold/themes";

const PENDING_KEY = "scoutfolio.pending-generation.v1";
const GENERATED_KEY = "scoutfolio.generated.v2";
const MAX_BRIEF = 500;

type Pending = {
  inventory: { headline: string; items: unknown[] };
  user: { name?: string; targetRole?: string; contact?: unknown };
};

type ModeChoice = "auto" | "light" | "dark";

const PLACEHOLDERS = [
  "A clean editorial portfolio that reads like a New York Times feature.",
  "Dark, terminal-themed, very dev. Make it feel like reading a git log.",
  "Minimal. Almost no chrome. Single column. One accent color.",
  "Vintage editorial zine. Heavy display serif, asymmetric layout, paper texture.",
];

type GenerateComplete = {
  files: { path: string; content: string }[];
  previewHtml: string;
  content: unknown;
  summary?: string;
  meta: { name: string; title: string };
};

export function ConfigureClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [hydrated, setHydrated] = useState(false);

  const [brief, setBrief] = useState("");
  const [mode, setMode] = useState<ModeChoice>("auto");
  const [paletteId, setPaletteId] = useState<string | undefined>(undefined);
  const [presetId, setPresetId] = useState<string | undefined>(undefined);
  const [heroOverride, setHeroOverride] = useState<HeroVariant | "">("");
  const [workOverride, setWorkOverride] = useState<WorkVariant | "">("");
  const [aboutOverride, setAboutOverride] = useState<AboutVariant | "">("");
  const [contactOverride, setContactOverride] = useState<ContactVariant | "">(
    ""
  );
  const [showRefine, setShowRefine] = useState(false);
  const [placeholderIdx] = useState(() =>
    Math.floor(Math.random() * PLACEHOLDERS.length)
  );

  const [generating, setGenerating] = useState(false);
  const [statuses, setStatuses] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | undefined>(
    undefined
  );
  const submittedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(PENDING_KEY);
      if (!raw) {
        router.replace("/connect");
        return;
      }
      const parsed = JSON.parse(raw) as Pending;
      if (!parsed?.inventory || !parsed?.user) {
        router.replace("/connect");
        return;
      }
      setPending(parsed);
    } catch {
      router.replace("/connect");
      return;
    } finally {
      setHydrated(true);
    }
  }, [router]);

  const remaining = MAX_BRIEF - brief.length;

  const stylePreferences = useMemo(() => {
    const prefs: Record<string, unknown> = {};
    const trimmed = brief.trim();
    if (trimmed) prefs.brief = trimmed;
    if (presetId) prefs.presetId = presetId;
    if (paletteId) prefs.paletteId = paletteId;
    if (mode !== "auto") prefs.mode = mode;
    const layoutOverrides: Record<string, string> = {};
    if (heroOverride) layoutOverrides.hero = heroOverride;
    if (workOverride) layoutOverrides.work = workOverride;
    if (aboutOverride) layoutOverrides.about = aboutOverride;
    if (contactOverride) layoutOverrides.contact = contactOverride;
    if (Object.keys(layoutOverrides).length > 0) {
      prefs.layoutOverrides = layoutOverrides;
    }
    return prefs;
  }, [
    brief,
    presetId,
    paletteId,
    mode,
    heroOverride,
    workOverride,
    aboutOverride,
    contactOverride,
  ]);

  async function submit(usePrefs: boolean) {
    if (!pending || submittedRef.current) return;
    submittedRef.current = true;
    setGenerating(true);
    setErrorMessage(undefined);
    setStatuses(["Spinning up the portfolio agent..."]);

    const body = {
      inventory: pending.inventory,
      user: pending.user,
      ...(usePrefs && Object.keys(stylePreferences).length > 0
        ? { stylePreferences }
        : {}),
    };

    try {
      const res = await fetch("/api/generate-portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        let message = `${res.status}: ${await res.text()}`;
        try {
          const json = JSON.parse(message.split(": ").slice(1).join(": "));
          if (json?.message) message = json.message;
        } catch {
          // keep message as-is
        }
        setErrorMessage(message);
        setGenerating(false);
        submittedRef.current = false;
        return;
      }
      if (!res.body) {
        setErrorMessage("No response body from agent.");
        setGenerating(false);
        submittedRef.current = false;
        return;
      }

      let complete: GenerateComplete | null = null;
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          let evt: { type: string; [k: string]: unknown };
          try {
            evt = JSON.parse(trimmed);
          } catch {
            continue;
          }
          if (evt.type === "status") {
            setStatuses((prev) => [...prev, String(evt.text)]);
          } else if (evt.type === "file_complete") {
            setStatuses((prev) => [...prev, `Wrote ${String(evt.path)}`]);
          } else if (evt.type === "complete") {
            complete = evt.data as GenerateComplete;
          } else if (evt.type === "error") {
            setErrorMessage(String(evt.message));
          }
        }
      }

      if (complete) {
        try {
          sessionStorage.setItem(GENERATED_KEY, JSON.stringify(complete));
          sessionStorage.removeItem(PENDING_KEY);
        } catch (err) {
          console.warn("[configure] sessionStorage failed:", err);
        }
        router.push("/preview");
        return;
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : String(err));
    }
    setGenerating(false);
    submittedRef.current = false;
  }

  if (!hydrated) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <Loader2 className="mx-auto size-4 animate-spin text-accent" />
        <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Loading
        </p>
      </div>
    );
  }
  if (!pending) return null;

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-border bg-card p-6 shadow-[0_18px_40px_-32px_rgba(61,45,79,0.35)] md:p-7">
        <textarea
          name="brief"
          value={brief}
          onChange={(e) => setBrief(e.target.value.slice(0, MAX_BRIEF))}
          placeholder={PLACEHOLDERS[placeholderIdx]}
          rows={5}
          autoFocus
          maxLength={MAX_BRIEF}
          disabled={generating}
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
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70">
            Optional. Skip to let the agent decide.
          </p>
        </div>
      </section>

      <details
        className="rounded-2xl border border-border bg-card/60 p-6"
        open={showRefine}
        onToggle={(e) =>
          setShowRefine((e.target as HTMLDetailsElement).open)
        }
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm text-foreground">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
            Refine the details
          </span>
          <span className="font-mono text-[10px] text-muted/70">
            {showRefine ? "Hide" : "Optional"}
          </span>
        </summary>

        <div className="mt-6 space-y-8">
          <ModeSection mode={mode} onChange={setMode} />
          <PresetSection presetId={presetId} onChange={setPresetId} />
          <PaletteSection paletteId={paletteId} onChange={setPaletteId} />
          <OverridesSection
            hero={heroOverride}
            work={workOverride}
            about={aboutOverride}
            contact={contactOverride}
            setHero={setHeroOverride}
            setWork={setWorkOverride}
            setAbout={setAboutOverride}
            setContact={setContactOverride}
          />
        </div>
      </details>

      <div className="flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          disabled={generating}
          onClick={() => submit(true)}
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all ${
            generating
              ? "cursor-not-allowed bg-accent/30 text-accent-foreground/70"
              : "cursor-pointer bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] hover:opacity-90 active:translate-y-[0.5px]"
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
        <button
          type="button"
          disabled={generating}
          onClick={() => submit(false)}
          className="text-xs text-muted underline-offset-4 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
        >
          Just decide for me
        </button>
        {statuses.length > 0 && (
          <div className="mt-6 w-full max-w-xl">
            <StatusPanel statuses={statuses} />
          </div>
        )}
        {errorMessage && (
          <div className="mt-3 max-w-md rounded-md border border-red-200 bg-red-50/40 p-3 text-xs text-red-900">
            {errorMessage}
          </div>
        )}
      </div>
    </div>
  );
}

function ModeSection({
  mode,
  onChange,
}: {
  mode: ModeChoice;
  onChange: (m: ModeChoice) => void;
}) {
  const options: Array<{ id: ModeChoice; label: string }> = [
    { id: "auto", label: "Auto" },
    { id: "light", label: "Light" },
    { id: "dark", label: "Dark" },
  ];
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        Mode
      </p>
      <div className="mt-3 inline-flex rounded-full border border-border p-0.5 text-[11px] font-medium">
        {options.map((o) => {
          const active = mode === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              className={`rounded-full px-3.5 py-1 transition-all ${
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PresetSection({
  presetId,
  onChange,
}: {
  presetId: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        Starting point
      </p>
      <p className="mt-1.5 text-xs text-muted/70">
        Seeds the layout, fonts, and palette before the agent reads your brief.
        Pick one or leave it blank.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2 md:grid-cols-4">
        {THEME_PRESETS.map((p) => {
          const active = presetId === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onChange(active ? undefined : p.id)}
              className={`flex flex-col rounded-xl border p-4 text-left transition-all ${
                active
                  ? "border-accent bg-accent/5 shadow-[0_1px_0_rgba(255,255,255,0.05)_inset]"
                  : "border-border hover:border-muted/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-serif text-base text-foreground">
                  {p.label}
                </span>
                {active && <Check className="size-3.5 text-accent" />}
              </div>
              <span className="mt-1.5 text-[11px] leading-snug text-muted">
                {p.blurb}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function PaletteSection({
  paletteId,
  onChange,
}: {
  paletteId: string | undefined;
  onChange: (id: string | undefined) => void;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        Color palette
      </p>
      <p className="mt-1.5 text-xs text-muted/70">
        A starting suggestion. The agent may pick differently if your brief
        points elsewhere.
      </p>
      <ul className="mt-4 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {COLOR_PALETTES.map((p) => {
          const active = paletteId === p.id;
          const swatches = [
            p.light.paper,
            p.light.card,
            p.light.rust,
            p.light.ink,
          ];
          return (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onChange(active ? undefined : p.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all ${
                  active
                    ? "border-accent bg-accent/5"
                    : "border-border hover:border-muted/60"
                }`}
              >
                <span className="flex shrink-0 items-center gap-0.5">
                  {swatches.map((s, i) => (
                    <span
                      key={i}
                      className="block size-4 rounded-full border border-border/60"
                      style={{ backgroundColor: s }}
                      aria-hidden
                    />
                  ))}
                </span>
                <span className="flex-1">
                  <span className="block text-sm text-foreground">
                    {p.label}
                  </span>
                </span>
                {active && <Check className="size-3.5 text-accent" />}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function OverridesSection<T extends string>({
  hero,
  work,
  about,
  contact,
  setHero,
  setWork,
  setAbout,
  setContact,
}: {
  hero: HeroVariant | "";
  work: WorkVariant | "";
  about: AboutVariant | "";
  contact: ContactVariant | "";
  setHero: (v: HeroVariant | "") => void;
  setWork: (v: WorkVariant | "") => void;
  setAbout: (v: AboutVariant | "") => void;
  setContact: (v: ContactVariant | "") => void;
}) {
  void undefined as T | undefined;
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted">
        Force a specific section
      </p>
      <p className="mt-1.5 text-xs text-muted/70">
        Pin individual sections; everything left as Auto stays the agent&rsquo;s
        choice.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <OverrideField
          label="Hero"
          value={hero}
          options={HERO_VARIANT_IDS}
          onChange={(v) => setHero((v as HeroVariant) || "")}
        />
        <OverrideField
          label="Work"
          value={work}
          options={WORK_VARIANT_IDS}
          onChange={(v) => setWork((v as WorkVariant) || "")}
        />
        <OverrideField
          label="About"
          value={about}
          options={ABOUT_VARIANT_IDS}
          onChange={(v) => setAbout((v as AboutVariant) || "")}
        />
        <OverrideField
          label="Contact"
          value={contact}
          options={CONTACT_VARIANT_IDS}
          onChange={(v) => setContact((v as ContactVariant) || "")}
        />
      </div>
    </div>
  );
}

function OverrideField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-accent focus:outline-none"
      >
        <option value="">Auto</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </label>
  );
}

function StatusPanel({ statuses }: { statuses: string[] }) {
  return (
    <div className="rounded-md border border-border bg-card/80 px-4 py-3 text-left">
      <div className="flex items-center gap-2">
        <Sparkles className="size-3 text-accent" />
        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
          Agent at work
        </p>
      </div>
      <ol className="mt-2.5 flex flex-col gap-1.5 font-mono text-[11px] leading-snug text-muted">
        {statuses.map((s, i) => (
          <li key={i}>
            <span className="text-accent">{">"}</span> {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
