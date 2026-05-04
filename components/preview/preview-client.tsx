"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Download,
  FileText,
  Loader2,
  X,
} from "lucide-react";
import { ScoutMark } from "@/components/scout-mark";

type GeneratedFile = { path: string; content: string };

type Generated = {
  files: GeneratedFile[];
  previewHtml: string;
  meta: { name: string; title: string };
};

type Mode = "preview" | "code";

const STORAGE_KEY = "scoutfolio.generated.v1";

export function PreviewClient() {
  const router = useRouter();
  const [data, setData] = useState<Generated | null>(null);
  const [mode, setMode] = useState<Mode>("preview");
  const [selectedPath, setSelectedPath] = useState<string>("app/page.tsx");
  const [exportOpen, setExportOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    // Read the generation result from sessionStorage. This is a one-shot read
    // on mount, not an external-store subscription, so the standard
    // useEffect-with-setState pattern is the right tool.
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (!raw) {
        router.replace("/connect");
        return;
      }
      const parsed = JSON.parse(raw) as Generated;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setData(parsed);
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
            <span className="font-medium text-sm text-foreground">
              {data.meta.name}
            </span>
          </div>

          <div className="hidden md:flex">
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          <div className="flex items-center gap-3">
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

      <div className="flex-1">
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
