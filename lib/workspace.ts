import { Redis } from "@upstash/redis";
import type { Findings } from "@/lib/extract-client";
import { canonicalizeUrl as canonicalize } from "@/lib/canonical";

const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
const token =
  process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;

const redis = url && token ? new Redis({ url, token }) : null;

const PREFIX = "scoutfolio:workspace:";
const SCHEMA_VERSION = 1;

export type ResumeArtifact = {
  findings: Findings;
  filename: string;
  blobUrl: string;
  extractedAt: string;
};

export type GithubArtifact = {
  findings: Findings;
  githubLogin: string;
  extractedAt: string;
};

export type UrlArtifact = {
  id: string;
  url: string;
  canonical: string;
  findings: Findings;
  extractedAt: string;
};

export type Workspace = {
  v: number;
  resume?: ResumeArtifact;
  github?: GithubArtifact;
  urls: UrlArtifact[];
};

const EMPTY: Workspace = { v: SCHEMA_VERSION, urls: [] };

function key(email: string) {
  return `${PREFIX}${email.toLowerCase()}`;
}

export const canonicalizeUrl = canonicalize;

export async function getWorkspace(email: string): Promise<Workspace> {
  if (!redis || !email) return { ...EMPTY };
  try {
    const stored = (await redis.get(key(email))) as Workspace | null;
    if (!stored) return { ...EMPTY };
    return {
      v: SCHEMA_VERSION,
      resume: stored.resume,
      github: stored.github,
      urls: Array.isArray(stored.urls) ? stored.urls : [],
    };
  } catch (err) {
    console.warn("[workspace] get failed:", err);
    return { ...EMPTY };
  }
}

async function writeWorkspace(email: string, ws: Workspace): Promise<void> {
  if (!redis || !email) return;
  try {
    await redis.set(key(email), ws);
  } catch (err) {
    console.warn("[workspace] write failed:", err);
  }
}

export async function setResume(
  email: string,
  artifact: ResumeArtifact
): Promise<Workspace> {
  const ws = await getWorkspace(email);
  ws.resume = artifact;
  await writeWorkspace(email, ws);
  return ws;
}

export async function setGithub(
  email: string,
  artifact: GithubArtifact
): Promise<Workspace> {
  const ws = await getWorkspace(email);
  ws.github = artifact;
  await writeWorkspace(email, ws);
  return ws;
}

export async function upsertUrl(
  email: string,
  artifact: Omit<UrlArtifact, "id" | "canonical"> & { canonical?: string }
): Promise<{ workspace: Workspace; entry: UrlArtifact }> {
  const ws = await getWorkspace(email);
  const canonical = artifact.canonical ?? canonicalizeUrl(artifact.url);
  const existingIndex = ws.urls.findIndex((u) => u.canonical === canonical);
  let entry: UrlArtifact;
  if (existingIndex >= 0) {
    entry = {
      ...ws.urls[existingIndex],
      url: artifact.url,
      findings: artifact.findings,
      extractedAt: artifact.extractedAt,
      canonical,
    };
    ws.urls[existingIndex] = entry;
  } else {
    entry = {
      id: cryptoId(),
      url: artifact.url,
      canonical,
      findings: artifact.findings,
      extractedAt: artifact.extractedAt,
    };
    ws.urls.push(entry);
  }
  await writeWorkspace(email, ws);
  return { workspace: ws, entry };
}

export async function removeResume(email: string): Promise<Workspace> {
  const ws = await getWorkspace(email);
  delete ws.resume;
  await writeWorkspace(email, ws);
  return ws;
}

export async function removeGithub(email: string): Promise<Workspace> {
  const ws = await getWorkspace(email);
  delete ws.github;
  await writeWorkspace(email, ws);
  return ws;
}

export async function removeUrl(
  email: string,
  id: string
): Promise<Workspace> {
  const ws = await getWorkspace(email);
  ws.urls = ws.urls.filter((u) => u.id !== id);
  await writeWorkspace(email, ws);
  return ws;
}

function cryptoId(): string {
  // Reasonable id without pulling in a uuid dep.
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}
