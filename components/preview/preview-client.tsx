"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  Send,
  Undo2,
  X,
} from "lucide-react";
import { ScoutMark } from "@/components/scout-mark";
import type { PortfolioContent } from "@/lib/portfolio-scaffold/compose";

type GeneratedFile = { path: string; content: string };

type Generated = {
  files: GeneratedFile[];
  previewHtml: string;
  content: PortfolioContent;
  meta: { name: string; title: string };
  summary?: string;
};

type Mode = "preview" | "code";

type ChatMsg =
  | { id: string; kind: "user"; text: string }
  | { id: string; kind: "assistant"; text: string }
  | { id: string; kind: "status"; text: string }
  | { id: string; kind: "error"; text: string }
  | { id: string; kind: "notice"; text: string };

const STORAGE_KEY = "scoutfolio.generated.v2";
const UNDO_CAP = 5;
const HISTORY_PAIRS = 6;
const MESSAGE_MAX = 500;

let messageIdCounter = 0;
function nextMessageId(): string {
  messageIdCounter += 1;
  return `msg-${messageIdCounter}`;
}

export function PreviewClient() {
  const router = useRouter();
  const [data, setData] = useState<Generated | null>(null);
  const [mode, setMode] = useState<Mode>("preview");
  const [selectedPath, setSelectedPath] = useState<string>("app/page.tsx");
  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [undoStack, setUndoStack] = useState<Generated[]>([]);
  const [sending, setSending] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace("/connect");
        return;
      }
      const parsed = JSON.parse(raw) as Generated;
      if (!parsed.content) {
        // v1 payload without content; can't edit. Force user to regenerate.
        sessionStorage.removeItem(STORAGE_KEY);
        router.replace("/connect");
        return;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(parsed);
      if (parsed.summary) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMessages([
          {
            id: nextMessageId(),
            kind: "assistant",
            text: parsed.summary,
          },
        ]);
      }
    } catch {
      router.replace("/connect");
    }
  }, [router]);

  const fileTree = useMemo(() => {
    if (!data) return [];
    return buildTree(data.files);
  }, [data]);

  const selectedFile = useMemo(() => {
    if (!data) return undefined;
    return data.files.find((f) => f.path === selectedPath);
  }, [data, selectedPath]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!data || sending) return;
      const trimmed = text.trim();
      if (!trimmed) return;

      setSending(true);
      setMessages((prev) => [
        ...prev,
        { id: nextMessageId(), kind: "user", text: trimmed },
      ]);

      // Build history from chat messages; only user/assistant turns, capped.
      const history = messages
        .filter(
          (m): m is Extract<ChatMsg, { kind: "user" | "assistant" }> =>
            m.kind === "user" || m.kind === "assistant"
        )
        .slice(-(HISTORY_PAIRS * 2))
        .map((m) => ({
          role: m.kind === "user" ? ("user" as const) : ("assistant" as const),
          text: m.text,
        }));

      try {
        const res = await fetch("/api/edit-portfolio", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history,
            meta: { slug: data.meta.name, title: data.meta.title },
            currentContent: data.content,
          }),
        });

        if (res.status === 429) {
          let msg = "Edit limit reached.";
          try {
            const body = await res.json();
            if (body.message) msg = body.message;
          } catch {}
          setMessages((prev) => [
            ...prev,
            { id: nextMessageId(), kind: "error", text: msg },
          ]);
          return;
        }
        if (!res.ok) {
          const body = await res.text();
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId(),
              kind: "error",
              text: `Request failed (${res.status}): ${body.slice(0, 240)}`,
            },
          ]);
          return;
        }
        if (!res.body) {
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId(),
              kind: "error",
              text: "No response body from agent.",
            },
          ]);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let updated: Generated | null = null;
        let agentSummary: string | undefined;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";
          for (const line of lines) {
            const t = line.trim();
            if (!t) continue;
            let evt: { type: string; [k: string]: unknown };
            try {
              evt = JSON.parse(t);
            } catch {
              continue;
            }
            if (evt.type === "status") {
              setMessages((prev) => [
                ...prev,
                {
                  id: nextMessageId(),
                  kind: "status",
                  text: String(evt.text),
                },
              ]);
            } else if (evt.type === "no_op") {
              setMessages((prev) => [
                ...prev,
                {
                  id: nextMessageId(),
                  kind: "notice",
                  text: String(evt.message),
                },
              ]);
            } else if (evt.type === "error") {
              setMessages((prev) => [
                ...prev,
                {
                  id: nextMessageId(),
                  kind: "error",
                  text: String(evt.message),
                },
              ]);
            } else if (evt.type === "complete") {
              const completePayload = evt.data as Generated;
              updated = completePayload;
              agentSummary = completePayload.summary;
            }
          }
        }

        if (updated) {
          const next = updated;
          setUndoStack((stack) => [...stack, data].slice(-UNDO_CAP));
          setData(next);
          try {
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
          } catch (err) {
            console.warn("[preview] sessionStorage write failed:", err);
          }
          setMessages((prev) => [
            ...prev,
            {
              id: nextMessageId(),
              kind: "assistant",
              text: agentSummary ?? "Done.",
            },
          ]);
        }
      } catch (err) {
        setMessages((prev) => [
          ...prev,
          {
            id: nextMessageId(),
            kind: "error",
            text: err instanceof Error ? err.message : String(err),
          },
        ]);
      } finally {
        setSending(false);
      }
    },
    [data, sending, messages]
  );

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setUndoStack((stack) => stack.slice(0, -1));
    setData(prev);
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prev));
    } catch (err) {
      console.warn("[preview] sessionStorage write failed:", err);
    }
    setMessages((m) => [
      ...m,
      {
        id: nextMessageId(),
        kind: "notice",
        text: "Reverted to previous version.",
      },
    ]);
  }, [undoStack]);

  if (!data) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted">
          <Loader2 className="size-4 animate-spin" />
          <p className="text-sm">Loading preview&hellip;</p>
        </div>
      </div>
    );
  }

  async function handleDownload() {
    if (!data) return;
    setDownloading(true);
    try {
      const res = await fetch("/api/export-zip", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          files: data.files,
          projectName: data.meta.name,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Export failed (${res.status}): ${text}`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = `${data.meta.name}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      setExportOpen(false);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : "Download failed");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-5">
          <div className="flex items-center gap-3">
            <Link
              href="/connect"
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
              aria-label="Back to connect"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <ScoutMark className="size-4 text-accent" />
            <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted">
              Preview
            </span>
            <span className="text-sm font-medium text-foreground">
              {data.meta.name}
            </span>
          </div>

          <div className="hidden md:flex">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setChatOpen((o) => !o)}
              className="inline-flex size-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground lg:hidden"
              aria-label="Toggle chat"
            >
              <MessageSquare className="size-4" />
            </button>
            <span className="hidden font-mono text-[11px] text-muted sm:inline">
              {data.files.length} files
            </span>
            <button
              type="button"
              onClick={() => setExportOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90"
            >
              <Download className="size-3" />
              Export
            </button>
          </div>
        </div>
        <div className="flex justify-center pb-3 md:hidden">
          <ModeToggle mode={mode} onChange={setMode} />
        </div>
      </header>

      <div className="flex flex-1 flex-col lg:grid lg:grid-cols-[360px_1fr]">
        <ChatPanel
          messages={messages}
          sending={sending}
          canUndo={undoStack.length > 0}
          onSend={handleSend}
          onUndo={handleUndo}
          openOnMobile={chatOpen}
          onCloseMobile={() => setChatOpen(false)}
        />

        <div className="min-h-0 flex-1">
          {mode === "preview" ? (
            <PreviewFrame html={data.previewHtml} />
          ) : (
            <CodeView
              files={data.files}
              tree={fileTree}
              selectedPath={selectedPath}
              onSelect={setSelectedPath}
              selected={selectedFile}
            />
          )}
        </div>
      </div>

      {exportOpen && (
        <ExportModal
          onCancel={() => (downloading ? null : setExportOpen(false))}
          onDownload={handleDownload}
          downloading={downloading}
        />
      )}
    </div>
  );
}

function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (m: Mode) => void;
}) {
  return (
    <div className="inline-flex rounded-full border border-border p-0.5 text-[11px] font-medium uppercase tracking-wider">
      {(["preview", "code"] as const).map((m) => {
        const active = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => onChange(m)}
            className={`rounded-full px-4 py-1 transition-all ${
              active
                ? "bg-accent/10 text-accent"
                : "text-muted hover:text-foreground"
            }`}
          >
            {m}
          </button>
        );
      })}
    </div>
  );
}

function PreviewFrame({ html }: { html: string }) {
  return (
    <iframe
      title="Portfolio preview"
      sandbox="allow-scripts allow-same-origin"
      srcDoc={html}
      className="h-[calc(100dvh-3.5rem)] w-full border-0 bg-white"
    />
  );
}

// ---------------------------------------------------------------------------
// Chat panel
// ---------------------------------------------------------------------------

function ChatPanel({
  messages,
  sending,
  canUndo,
  onSend,
  onUndo,
  openOnMobile,
  onCloseMobile,
}: {
  messages: ChatMsg[];
  sending: boolean;
  canUndo: boolean;
  onSend: (text: string) => void;
  onUndo: () => void;
  openOnMobile: boolean;
  onCloseMobile: () => void;
}) {
  const visibleClass = openOnMobile
    ? "fixed inset-0 z-30 flex flex-col bg-background lg:static lg:z-auto"
    : "hidden lg:flex lg:flex-col";

  return (
    <aside
      className={`${visibleClass} h-[calc(100dvh-3.5rem)] border-r border-border bg-card/40 lg:h-[calc(100dvh-3.5rem)]`}
    >
      <div className="flex items-center justify-between border-b border-border px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-accent">
            &sect; chat
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            Refine your portfolio
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-muted"
            title={canUndo ? "Undo last edit" : "Nothing to undo"}
          >
            <Undo2 className="size-3" />
            Undo
          </button>
          <button
            type="button"
            onClick={onCloseMobile}
            className="inline-flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground lg:hidden"
            aria-label="Close chat"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </div>

      <MessageList messages={messages} sending={sending} />

      <ChatInput onSend={onSend} disabled={sending} />
    </aside>
  );
}

function MessageList({
  messages,
  sending,
}: {
  messages: ChatMsg[];
  sending: boolean;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-5">
      {messages.length === 0 && !sending ? (
        <EmptyChat />
      ) : (
        <ul className="flex flex-col gap-3">
          {messages.map((m) => (
            <li key={m.id}>{renderMessage(m)}</li>
          ))}
          {sending && (
            <li>
              <div className="flex items-center gap-2 px-1 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                <Loader2 className="size-3 animate-spin" />
                Thinking
              </div>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function renderMessage(m: ChatMsg) {
  if (m.kind === "user") {
    return (
      <div className="ml-6 rounded-2xl rounded-tr-sm bg-accent px-4 py-2.5 text-[13px] leading-relaxed text-accent-foreground">
        {m.text}
      </div>
    );
  }
  if (m.kind === "assistant") {
    return (
      <div className="mr-6 rounded-2xl rounded-tl-sm border border-border bg-background px-4 py-2.5 text-[13px] leading-relaxed text-foreground">
        {m.text}
      </div>
    );
  }
  if (m.kind === "status") {
    return (
      <div className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        &middot; {m.text}
      </div>
    );
  }
  if (m.kind === "notice") {
    return (
      <div className="rounded-md border border-accent/30 bg-accent/5 px-3 py-2 text-[12px] leading-relaxed text-accent">
        {m.text}
      </div>
    );
  }
  return (
    <div className="rounded-md border border-red-300/40 bg-red-50/50 px-3 py-2 text-[12px] leading-relaxed text-red-700">
      {m.text}
    </div>
  );
}

function EmptyChat() {
  return (
    <div className="flex h-full flex-col justify-end gap-4">
      <div className="text-[13px] leading-relaxed text-muted">
        Ask the agent to refine the portfolio. A few starters:
      </div>
      <ul className="flex flex-col gap-2">
        {[
          "Make the tagline punchier and emphasize 'shipping'.",
          "Reorder the projects so the financial app is first.",
          "Tighten the about section to two paragraphs.",
          "Add 'open source' to my focus areas.",
        ].map((s) => (
          <li
            key={s}
            className="rounded-md border border-border bg-background/60 px-3 py-2 text-[12px] leading-relaxed text-foreground/80"
          >
            {s}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChatInput({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const t = draft.trim();
    if (!t || disabled) return;
    onSend(t);
    setDraft("");
    ref.current?.focus();
  }

  return (
    <div className="border-t border-border bg-card/60 px-4 py-3">
      <div className="rounded-2xl border border-border bg-background px-3 py-2 transition-colors focus-within:border-accent/50">
        <textarea
          ref={ref}
          value={draft}
          onChange={(e) => setDraft(e.target.value.slice(0, MESSAGE_MAX))}
          onKeyDown={(e) => {
            if (
              e.key === "Enter" &&
              (e.metaKey || e.ctrlKey || !e.shiftKey)
            ) {
              e.preventDefault();
              submit();
            }
          }}
          rows={3}
          disabled={disabled}
          placeholder="Tell the agent what to change..."
          className="block w-full resize-none bg-transparent text-[13px] leading-relaxed text-foreground placeholder:text-muted focus:outline-none disabled:opacity-60"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {draft.length}/{MESSAGE_MAX} &middot; Enter to send
          </span>
          <button
            type="button"
            onClick={submit}
            disabled={disabled || draft.trim().length === 0}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-[11px] font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {disabled ? (
              <Loader2 className="size-3 animate-spin" />
            ) : (
              <Send className="size-3" />
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// File tree + code view (unchanged)
// ---------------------------------------------------------------------------

type TreeNode =
  | { type: "file"; path: string; name: string }
  | { type: "dir"; name: string; children: TreeNode[] };

function buildTree(files: GeneratedFile[]): TreeNode[] {
  const root: TreeNode[] = [];
  for (const f of files) {
    const parts = f.path.split("/");
    let current = root;
    for (let i = 0; i < parts.length; i++) {
      const name = parts[i];
      const isLast = i === parts.length - 1;
      if (isLast) {
        current.push({ type: "file", path: f.path, name });
      } else {
        let dir = current.find(
          (n) => n.type === "dir" && n.name === name
        ) as Extract<TreeNode, { type: "dir" }> | undefined;
        if (!dir) {
          dir = { type: "dir", name, children: [] };
          current.push(dir);
        }
        current = dir.children;
      }
    }
  }
  const sort = (nodes: TreeNode[]): TreeNode[] => {
    const dirs = nodes
      .filter((n) => n.type === "dir")
      .sort((a, b) => a.name.localeCompare(b.name));
    const filesOnly = nodes
      .filter((n) => n.type === "file")
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const d of dirs) {
      if (d.type === "dir") d.children = sort(d.children);
    }
    return [...dirs, ...filesOnly];
  };
  return sort(root);
}

function CodeView({
  tree,
  selectedPath,
  onSelect,
  selected,
}: {
  files: GeneratedFile[];
  tree: TreeNode[];
  selectedPath: string;
  onSelect: (p: string) => void;
  selected?: GeneratedFile;
}) {
  return (
    <div className="grid h-[calc(100dvh-3.5rem)] grid-cols-[260px_1fr]">
      <aside className="overflow-y-auto border-r border-border bg-card/60 px-3 py-4">
        <p className="mb-2 px-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Files
        </p>
        <ul className="text-sm">
          {tree.map((node) => (
            <TreeRow
              key={nodeKey(node)}
              node={node}
              depth={0}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      </aside>
      <div className="flex min-w-0 flex-col">
        <div className="flex h-9 items-center gap-2 border-b border-border bg-background px-4">
          <FileText className="size-3.5 text-muted" />
          <span className="font-mono text-[11px] text-muted">
            {selected?.path ?? "Select a file"}
          </span>
        </div>
        <div className="min-h-0 flex-1 overflow-auto bg-background">
          {selected ? (
            <pre className="px-5 py-4 font-mono text-[12px] leading-[1.65] text-foreground">
              <code>{selected.content}</code>
            </pre>
          ) : (
            <p className="p-6 text-sm text-muted">
              Pick a file from the tree.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function nodeKey(node: TreeNode): string {
  return node.type === "file" ? node.path : `dir:${node.name}`;
}

function TreeRow({
  node,
  depth,
  selectedPath,
  onSelect,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string;
  onSelect: (p: string) => void;
}) {
  const [open, setOpen] = useState(true);

  if (node.type === "file") {
    const active = selectedPath === node.path;
    return (
      <li>
        <button
          type="button"
          onClick={() => onSelect(node.path)}
          style={{ paddingLeft: 12 + depth * 14 }}
          className={`flex w-full items-center gap-2 rounded-md py-1 pr-2 text-left text-[13px] transition-colors ${
            active
              ? "bg-accent/10 text-accent"
              : "text-foreground hover:bg-foreground/[0.04]"
          }`}
        >
          <FileText className="size-3 shrink-0 text-muted" />
          <span className="truncate">{node.name}</span>
        </button>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        style={{ paddingLeft: 12 + depth * 14 }}
        className="flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left text-[13px] text-muted transition-colors hover:bg-foreground/[0.04]"
      >
        {open ? (
          <ChevronDown className="size-3" />
        ) : (
          <ChevronRight className="size-3" />
        )}
        <span className="truncate font-medium">{node.name}</span>
      </button>
      {open && (
        <ul>
          {node.children.map((child) => (
            <TreeRow
              key={nodeKey(child)}
              node={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function ExportModal({
  onCancel,
  onDownload,
  downloading,
}: {
  onCancel: () => void;
  onDownload: () => void;
  downloading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 px-4"
      onClick={onCancel}
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-border bg-card p-7 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.45)]"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Close"
          className="absolute right-4 top-4 inline-flex size-7 items-center justify-center rounded-full text-muted transition-colors hover:bg-foreground/[0.04] hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
        <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
          Export
        </p>
        <h2 className="mt-2 font-serif text-2xl tracking-tight text-foreground">
          Download your portfolio
        </h2>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This zip contains a Next.js project generated from the inventory you
          just reviewed. Nothing else. The code is yours to modify, deploy
          anywhere, no attribution required.
        </p>
        <div className="mt-6 flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={onCancel}
            className="text-xs font-medium text-muted transition-colors hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDownload}
            disabled={downloading}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2 text-xs font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Packaging
              </>
            ) : (
              <>
                <Download className="size-3" />
                Download
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
