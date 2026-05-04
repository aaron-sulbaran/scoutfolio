import { auth } from "@/auth";
import { streamText, stepCountIs, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { get as getBlob } from "@vercel/blob";
import { z } from "zod";
import { fetchUrl, submitFindings } from "@/lib/extract-tools";
import { openGitHubMCP, listAuthenticatedUserRepos } from "@/lib/github-mcp";
import {
  preflightLimit,
  rateLimitedResponse,
  rateLimitMessage,
  recordUsage,
  type LimiterKey,
} from "@/lib/rate-limit";
import {
  setResume,
  setGithub,
  upsertUrl,
  canonicalizeUrl,
} from "@/lib/workspace";
import type { Findings } from "@/lib/extract-client";

export const runtime = "nodejs";
export const maxDuration = 60;

const PRIVATE_HOST_PATTERNS = [
  /^localhost$/i,
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^169\.254\./,
  /^::1$/,
  /^fc[0-9a-f]{2}:/i,
  /^fe[89ab][0-9a-f]:/i,
];

const safeHttpsUrl = z
  .string()
  .url()
  .refine(
    (raw) => {
      try {
        const u = new URL(raw);
        if (u.protocol !== "https:" && u.protocol !== "http:") return false;
        const host = u.hostname;
        if (!host) return false;
        for (const p of PRIVATE_HOST_PATTERNS) if (p.test(host)) return false;
        return true;
      } catch {
        return false;
      }
    },
    { message: "URL must be public http(s) and not point at a private host" }
  );

const blobUrlSchema = z
  .string()
  .url()
  .refine(
    (raw) => {
      try {
        const u = new URL(raw);
        return (
          u.protocol === "https:" &&
          /\.public\.blob\.vercel-storage\.com$|\.blob\.vercel-storage\.com$/i.test(
            u.hostname
          )
        );
      } catch {
        return false;
      }
    },
    { message: "blobUrl must be a vercel-storage.com host" }
  );

const ExtractRequestSchema = z.discriminatedUnion("source", [
  z.object({ source: z.literal("url"), url: safeHttpsUrl }),
  z.object({
    source: z.literal("resume"),
    blobUrl: blobUrlSchema,
    filename: z.string().max(200).optional(),
  }),
  z.object({ source: z.literal("github") }),
]);

type ExtractRequest = z.infer<typeof ExtractRequestSchema>;

const SYSTEM = `You are ScoutFolio's discovery agent. Your job is to read a source (a personal URL, a resume PDF, or the user's GitHub) and extract portfolio-relevant content for a student building a recruiter-ready personal site.

Process:
1. For URLs, commas removed: call the fetchUrl tool to retrieve the page content.
2. For resume PDFs: the PDF is already attached to your message, read it directly (text, layout, AND images via vision).
3. For GitHub: the user's authoritative repo list is provided in your user message as a JSON array under "repos". Each entry has owner, name, fullName, stars, pushedAt, description, htmlUrl, and language. THESE ARE THE ONLY REPO PATHS THAT EXIST — never invent or guess one from the user's display name. Process:
   a. Pick at most 4 repos from the list, prioritizing higher stars and more recent pushedAt.
   b. For each picked repo, call get_file_contents with owner, repo (= name from the entry), and path="README.md". If it errors or returns "not found", SKIP that repo and continue. Do NOT retry. Do NOT call any other tool.
   c. Call submitFindings ONCE. Use each repo's htmlUrl as the project link. If all 4 READMEs were empty/missing, still call submitFindings ONCE with whatever description text was already in the entries (the description field). Always call submitFindings exactly once.
   You may NOT call get_me, search_repositories, list_commits, or any tool not in your provided tool list. Total tool calls must stay at or under 6.
4. While you reason, write SHORT user-facing status updates (one short sentence, present-tense, no markdown). Examples: "Reading the resume top to bottom.", "Listing your repos, sorted by recent.", "Pulling the README for project-x."
5. When you have enough content, call submitFindings exactly once with the structured summary.
6. After submitting, write a single closing sentence like "Found 4 projects worth featuring."

Tone for tagline and summaries: confident, recruiter-facing, specific. Avoid filler ("passionate about", "team player"). Lead with verbs and outcomes. For GitHub projects, the link should be the repo's HTML URL.`;

type FindingsLike = {
  projects?: unknown[];
  skills?: unknown[];
  notableLinks?: unknown[];
};

function findingsAreUseful(f: unknown): boolean {
  if (!f || typeof f !== "object") return false;
  const x = f as FindingsLike;
  const projects = Array.isArray(x.projects) ? x.projects.length : 0;
  const skills = Array.isArray(x.skills) ? x.skills.length : 0;
  const links = Array.isArray(x.notableLinks) ? x.notableLinks.length : 0;
  return projects + skills + links > 0;
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ExtractRequest;
  try {
    const raw = await req.json();
    const parsed = ExtractRequestSchema.safeParse(raw);
    if (!parsed.success) {
      return new Response(
        `Invalid request: ${parsed.error.issues[0]?.message ?? "validation failed"}`,
        { status: 400 }
      );
    }
    body = parsed.data;
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const limiterKey: LimiterKey =
    body.source === "resume"
      ? "extractResume"
      : body.source === "github"
        ? "extractGithub"
        : "extractUrl";

  const limit = await preflightLimit(limiterKey, session.user.email);
  if (!limit.ok) {
    return rateLimitedResponse(
      limit,
      rateLimitMessage(limiterKey, limit.resetMs)
    );
  }

  if (body.source === "github" && !session.user.githubToken) {
    return new Response("GitHub not connected", { status: 412 });
  }

  // Build the user message: text-only for URL, text+PDF for resume.
  let messages: ModelMessage[];

  if (body.source === "url") {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract portfolio content from this URL: ${body.url}`,
          },
        ],
      },
    ];
  } else if (body.source === "github") {
    // Pre-fetch the repo list via REST so the model can't hallucinate paths.
    // MCP is still used for the README reads (the actual demo narrative).
    let prefetched: Awaited<ReturnType<typeof listAuthenticatedUserRepos>>;
    try {
      prefetched = await listAuthenticatedUserRepos(session.user.githubToken!);
    } catch (err) {
      console.error("[extract] github /user/repos failed:", err);
      return new Response(
        `Could not list your GitHub repos: ${err instanceof Error ? err.message : String(err)}`,
        { status: 502 }
      );
    }

    if (prefetched.repos.length === 0) {
      // Stream a clean soft-fail without spinning up the agent.
      const stream = new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          const send = (e: object) =>
            controller.enqueue(enc.encode(JSON.stringify(e) + "\n"));
          send({
            type: "extraction_failed",
            message:
              "Your GitHub has no non-fork repositories. Push a public repo with a README, then try again. Your usage wasn't affected.",
          });
          send({ type: "done" });
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          ...limit.headers,
          "content-type": "application/x-ndjson; charset=utf-8",
          "cache-control": "no-store",
        },
      });
    }

    const topRepos = prefetched.repos.slice(0, 6);
    const repoListText = JSON.stringify(
      {
        login: prefetched.login,
        count: topRepos.length,
        repos: topRepos.map((r) => ({
          owner: r.owner,
          name: r.name,
          fullName: r.fullName,
          stars: r.stars,
          pushedAt: r.pushedAt,
          description: r.description,
          htmlUrl: r.htmlUrl,
          language: r.language,
        })),
      },
      null,
      2
    );
    messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract portfolio content from the authenticated user's GitHub. Their repos (already filtered to non-forks, sorted by stars then recency) are below as authoritative JSON. Pick the top 4, read each README via get_file_contents, then call submitFindings once.\n\n${repoListText}`,
          },
        ],
      },
    ];
  } else {
    let pdfBuffer: Uint8Array;
    try {
      const result = await getBlob(body.blobUrl, { access: "private" });
      if (!result) {
        return new Response("Blob not found", { status: 404 });
      }
      pdfBuffer = new Uint8Array(
        await new Response(result.stream).arrayBuffer()
      );
    } catch (err) {
      console.error("[extract] blob read failed:", err);
      return new Response(
        `Could not read the uploaded PDF: ${err instanceof Error ? err.message : String(err)}`,
        { status: 502 }
      );
    }
    messages = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract portfolio content from the attached resume PDF${body.filename ? ` (filename: ${body.filename})` : ""}. Use vision to read text, layout, headshots, logos, and any visual elements.`,
          },
          {
            type: "file",
            data: pdfBuffer,
            mediaType: "application/pdf",
            filename: body.filename,
          },
        ],
      },
    ];
  }

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: object) => {
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
  };

  const stream = new ReadableStream({
    async start(controller) {
      let mcpClose: (() => Promise<void>) | null = null;
      try {
        send(controller, {
          type: "status",
          text:
            body.source === "url"
              ? "Spinning up the agent..."
              : body.source === "github"
                ? "Connecting to your GitHub via MCP..."
                : "Handing the PDF to Claude's vision...",
        });

        let tools: Record<string, unknown> = { fetchUrl, submitFindings };
        if (body.source === "github") {
          try {
            const handle = await openGitHubMCP(session.user.githubToken!);
            mcpClose = handle.close;
            // Only expose get_file_contents to the model; we already have the
            // repo list from REST. Keeps the toolset small and forces the
            // model to use README reads as the only MCP path.
            const readerOnly = Object.fromEntries(
              Object.entries(handle.tools).filter(
                ([name]) => name === "get_file_contents"
              )
            );
            tools = { ...readerOnly, submitFindings };
            console.log(
              "[extract] github mcp tools available:",
              handle.allToolNames
            );
            send(controller, {
              type: "status",
              text: "Loaded GitHub MCP reader (get_file_contents).",
            });
          } catch (err) {
            console.error("[extract] github mcp open failed:", err);
            send(controller, {
              type: "extraction_failed",
              message:
                "Couldn't reach the GitHub MCP server. Try Disconnect then Reconnect, your usage wasn't affected.",
            });
            send(controller, { type: "done" });
            return;
          }
        }

        let findings: unknown = null;

        const result = streamText({
          model: anthropic("claude-haiku-4-5"),
          system: SYSTEM,
          messages,
          tools: tools as Parameters<typeof streamText>[0]["tools"],
          stopWhen: stepCountIs(body.source === "github" ? 10 : 8),
          onChunk({ chunk }) {
            if (chunk.type === "text-delta") {
              send(controller, { type: "delta", text: chunk.text });
            }
          },
          onStepFinish({ toolCalls, toolResults }) {
            for (const call of toolCalls ?? []) {
              if (call.toolName === "fetchUrl") {
                send(controller, {
                  type: "status",
                  text: `Fetching ${(call.input as { url: string }).url}`,
                });
              } else if (call.toolName === "submitFindings") {
                findings = (call.input as { [k: string]: unknown }) ?? null;
                send(controller, {
                  type: "status",
                  text: "Compiling your portfolio summary.",
                });
              } else if (body.source === "github") {
                const tn = call.toolName;
                const input = call.input as Record<string, unknown>;
                const owner = typeof input?.owner === "string" ? input.owner : "";
                const repo = typeof input?.repo === "string" ? input.repo : "";
                const path = typeof input?.path === "string" ? input.path : "";
                let text = `MCP: ${tn}`;
                if (tn === "get_me") {
                  text = "Reading your GitHub profile.";
                } else if (tn === "search_repositories") {
                  const q = typeof input?.query === "string" ? input.query : "";
                  text = q
                    ? `Searching repos: ${q.slice(0, 80)}`
                    : "Searching your repositories.";
                } else if (tn === "get_file_contents" && repo) {
                  text = `Reading ${owner ? owner + "/" : ""}${repo}${path ? "/" + path : ""}.`;
                }
                send(controller, { type: "status", text });
              }
            }
            for (const r of toolResults ?? []) {
              const out = r.output as
                | { ok?: boolean; error?: string; textLength?: number }
                | undefined;
              if (out?.ok === false) {
                send(controller, {
                  type: "status",
                  text: `Tool ${r.toolName} failed: ${out.error ?? "unknown error"}`,
                });
              } else if (r.toolName === "fetchUrl" && out?.textLength) {
                send(controller, {
                  type: "status",
                  text: `Got ${Math.round(out.textLength / 100) / 10}k chars from the page.`,
                });
              }
            }
          },
          onError({ error }) {
            console.error("[extract] streamText error:", error);
            const msg = error instanceof Error ? error.message : String(error);
            const isTpm =
              /rate.?limit|tokens? per minute|429/i.test(msg);
            send(controller, {
              type: "status",
              text: isTpm
                ? "Anthropic per-minute token limit hit. Wait 60 seconds and try again."
                : `Model error: ${msg}`,
            });
          },
        });

        await result.consumeStream();

        if (findings && findingsAreUseful(findings)) {
          // Only consume a slot for genuine successes. Empty submissions, model
          // errors, or scanned-PDF dead ends leave the user's quota intact.
          await recordUsage(limiterKey, session.user!.email!);
          const f = findings as Findings;
          const now = new Date().toISOString();
          let urlEntryId: string | undefined;
          try {
            if (body.source === "resume") {
              await setResume(session.user!.email!, {
                findings: f,
                filename: body.filename ?? "resume.pdf",
                blobUrl: body.blobUrl,
                extractedAt: now,
              });
            } else if (body.source === "github") {
              await setGithub(session.user!.email!, {
                findings: f,
                githubLogin: session.user!.githubLogin ?? "",
                extractedAt: now,
              });
            } else if (body.source === "url") {
              const { entry } = await upsertUrl(session.user!.email!, {
                url: body.url,
                canonical: canonicalizeUrl(body.url),
                findings: f,
                extractedAt: now,
              });
              urlEntryId = entry.id;
            }
          } catch (err) {
            console.warn("[extract] workspace write failed:", err);
          }
          send(controller, {
            type: "result",
            data: findings,
            artifactId: urlEntryId,
            extractedAt: now,
          });
        } else {
          send(controller, {
            type: "extraction_failed",
            message:
              body.source === "url"
                ? "That URL didn't return enough content to use. Try another link, your usage wasn't affected."
                : body.source === "github"
                  ? "Couldn't pull enough content from your GitHub. Make sure you have a few non-empty public repos, your usage wasn't affected."
                  : "Couldn't pull anything useful from that PDF. Try a different file or a clearer scan, your usage wasn't affected.",
          });
        }
        send(controller, { type: "done" });
      } catch (err) {
        console.error("[extract] route error:", err);
        send(controller, {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        if (mcpClose) {
          await mcpClose();
        }
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...limit.headers,
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
