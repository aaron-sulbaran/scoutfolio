"use client";

import { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  FileUp,
  Github,
  Globe,
  Linkedin,
  Lock,
  Plus,
} from "lucide-react";

type SourceId = "github" | "resume" | "url";

const SOURCES: ReadonlyArray<{
  id: SourceId | "linkedin";
  label: string;
  copy: string;
  Icon: typeof Github;
  comingSoon?: boolean;
}> = [
  {
    id: "github",
    label: "GitHub",
    copy: "We'll surface your strongest repos and READMEs.",
    Icon: Github,
  },
  {
    id: "resume",
    label: "Resume",
    copy: "Upload your resume PDF. We'll read it like a recruiter would.",
    Icon: FileUp,
  },
  {
    id: "url",
    label: "Personal URL",
    copy: "Blog, Devpost, personal site, anything public.",
    Icon: Globe,
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    copy: "We'll pull your experience and projects.",
    Icon: Linkedin,
    comingSoon: true,
  },
];

export function ConnectorGrid() {
  const [connected, setConnected] = useState<Set<SourceId>>(new Set());
  const [urlValue, setUrlValue] = useState("");

  const isConnected = (id: SourceId) => connected.has(id);

  const toggle = (id: SourceId) => {
    setConnected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addUrl = () => {
    if (!urlValue.trim()) return;
    setConnected((prev) => new Set(prev).add("url"));
    setUrlValue("");
  };

  const hasAny = connected.size > 0;

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {SOURCES.map((source) => {
          const connectedNow =
            !source.comingSoon && isConnected(source.id as SourceId);
          return (
            <li
              key={source.id}
              className={`relative rounded-2xl border bg-card p-7 transition-all ${
                source.comingSoon
                  ? "border-border opacity-60"
                  : connectedNow
                    ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
                    : "border-border hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span
                    className={`flex size-9 items-center justify-center rounded-full ${
                      connectedNow
                        ? "bg-accent text-accent-foreground"
                        : "bg-foreground/[0.04] text-foreground"
                    }`}
                  >
                    <source.Icon className="size-4" strokeWidth={1.75} />
                  </span>
                  <div>
                    <p className="text-base font-medium leading-none text-foreground">
                      {source.label}
                    </p>
                    {connectedNow && (
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                        Connected
                      </p>
                    )}
                  </div>
                </div>
                {source.comingSoon && (
                  <Lock className="size-3.5 text-muted" strokeWidth={1.75} />
                )}
              </div>

              <p className="mt-5 text-sm leading-relaxed text-muted">
                {source.copy}
              </p>

              <div className="mt-6">
                {source.comingSoon ? (
                  <button
                    type="button"
                    disabled
                    className="cursor-not-allowed rounded-full border border-border px-4 py-2 text-xs text-muted"
                  >
                    Coming soon
                  </button>
                ) : source.id === "url" ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={urlValue}
                      onChange={(e) => setUrlValue(e.target.value)}
                      placeholder="https://you.dev"
                      className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={addUrl}
                      className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
                    >
                      <Plus className="size-3" />
                      Add
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => toggle(source.id as SourceId)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                      connectedNow
                        ? "border border-border bg-card text-foreground hover:border-accent/40"
                        : "bg-accent text-accent-foreground hover:opacity-90"
                    }`}
                  >
                    {connectedNow
                      ? "Disconnect"
                      : source.id === "resume"
                        ? "Upload"
                        : "Connect"}
                    {!connectedNow && source.id !== "resume" && (
                      <ArrowUpRight className="size-3" />
                    )}
                    {!connectedNow && source.id === "resume" && (
                      <FileUp className="size-3" />
                    )}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          disabled={!hasAny}
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all ${
            hasAny
              ? "cursor-pointer bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] hover:opacity-90 active:translate-y-[0.5px]"
              : "cursor-not-allowed bg-accent/30 text-accent-foreground/70"
          }`}
        >
          Run discovery
          <ArrowRight className="size-3.5" />
        </button>
        <p className="text-xs text-muted">
          {hasAny ? (
            <>
              We&rsquo;ll analyze your sources and build your portfolio
              inventory in about 60 seconds.
            </>
          ) : (
            <>Connect at least one source to begin.</>
          )}
        </p>
      </div>
    </div>
  );
}
