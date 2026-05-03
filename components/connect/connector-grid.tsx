"use client";

import { useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  FileUp,
  Github,
  Globe,
  Linkedin,
  Loader2,
  Lock,
  Plus,
} from "lucide-react";
import { readNdjsonStream, type Findings } from "@/lib/extract-client";
import { FindingsView, NarrationPanel } from "@/components/connect/findings-view";
import {
  InventoryPanel,
  type Inventory,
} from "@/components/connect/inventory-panel";

type SourceId = "github" | "resume" | "url";
type Status = "idle" | "uploading" | "extracting" | "done" | "error" | "limited";

type SourceState = {
  status: Status;
  statuses: string[];
  result?: Findings;
  error?: string;
  rateLimit?: { message: string; resetAt: string };
  blobUrl?: string;
  filename?: string;
  inputUrl?: string;
};

type RateLimitBody = {
  error: "rate_limited";
  message: string;
  limit: number;
  resetAt: string;
};

async function parseRateLimit(res: Response): Promise<RateLimitBody | null> {
  if (res.status !== 429) return null;
  try {
    return (await res.clone().json()) as RateLimitBody;
  } catch {
    return null;
  }
}

const INITIAL: SourceState = { status: "idle", statuses: [] };

export function ConnectorGrid() {
  const [github, setGithub] = useState(INITIAL);
  const [resume, setResume] = useState(INITIAL);
  const [url, setUrl] = useState(INITIAL);
  const [urlInput, setUrlInput] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryError, setDiscoveryError] = useState<string | undefined>();
  const [discoveryLimit, setDiscoveryLimit] = useState<
    { message: string; resetAt: string } | undefined
  >();
  const [inventory, setInventory] = useState<Inventory | undefined>();

  const isConnected = (s: SourceState) =>
    s.status === "done" || s.status === "extracting" || s.status === "uploading";
  const connectedCount =
    (isConnected(github) ? 1 : 0) +
    (isConnected(resume) ? 1 : 0) +
    (isConnected(url) ? 1 : 0);
  const hasAnyDone =
    github.status === "done" ||
    resume.status === "done" ||
    url.status === "done";

  async function runExtract(
    source: "url" | "resume",
    payload: { url?: string; blobUrl?: string; filename?: string },
    setState: React.Dispatch<React.SetStateAction<SourceState>>
  ) {
    setState((prev) => ({
      ...prev,
      status: "extracting",
      statuses: [...prev.statuses, "Spinning up the agent..."],
      result: undefined,
      error: undefined,
    }));

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source, ...payload }),
      });

      if (!res.ok) {
        const limited = await parseRateLimit(res);
        if (limited) {
          setState((prev) => ({
            ...prev,
            status: "limited",
            rateLimit: { message: limited.message, resetAt: limited.resetAt },
          }));
          return;
        }
        const text = await res.text();
        setState((prev) => ({
          ...prev,
          status: "error",
          error: `${res.status}: ${text}`,
        }));
        return;
      }

      for await (const event of readNdjsonStream(res)) {
        if (event.type === "status") {
          setState((prev) => ({
            ...prev,
            statuses: [...prev.statuses, event.text],
          }));
        } else if (event.type === "result") {
          setState((prev) => ({ ...prev, result: event.data }));
        } else if (event.type === "done") {
          setState((prev) => ({ ...prev, status: "done" }));
        } else if (event.type === "error") {
          setState((prev) => ({
            ...prev,
            status: "error",
            error: event.message,
          }));
        }
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  async function handleResumeFile(file: File) {
    setResume({
      status: "uploading",
      statuses: [`Uploading ${file.name} (${Math.round(file.size / 1024)} kb)...`],
      filename: file.name,
    });
    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/blob/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        const limited = await parseRateLimit(uploadRes);
        if (limited) {
          setResume((prev) => ({
            ...prev,
            status: "limited",
            rateLimit: { message: limited.message, resetAt: limited.resetAt },
          }));
          return;
        }
        const text = await uploadRes.text();
        throw new Error(`Upload failed (${uploadRes.status}): ${text}`);
      }

      const { url } = (await uploadRes.json()) as { url: string };

      setResume((prev) => ({
        ...prev,
        blobUrl: url,
        statuses: [...prev.statuses, "Upload complete. Reading the PDF..."],
      }));

      await runExtract(
        "resume",
        { blobUrl: url, filename: file.name },
        setResume
      );
    } catch (err) {
      setResume((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  function handleUrlSubmit() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    setUrl({ status: "uploading", statuses: [], inputUrl: normalized });
    setUrlInput("");
    void runExtract("url", { url: normalized }, setUrl);
  }

  async function runDiscovery() {
    const sources: { source: string; data: Findings }[] = [];
    if (resume.result) {
      sources.push({
        source: resume.filename ? `resume: ${resume.filename}` : "resume",
        data: resume.result,
      });
    }
    if (url.result) {
      sources.push({
        source: url.inputUrl ? `personal URL: ${url.inputUrl}` : "personal URL",
        data: url.result,
      });
    }
    if (sources.length === 0) {
      setDiscoveryError("Connect at least one source with extracted findings first.");
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryError(undefined);
    setDiscoveryLimit(undefined);
    setInventory(undefined);

    try {
      const res = await fetch("/api/discover", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sources }),
      });
      if (!res.ok) {
        const limited = await parseRateLimit(res);
        if (limited) {
          setDiscoveryLimit({
            message: limited.message,
            resetAt: limited.resetAt,
          });
          return;
        }
        const text = await res.text();
        setDiscoveryError(`${res.status}: ${text}`);
        return;
      }
      const data = (await res.json()) as Inventory;
      setInventory(data);
      setTimeout(() => {
        document
          .getElementById("inventory")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (err) {
      setDiscoveryError(err instanceof Error ? err.message : String(err));
    } finally {
      setDiscoveryLoading(false);
    }
  }

  function toggleGithub() {
    setGithub((prev) =>
      prev.status === "done"
        ? INITIAL
        : { status: "done", statuses: ["Mock connection (real GitHub MCP arrives May 4)."] }
    );
  }

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* GitHub — fake/mock */}
        <li
          className={`relative rounded-2xl border bg-card p-7 transition-all ${
            github.status === "done"
              ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
              : "border-border hover:border-accent/30"
          }`}
        >
          <CardHeader
            Icon={Github}
            label="GitHub"
            connected={github.status === "done"}
          />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            We&rsquo;ll surface your strongest repos and READMEs.
            <span className="ml-1 text-[11px] text-muted/60">(MCP wiring lands May 4)</span>
          </p>
          <div className="mt-6">
            <button
              type="button"
              onClick={toggleGithub}
              className={
                github.status === "done"
                  ? "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40"
                  : "inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
              }
            >
              {github.status === "done" ? "Disconnect" : "Connect"}
              {github.status !== "done" && <ArrowUpRight className="size-3" />}
            </button>
          </div>
        </li>

        {/* Resume — real Blob upload + extract */}
        <li
          className={`relative rounded-2xl border bg-card p-7 transition-all ${
            resume.status === "done"
              ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
              : isInProgress(resume)
                ? "border-accent/50"
                : "border-border hover:border-accent/30"
          }`}
        >
          <CardHeader
            Icon={FileUp}
            label="Resume"
            connected={resume.status === "done"}
            inProgress={isInProgress(resume)}
            filename={resume.filename}
          />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Upload your resume PDF. We&rsquo;ll read it like a recruiter would.
          </p>
          <div className="mt-6">
            <input
              ref={fileRef}
              type="file"
              accept="application/pdf"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void handleResumeFile(file);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={isInProgress(resume)}
              onClick={() => fileRef.current?.click()}
              className={
                resume.status === "done"
                  ? "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40"
                  : "inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              }
            >
              {resume.status === "done" ? "Replace" : "Upload PDF"}
              {!isInProgress(resume) && <FileUp className="size-3" />}
            </button>
          </div>
          <NarrationPanel statuses={resume.statuses} />
          {resume.result && <FindingsView data={resume.result} />}
          {resume.status === "limited" && resume.rateLimit && (
            <LimitedRow message={resume.rateLimit.message} />
          )}
          {resume.error && <ErrorRow message={resume.error} />}
        </li>

        {/* Personal URL — real extract */}
        <li
          className={`relative rounded-2xl border bg-card p-7 transition-all ${
            url.status === "done"
              ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
              : isInProgress(url)
                ? "border-accent/50"
                : "border-border hover:border-accent/30"
          }`}
        >
          <CardHeader
            Icon={Globe}
            label="Personal URL"
            connected={url.status === "done"}
            inProgress={isInProgress(url)}
            filename={url.inputUrl?.replace(/^https?:\/\//, "")}
          />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Blog, Devpost, personal site, anything public.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <input
              type="url"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUrlSubmit();
              }}
              placeholder="you.dev"
              disabled={isInProgress(url)}
              className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={isInProgress(url) || !urlInput.trim()}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Plus className="size-3" />
              Add
            </button>
          </div>
          <NarrationPanel statuses={url.statuses} />
          {url.result && <FindingsView data={url.result} />}
          {url.status === "limited" && url.rateLimit && (
            <LimitedRow message={url.rateLimit.message} />
          )}
          {url.error && <ErrorRow message={url.error} />}
        </li>

        {/* LinkedIn — coming soon */}
        <li className="relative rounded-2xl border border-border bg-card p-7 opacity-60">
          <CardHeader Icon={Linkedin} label="LinkedIn" comingSoon />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            We&rsquo;ll pull your experience and projects.
          </p>
          <div className="mt-6">
            <button
              type="button"
              disabled
              className="cursor-not-allowed rounded-full border border-border px-4 py-2 text-xs text-muted"
            >
              Coming soon
            </button>
          </div>
        </li>
      </ul>

      <div className="mt-12 flex flex-col items-center gap-3 text-center">
        <button
          type="button"
          disabled={!hasAnyDone || discoveryLoading}
          onClick={runDiscovery}
          className={`inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-medium transition-all ${
            hasAnyDone && !discoveryLoading
              ? "cursor-pointer bg-accent text-accent-foreground shadow-[0_1px_0_rgba(255,255,255,0.08)_inset,0_12px_30px_-12px_rgba(61,45,79,0.65)] hover:opacity-90 active:translate-y-[0.5px]"
              : "cursor-not-allowed bg-accent/30 text-accent-foreground/70"
          }`}
        >
          {discoveryLoading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" />
              Compiling inventory...
            </>
          ) : (
            <>
              Run discovery
              <ArrowRight className="size-3.5" />
            </>
          )}
        </button>
        <p className="text-xs text-muted">
          {hasAnyDone ? (
            <>
              {connectedCount} source{connectedCount === 1 ? "" : "s"} ready.
              The agent will rank and rewrite everything in ~10 seconds.
            </>
          ) : (
            <>Add at least one source to begin.</>
          )}
        </p>
        {discoveryLimit && (
          <div className="mt-3 max-w-md">
            <LimitedRow message={discoveryLimit.message} />
          </div>
        )}
      </div>

      <div id="inventory">
        <InventoryPanel
          loading={discoveryLoading}
          inventory={inventory}
          error={discoveryError}
        />
      </div>
    </div>
  );
}

function isInProgress(s: SourceState) {
  return s.status === "uploading" || s.status === "extracting";
}

function CardHeader({
  Icon,
  label,
  connected,
  inProgress,
  comingSoon,
  filename,
}: {
  Icon: typeof Github;
  label: string;
  connected?: boolean;
  inProgress?: boolean;
  comingSoon?: boolean;
  filename?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-9 items-center justify-center rounded-full ${
            connected
              ? "bg-accent text-accent-foreground"
              : "bg-foreground/[0.04] text-foreground"
          }`}
        >
          {inProgress ? (
            <Loader2 className="size-4 animate-spin" strokeWidth={1.75} />
          ) : connected ? (
            <Check className="size-4" strokeWidth={2} />
          ) : (
            <Icon className="size-4" strokeWidth={1.75} />
          )}
        </span>
        <div>
          <p className="text-base font-medium leading-none text-foreground">
            {label}
          </p>
          {connected && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              Connected
            </p>
          )}
          {inProgress && (
            <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              Working
            </p>
          )}
          {filename && !inProgress && connected && (
            <p className="mt-0.5 truncate text-[11px] text-muted max-w-[200px]">
              {filename}
            </p>
          )}
        </div>
      </div>
      {comingSoon && <Lock className="size-3.5 text-muted" strokeWidth={1.75} />}
    </div>
  );
}

function ErrorRow({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-md border border-red-200 bg-red-50/40 p-3 text-xs text-red-900">
      {message}
    </div>
  );
}

function LimitedRow({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-md border border-accent/25 bg-accent/[0.04] p-3.5 text-[13px] leading-relaxed text-foreground">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
        Daily limit reached
      </p>
      <p className="text-muted">{message}</p>
    </div>
  );
}
