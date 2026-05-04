"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  X,
} from "lucide-react";
import { readNdjsonStream, type Findings } from "@/lib/extract-client";
import { FindingsView, NarrationPanel } from "@/components/connect/findings-view";
import {
  InventoryPanel,
  type Inventory,
  type InventoryItem,
} from "@/components/connect/inventory-panel";
import { useLimits } from "@/lib/use-limits";
import { connectGitHub, disconnectGitHub } from "@/app/actions";
import type { Workspace, UrlArtifact } from "@/lib/workspace";
import { canonicalizeUrl } from "@/lib/canonical";

const GENERATED_STORAGE_KEY = "scoutfolio.generated.v2";

type Status =
  | "idle"
  | "uploading"
  | "extracting"
  | "done"
  | "error"
  | "limited"
  | "soft_failed";

type SourceState = {
  status: Status;
  statuses: string[];
  result?: Findings;
  error?: string;
  softMessage?: string;
  rateLimit?: { message: string; resetAt: string };
  blobUrl?: string;
  filename?: string;
  inputUrl?: string;
  extractedAt?: string;
};

type UrlSlot = SourceState & {
  id: string;
  inputUrl: string;
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

function hydrateResume(ws?: Workspace): SourceState {
  if (!ws?.resume) return INITIAL;
  return {
    status: "done",
    statuses: [],
    result: ws.resume.findings,
    filename: ws.resume.filename,
    blobUrl: ws.resume.blobUrl,
    extractedAt: ws.resume.extractedAt,
  };
}

function hydrateGithub(ws?: Workspace): SourceState {
  if (!ws?.github) return INITIAL;
  return {
    status: "done",
    statuses: [],
    result: ws.github.findings,
    extractedAt: ws.github.extractedAt,
  };
}

function hydrateUrls(ws?: Workspace): UrlSlot[] {
  if (!ws?.urls) return [];
  return ws.urls.map((u: UrlArtifact) => ({
    id: u.id,
    inputUrl: u.url,
    status: "done" as const,
    statuses: [],
    result: u.findings,
    extractedAt: u.extractedAt,
  }));
}

function newSlotId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 16);
  }
  return Math.random().toString(36).slice(2, 18);
}

export function ConnectorGrid({
  githubLogin,
  githubConnected = false,
  githubConfigError = false,
  initialWorkspace,
}: {
  githubLogin?: string;
  githubConnected?: boolean;
  githubConfigError?: boolean;
  initialWorkspace?: Workspace;
} = {}) {
  const [github, setGithub] = useState<SourceState>(() =>
    hydrateGithub(initialWorkspace)
  );
  const [resume, setResume] = useState<SourceState>(() =>
    hydrateResume(initialWorkspace)
  );
  const [urls, setUrls] = useState<UrlSlot[]>(() =>
    hydrateUrls(initialWorkspace)
  );
  const [urlInput, setUrlInput] = useState("");
  const [showUrlInput, setShowUrlInput] = useState(() =>
    hydrateUrls(initialWorkspace).length === 0
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { limits, refresh: refreshLimits } = useLimits();
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoverySoftFail, setDiscoverySoftFail] = useState<
    string | undefined
  >();
  const [discoveryError, setDiscoveryError] = useState<string | undefined>();
  const [discoveryLimit, setDiscoveryLimit] = useState<
    { message: string; resetAt: string } | undefined
  >();
  const [inventory, setInventory] = useState<Inventory | undefined>();
  const [generating, setGenerating] = useState(false);
  const [generationStatuses, setGenerationStatuses] = useState<string[]>([]);
  const [generationError, setGenerationError] = useState<string | undefined>();

  const isConnected = (s: SourceState) =>
    s.status === "done" || s.status === "extracting" || s.status === "uploading";
  const connectedCount =
    (isConnected(github) ? 1 : 0) +
    (isConnected(resume) ? 1 : 0) +
    urls.filter(isConnected).length;
  const hasAnyDone =
    github.status === "done" ||
    resume.status === "done" ||
    urls.some((u) => u.status === "done");

  // Keep the in-card input visible only when there are zero saved URLs.
  // 1 saved → user clicks "Add another URL" to reveal it. 2+ → list section
  // owns the input.
  useEffect(() => {
    if (urls.length === 0) setShowUrlInput(true);
  }, [urls.length]);

  async function runUrlExtract(slotId: string, url: string) {
    setUrls((prev) =>
      prev.map((u) =>
        u.id === slotId
          ? {
              ...u,
              status: "extracting",
              statuses: [...u.statuses, "Spinning up the agent..."],
              result: undefined,
              error: undefined,
              softMessage: undefined,
            }
          : u
      )
    );
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "url", url }),
      });
      if (!res.ok) {
        const limited = await parseRateLimit(res);
        if (limited) {
          setUrls((prev) =>
            prev.map((u) =>
              u.id === slotId
                ? {
                    ...u,
                    status: "limited",
                    rateLimit: {
                      message: limited.message,
                      resetAt: limited.resetAt,
                    },
                  }
                : u
            )
          );
          return;
        }
        const text = await res.text();
        setUrls((prev) =>
          prev.map((u) =>
            u.id === slotId
              ? { ...u, status: "error", error: `${res.status}: ${text}` }
              : u
          )
        );
        return;
      }

      let softMessage: string | undefined;
      let gotResult = false;
      let serverArtifactId: string | undefined;
      let extractedAt: string | undefined;

      for await (const event of readNdjsonStream(res)) {
        if (event.type === "status") {
          setUrls((prev) =>
            prev.map((u) =>
              u.id === slotId
                ? { ...u, statuses: [...u.statuses, event.text] }
                : u
            )
          );
        } else if (event.type === "result") {
          gotResult = true;
          serverArtifactId = event.artifactId;
          extractedAt = event.extractedAt;
          setUrls((prev) =>
            prev.map((u) =>
              u.id === slotId
                ? { ...u, result: event.data, extractedAt: event.extractedAt }
                : u
            )
          );
        } else if (event.type === "extraction_failed") {
          softMessage = event.message;
        } else if (event.type === "done") {
          setUrls((prev) => {
            // If the server returned a different canonical id (re-extract that
            // matched an existing entry), reconcile by replacing the local
            // slot id so DELETE works against the server's id.
            return prev.map((u) =>
              u.id === slotId
                ? {
                    ...u,
                    id: serverArtifactId ?? u.id,
                    status: gotResult ? "done" : "soft_failed",
                    softMessage: gotResult
                      ? undefined
                      : softMessage ??
                        "That URL didn't return enough content. Your usage wasn't affected.",
                    extractedAt,
                  }
                : u
            );
          });
          if (gotResult) void refreshLimits();
        } else if (event.type === "error") {
          setUrls((prev) =>
            prev.map((u) =>
              u.id === slotId
                ? { ...u, status: "error", error: event.message }
                : u
            )
          );
        }
      }
    } catch (err) {
      setUrls((prev) =>
        prev.map((u) =>
          u.id === slotId
            ? {
                ...u,
                status: "error",
                error: err instanceof Error ? err.message : String(err),
              }
            : u
        )
      );
    }
  }

  function submitNewUrl() {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    let normalized = trimmed;
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = "https://" + normalized;
    }
    // Dedupe client-side: if the canonical form matches an existing slot,
    // re-extract that slot in place instead of pushing a new row. The server
    // would also dedupe via upsertUrl, but doing it here keeps the UI honest
    // and prevents the "two visible rows for the same link" flash that
    // burned a rate-limit slot on the second extract.
    const canonicalNew = canonicalizeUrl(normalized);
    const existing = urls.find(
      (u) => canonicalizeUrl(u.inputUrl) === canonicalNew
    );
    setUrlInput("");
    setShowUrlInput(false);
    if (existing) {
      void runUrlExtract(existing.id, normalized);
      return;
    }
    const slotId = newSlotId();
    setUrls((prev) => [
      ...prev,
      {
        id: slotId,
        inputUrl: normalized,
        status: "extracting",
        statuses: [],
      },
    ]);
    void runUrlExtract(slotId, normalized);
  }

  async function reExtractUrl(slot: UrlSlot) {
    await runUrlExtract(slot.id, slot.inputUrl);
  }

  async function removeUrlSlot(slot: UrlSlot) {
    setUrls((prev) => prev.filter((u) => u.id !== slot.id));
    try {
      await fetch(`/api/workspace?source=url&id=${encodeURIComponent(slot.id)}`, {
        method: "DELETE",
      });
    } catch (err) {
      console.warn("[connector-grid] url delete failed:", err);
    }
  }

  async function runResumeExtract(blobUrl: string, filename?: string) {
    setResume((prev) => ({
      ...prev,
      status: "extracting",
      statuses: [...prev.statuses, "Spinning up the agent..."],
      result: undefined,
      error: undefined,
      softMessage: undefined,
      blobUrl,
      filename: filename ?? prev.filename,
    }));
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "resume", blobUrl, filename }),
      });

      if (!res.ok) {
        const limited = await parseRateLimit(res);
        if (limited) {
          setResume((prev) => ({
            ...prev,
            status: "limited",
            rateLimit: { message: limited.message, resetAt: limited.resetAt },
          }));
          return;
        }
        const text = await res.text();
        setResume((prev) => ({
          ...prev,
          status: "error",
          error: `${res.status}: ${text}`,
        }));
        return;
      }

      let softMessage: string | undefined;
      let gotResult = false;
      for await (const event of readNdjsonStream(res)) {
        if (event.type === "status") {
          setResume((prev) => ({
            ...prev,
            statuses: [...prev.statuses, event.text],
          }));
        } else if (event.type === "result") {
          gotResult = true;
          setResume((prev) => ({
            ...prev,
            result: event.data,
            extractedAt: event.extractedAt,
          }));
        } else if (event.type === "extraction_failed") {
          softMessage = event.message;
        } else if (event.type === "done") {
          setResume((prev) => ({
            ...prev,
            status: gotResult ? "done" : "soft_failed",
            softMessage: gotResult
              ? undefined
              : softMessage ??
                "Couldn't pull anything useful from that PDF. Your usage wasn't affected.",
          }));
          if (gotResult) void refreshLimits();
        } else if (event.type === "error") {
          setResume((prev) => ({
            ...prev,
            status: "error",
            error: event.message,
          }));
        }
      }
    } catch (err) {
      setResume((prev) => ({
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

      await runResumeExtract(url, file.name);
    } catch (err) {
      setResume((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  async function reExtractResume() {
    if (!resume.blobUrl) return;
    await runResumeExtract(resume.blobUrl, resume.filename);
  }

  async function removeResumeArtifact() {
    setResume(INITIAL);
    try {
      await fetch("/api/workspace?source=resume", { method: "DELETE" });
    } catch (err) {
      console.warn("[connector-grid] resume delete failed:", err);
    }
  }

  async function runGithubExtract() {
    setGithub((prev) => ({
      ...prev,
      status: "extracting",
      statuses: [...prev.statuses, "Spinning up the agent..."],
      result: undefined,
      error: undefined,
      softMessage: undefined,
    }));
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ source: "github" }),
      });

      if (!res.ok) {
        const limited = await parseRateLimit(res);
        if (limited) {
          setGithub((prev) => ({
            ...prev,
            status: "limited",
            rateLimit: { message: limited.message, resetAt: limited.resetAt },
          }));
          return;
        }
        const text = await res.text();
        setGithub((prev) => ({
          ...prev,
          status: "error",
          error: `${res.status}: ${text}`,
        }));
        return;
      }

      let softMessage: string | undefined;
      let gotResult = false;
      for await (const event of readNdjsonStream(res)) {
        if (event.type === "status") {
          setGithub((prev) => ({
            ...prev,
            statuses: [...prev.statuses, event.text],
          }));
        } else if (event.type === "result") {
          gotResult = true;
          setGithub((prev) => ({
            ...prev,
            result: event.data,
            extractedAt: event.extractedAt,
          }));
        } else if (event.type === "extraction_failed") {
          softMessage = event.message;
        } else if (event.type === "done") {
          setGithub((prev) => ({
            ...prev,
            status: gotResult ? "done" : "soft_failed",
            softMessage: gotResult
              ? undefined
              : softMessage ??
                "Couldn't pull enough from your GitHub. Your usage wasn't affected.",
          }));
          if (gotResult) void refreshLimits();
        } else if (event.type === "error") {
          setGithub((prev) => ({
            ...prev,
            status: "error",
            error: event.message,
          }));
        }
      }
    } catch (err) {
      setGithub((prev) => ({
        ...prev,
        status: "error",
        error: err instanceof Error ? err.message : String(err),
      }));
    }
  }

  async function runDiscovery() {
    const sources: { source: string; data: Findings }[] = [];
    if (resume.result) {
      sources.push({
        source: resume.filename ? `resume: ${resume.filename}` : "resume",
        data: resume.result,
      });
    }
    if (github.result) {
      sources.push({
        source: githubLogin ? `GitHub: ${githubLogin}` : "GitHub",
        data: github.result,
      });
    }
    for (const u of urls) {
      if (u.result) {
        sources.push({
          source: `personal URL: ${u.inputUrl}`,
          data: u.result,
        });
      }
    }
    if (sources.length === 0) {
      setDiscoveryError(
        "Connect at least one source with extracted findings first."
      );
      return;
    }

    setDiscoveryLoading(true);
    setDiscoveryError(undefined);
    setDiscoveryLimit(undefined);
    setDiscoverySoftFail(undefined);
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
        if (res.status === 502) {
          try {
            const body = (await res.clone().json()) as {
              error?: string;
              message?: string;
            };
            if (body.error === "discovery_failed" && body.message) {
              setDiscoverySoftFail(body.message);
              return;
            }
          } catch {
            /* fall through */
          }
        }
        const text = await res.text();
        setDiscoveryError(`${res.status}: ${text}`);
        return;
      }
      const data = (await res.json()) as Inventory;
      setInventory(data);
      void refreshLimits();
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

  async function runGeneration(items: InventoryItem[]) {
    if (!inventory) return;
    setGenerating(true);
    setGenerationError(undefined);
    setGenerationStatuses(["Spinning up the portfolio agent..."]);

    const contact: { website?: string; github?: string; linkedin?: string } =
      {};
    if (urls[0]?.inputUrl) contact.website = urls[0].inputUrl;
    const allLinks = [
      ...(resume.result?.notableLinks ?? []),
      ...(github.result?.notableLinks ?? []),
      ...urls.flatMap((u) => u.result?.notableLinks ?? []),
    ];
    if (!contact.github && githubLogin) {
      contact.github = `https://github.com/${githubLogin}`;
    }
    for (const link of allLinks) {
      const u = link.url.toLowerCase();
      if (!contact.github && u.includes("github.com")) contact.github = link.url;
      if (!contact.linkedin && u.includes("linkedin.com"))
        contact.linkedin = link.url;
    }

    const candidateName =
      resume.result?.title ||
      github.result?.title ||
      urls.find((u) => u.result?.title)?.result?.title ||
      undefined;

    try {
      const res = await fetch("/api/generate-portfolio", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          inventory: { ...inventory, items },
          user: { name: candidateName, contact },
        }),
      });
      if (!res.ok) {
        const limited = await parseRateLimit(res);
        if (limited) {
          setGenerationError(limited.message);
          return;
        }
        const text = await res.text();
        setGenerationError(`${res.status}: ${text}`);
        return;
      }

      let complete:
        | {
            files: { path: string; content: string }[];
            previewHtml: string;
            content: unknown;
            summary?: string;
            meta: { name: string; title: string };
          }
        | null = null;

      if (!res.body) {
        setGenerationError("No response body from agent.");
        return;
      }
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
            const text = String(evt.text);
            setGenerationStatuses((prev) => [...prev, text]);
          } else if (evt.type === "file_complete") {
            const path = String(evt.path);
            setGenerationStatuses((prev) => [...prev, `Wrote ${path}`]);
          } else if (evt.type === "complete") {
            complete = evt.data as typeof complete;
          } else if (evt.type === "error") {
            setGenerationError(String(evt.message));
          }
        }
      }

      if (complete) {
        try {
          sessionStorage.setItem(
            GENERATED_STORAGE_KEY,
            JSON.stringify(complete)
          );
        } catch (err) {
          console.warn("[connector-grid] sessionStorage failed:", err);
        }
        void refreshLimits();
        router.push("/preview");
      }
    } catch (err) {
      setGenerationError(err instanceof Error ? err.message : String(err));
    } finally {
      setGenerating(false);
    }
  }

  // The "primary" URL slot rendered inside the URL card when count <= 1.
  const primaryUrl = urls.length === 1 ? urls[0] : undefined;
  const promotedUrls = urls.length >= 2 ? urls : [];

  return (
    <div>
      <ul className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* GitHub: real OAuth + MCP */}
        <li
          className={`relative rounded-2xl border bg-card p-7 transition-all ${
            github.status === "done"
              ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
              : isInProgress(github)
                ? "border-accent/50"
                : "border-border hover:border-accent/30"
          }`}
        >
          <CardHeader
            Icon={Github}
            label="GitHub"
            connected={github.status === "done"}
            inProgress={isInProgress(github)}
            filename={githubConnected ? githubLogin : undefined}
            extractedAt={github.extractedAt}
          />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            We&rsquo;ll list your repos and read READMEs through the official
            GitHub MCP server.
          </p>
          <RemainingRow snap={limits.extractGithub} />
          {/* Three states: brand-new (no login, no token), previously
              connected (login persisted but token gone after sign-out), and
              live-connected. The middle state is the one that used to look
              like a brand-new user even though we already had findings.
              On GitHub specifically, Disconnect is the canonical "wipe
              everything" affordance — it now also clears the saved findings
              + persisted login, so a separate Clear button is redundant. */}
          {!githubConnected && !githubLogin && !github.result && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <form action={connectGitHub}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
                >
                  Connect GitHub
                  <ArrowUpRight className="size-3" />
                </button>
              </form>
            </div>
          )}
          {!githubConnected && (githubLogin || github.result) && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <form action={connectGitHub}>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40"
                >
                  Reconnect to refresh
                </button>
              </form>
              <form action={disconnectGitHub}>
                <button
                  type="submit"
                  className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
                >
                  Disconnect
                </button>
              </form>
            </div>
          )}
          {githubConnected && github.status !== "done" && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runGithubExtract}
                disabled={isInProgress(github)}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {isInProgress(github) ? "Extracting..." : "Extract from GitHub"}
                {!isInProgress(github) && <ArrowRight className="size-3" />}
              </button>
              <form action={disconnectGitHub}>
                <button
                  type="submit"
                  className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
                >
                  Disconnect
                </button>
              </form>
            </div>
          )}
          {githubConnected && github.status === "done" && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={runGithubExtract}
                disabled={isInProgress(github)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40 disabled:opacity-50"
              >
                Re-extract
              </button>
              <form action={disconnectGitHub}>
                <button
                  type="submit"
                  className="text-[11px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
                >
                  Disconnect
                </button>
              </form>
            </div>
          )}
          <NarrationPanel statuses={github.statuses} />
          {github.result && <FindingsView data={github.result} />}
          {github.status === "limited" && github.rateLimit && (
            <LimitedRow message={github.rateLimit.message} />
          )}
          {github.status === "soft_failed" && github.softMessage && (
            <SoftFailRow message={github.softMessage} />
          )}
          {github.error && <ErrorRow message={github.error} />}
          {githubConfigError && (
            <ErrorRow message="GitHub OAuth isn't configured. Set AUTH_GITHUB_ID and AUTH_GITHUB_SECRET in .env.local (and Vercel envs), then restart the dev server." />
          )}
        </li>

        {/* Resume: real Blob upload + extract */}
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
            extractedAt={resume.extractedAt}
          />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Upload your resume PDF. We&rsquo;ll read it like a recruiter would.
          </p>
          <RemainingRow snap={limits.extractResume} />
          <div className="mt-6 flex flex-wrap items-center gap-2">
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
            {resume.status === "done" && resume.blobUrl && (
              <>
                <button
                  type="button"
                  onClick={reExtractResume}
                  disabled={isInProgress(resume)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40 disabled:opacity-50"
                >
                  Re-extract
                </button>
                <button
                  type="button"
                  onClick={removeResumeArtifact}
                  className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
              </>
            )}
          </div>
          <NarrationPanel statuses={resume.statuses} />
          {resume.result && <FindingsView data={resume.result} />}
          {resume.status === "limited" && resume.rateLimit && (
            <LimitedRow message={resume.rateLimit.message} />
          )}
          {resume.status === "soft_failed" && resume.softMessage && (
            <SoftFailRow message={resume.softMessage} />
          )}
          {resume.error && <ErrorRow message={resume.error} />}
        </li>

        {/* Personal URL */}
        <li
          className={`relative rounded-2xl border bg-card p-7 transition-all ${
            primaryUrl?.status === "done"
              ? "border-accent shadow-[0_18px_40px_-24px_rgba(61,45,79,0.4)]"
              : primaryUrl && isInProgress(primaryUrl)
                ? "border-accent/50"
                : "border-border hover:border-accent/30"
          }`}
        >
          <CardHeader
            Icon={Globe}
            label={promotedUrls.length > 0 ? "Personal URLs" : "Personal URL"}
            connected={primaryUrl?.status === "done"}
            inProgress={primaryUrl ? isInProgress(primaryUrl) : false}
            filename={
              promotedUrls.length > 0
                ? `${urls.length} saved`
                : primaryUrl?.inputUrl?.replace(/^https?:\/\//, "")
            }
            extractedAt={primaryUrl?.extractedAt}
          />
          <p className="mt-5 text-sm leading-relaxed text-muted">
            Blog, Devpost, personal site, anything public.
          </p>
          <RemainingRow snap={limits.extractUrl} />

          {/* Input field — visible when no URLs yet, or when user explicitly
              opens "Add another URL". When 2+ exist the list section owns
              the input instead. */}
          {showUrlInput && promotedUrls.length === 0 && (
            <div className="mt-6 flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewUrl();
                }}
                placeholder="you.dev"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none disabled:opacity-50"
              />
              <button
                type="button"
                onClick={submitNewUrl}
                disabled={!urlInput.trim()}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Plus className="size-3" />
                Add
              </button>
              {urls.length === 1 && (
                <button
                  type="button"
                  onClick={() => {
                    setShowUrlInput(false);
                    setUrlInput("");
                  }}
                  className="text-muted hover:text-foreground"
                  aria-label="Cancel"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          )}

          {/* Single saved URL view (the in-card "stacked row" mode). */}
          {primaryUrl && (
            <div className="mt-6">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => reExtractUrl(primaryUrl)}
                  disabled={isInProgress(primaryUrl)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40 disabled:opacity-50"
                >
                  Re-extract
                </button>
                <button
                  type="button"
                  onClick={() => removeUrlSlot(primaryUrl)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
                >
                  <Trash2 className="size-3" />
                  Clear
                </button>
                {!showUrlInput && (
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(true)}
                    className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.16em] text-accent hover:opacity-80 transition-opacity"
                  >
                    <Plus className="size-3" />
                    Add another URL
                  </button>
                )}
              </div>
              <NarrationPanel statuses={primaryUrl.statuses} />
              {primaryUrl.result && <FindingsView data={primaryUrl.result} />}
              {primaryUrl.status === "limited" && primaryUrl.rateLimit && (
                <LimitedRow message={primaryUrl.rateLimit.message} />
              )}
              {primaryUrl.status === "soft_failed" && primaryUrl.softMessage && (
                <SoftFailRow message={primaryUrl.softMessage} />
              )}
              {primaryUrl.error && <ErrorRow message={primaryUrl.error} />}
            </div>
          )}

          {/* Promoted-list mode: card body becomes a small "Add a URL" form;
              the list lives in its own section below the grid. */}
          {promotedUrls.length > 0 && (
            <div className="mt-6 flex items-center gap-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") submitNewUrl();
                }}
                placeholder="add another URL"
                className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted/70 focus:border-accent focus:outline-none"
              />
              <button
                type="button"
                onClick={submitNewUrl}
                disabled={!urlInput.trim()}
                className="inline-flex items-center gap-1 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                <Plus className="size-3" />
                Add
              </button>
            </div>
          )}
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

      {promotedUrls.length > 0 && (
        <UrlListSection
          urls={promotedUrls}
          onReExtract={reExtractUrl}
          onRemove={removeUrlSlot}
        />
      )}

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
        {limits.discover && (
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70">
            {limits.discover.bypass
              ? "Unlimited (dev)"
              : `${limits.discover.remaining} of ${limits.discover.max} discovery runs left today`}
          </p>
        )}
        {discoveryLimit && (
          <div className="mt-3 max-w-md">
            <LimitedRow message={discoveryLimit.message} />
          </div>
        )}
        {discoverySoftFail && (
          <div className="mt-3 max-w-md">
            <SoftFailRow message={discoverySoftFail} />
          </div>
        )}
      </div>

      <div id="inventory">
        <InventoryPanel
          loading={discoveryLoading}
          inventory={inventory}
          error={discoveryError}
          onGenerate={runGeneration}
          generating={generating}
          generateRemaining={limits.generate}
          generationStatuses={generationStatuses}
          generationError={generationError}
        />
      </div>
    </div>
  );
}

function UrlListSection({
  urls,
  onReExtract,
  onRemove,
}: {
  urls: UrlSlot[];
  onReExtract: (slot: UrlSlot) => void;
  onRemove: (slot: UrlSlot) => void;
}) {
  return (
    <section className="mt-10">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="font-serif text-2xl text-foreground">
          Saved <span className="italic">URLs</span>
        </h2>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          {urls.length} sources
        </p>
      </header>
      <ul className="grid grid-cols-1 gap-4">
        {urls.map((u) => (
          <li
            key={u.id}
            className={`rounded-2xl border bg-card p-6 transition-all ${
              u.status === "done"
                ? "border-accent/30"
                : isInProgress(u)
                  ? "border-accent/50"
                  : "border-border"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-mono text-[11px] uppercase tracking-[0.16em] text-muted">
                  {u.inputUrl.replace(/^https?:\/\//, "")}
                </p>
                {u.result?.tagline && (
                  <p className="mt-2 font-serif text-lg leading-snug text-foreground">
                    {u.result.tagline}
                  </p>
                )}
                {u.extractedAt && (
                  <p className="mt-2 text-[11px] text-muted/70">
                    Extracted {formatRelative(u.extractedAt)}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onReExtract(u)}
                  disabled={isInProgress(u)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-foreground transition-all hover:border-accent/40 disabled:opacity-50"
                >
                  {isInProgress(u) ? "Working..." : "Re-extract"}
                </button>
                <button
                  type="button"
                  onClick={() => onRemove(u)}
                  className="inline-flex items-center gap-1 text-[11px] font-mono uppercase tracking-[0.16em] text-muted hover:text-foreground transition-colors"
                >
                  <Trash2 className="size-3" />
                  Remove
                </button>
              </div>
            </div>
            <NarrationPanel statuses={u.statuses} />
            {u.result && <FindingsView data={u.result} />}
            {u.status === "limited" && u.rateLimit && (
              <LimitedRow message={u.rateLimit.message} />
            )}
            {u.status === "soft_failed" && u.softMessage && (
              <SoftFailRow message={u.softMessage} />
            )}
            {u.error && <ErrorRow message={u.error} />}
          </li>
        ))}
      </ul>
    </section>
  );
}

function isInProgress(s: SourceState) {
  return s.status === "uploading" || s.status === "extracting";
}

function formatRelative(iso: string): string {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return "recently";
  const diffSec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (diffSec < 60) return "just now";
  const min = Math.floor(diffSec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const d = Math.floor(hr / 24);
  return `${d}d ago`;
}

function CardHeader({
  Icon,
  label,
  connected,
  inProgress,
  comingSoon,
  filename,
  extractedAt,
}: {
  Icon: typeof Github;
  label: string;
  connected?: boolean;
  inProgress?: boolean;
  comingSoon?: boolean;
  filename?: string;
  extractedAt?: string;
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
              {extractedAt ? `Extracted ${formatRelative(extractedAt)}` : "Connected"}
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

function RemainingRow({
  snap,
}: {
  snap?: { remaining: number; max: number; bypass?: boolean };
}) {
  if (!snap) return null;
  return (
    <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted/70">
      {snap.bypass
        ? "Unlimited (dev)"
        : `${snap.remaining} of ${snap.max} left today`}
    </p>
  );
}

function SoftFailRow({ message }: { message: string }) {
  return (
    <div className="mt-4 rounded-md border border-border bg-background p-3.5 text-[13px] leading-relaxed text-foreground">
      <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
        That didn&rsquo;t work
      </p>
      <p className="text-muted">{message}</p>
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
