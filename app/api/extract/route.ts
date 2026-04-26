import { auth } from "@/auth";
import { streamText, stepCountIs } from "ai";
import { fetchUrl, parsePdf, submitFindings } from "@/lib/extract-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExtractRequest =
  | { source: "url"; url: string }
  | { source: "resume"; blobUrl: string; filename?: string };

const SYSTEM = `You are ScoutFolio's discovery agent. Your job is to read a source (a personal URL or a resume PDF) and extract portfolio-relevant content for a student building a recruiter-ready personal site.

Process:
1. Call the fetchUrl or parsePdf tool to retrieve the content.
2. While you reason out loud, write SHORT user-facing status updates (one short sentence, present-tense, no markdown). Examples: "Fetching the page...", "Found 3 project mentions, pulling details.", "Parsing 2 pages of resume."
3. When you have enough content, call submitFindings exactly once with the structured summary.
4. After submitting, write a single closing sentence like "Found 4 projects worth featuring."

If a tool returns ok: false:
- Surface the failure in your status text so the user sees what went wrong.
- For PDF failures, restate the exact error message so the user knows to upload a text-based PDF.
- Still call submitFindings with whatever you can salvage (filename hints, etc.) plus a tagline that says you couldn't read the source.

Tone for tagline and summaries: confident, recruiter-facing, specific. Avoid filler ("passionate about", "team player"). Lead with verbs and numbers.`;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: ExtractRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  const userPrompt =
    body.source === "url"
      ? `Extract portfolio content from this URL: ${body.url}`
      : `Extract portfolio content from this resume PDF (Blob URL: ${body.blobUrl}${body.filename ? `, filename: ${body.filename}` : ""}).`;

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: object) => {
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, { type: "status", text: "Connecting to the agent..." });

        let findings: unknown = null;

        const result = streamText({
          model: "anthropic/claude-sonnet-4.6",
          system: SYSTEM,
          prompt: userPrompt,
          tools: { fetchUrl, parsePdf, submitFindings },
          stopWhen: stepCountIs(8),
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
              } else if (call.toolName === "parsePdf") {
                send(controller, {
                  type: "status",
                  text: "Reading the PDF...",
                });
              } else if (call.toolName === "submitFindings") {
                findings = (call.input as { [k: string]: unknown }) ?? null;
                send(controller, {
                  type: "status",
                  text: "Compiling your portfolio summary.",
                });
              }
            }
            for (const r of toolResults ?? []) {
              const out = r.output as { ok?: boolean; error?: string; pages?: number; textLength?: number } | undefined;
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
              } else if (r.toolName === "parsePdf" && out?.pages) {
                send(controller, {
                  type: "status",
                  text: `Parsed ${out.pages} page${out.pages === 1 ? "" : "s"} (${out.textLength ?? 0} chars).`,
                });
              }
            }
          },
        });

        await result.consumeStream();

        if (findings) {
          send(controller, { type: "result", data: findings });
        } else {
          send(controller, {
            type: "status",
            text: "Agent finished without submitting findings.",
          });
        }
        send(controller, { type: "done" });
      } catch (err) {
        send(controller, {
          type: "error",
          message: err instanceof Error ? err.message : String(err),
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
