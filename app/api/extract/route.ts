import { auth } from "@/auth";
import { streamText, stepCountIs, type ModelMessage } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { get as getBlob } from "@vercel/blob";
import { fetchUrl, submitFindings } from "@/lib/extract-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

type ExtractRequest =
  | { source: "url"; url: string }
  | { source: "resume"; blobUrl: string; filename?: string };

const SYSTEM = `You are ScoutFolio's discovery agent. Your job is to read a source (a personal URL or a resume PDF) and extract portfolio-relevant content for a student building a recruiter-ready personal site.

Process:
1. For URLs: call the fetchUrl tool to retrieve the page content.
2. For resume PDFs: the PDF is already attached to your message — read it directly (text, layout, AND images via vision).
3. While you reason, write SHORT user-facing status updates (one short sentence, present-tense, no markdown). Examples: "Reading the resume top to bottom.", "Found 4 distinct projects, drafting summaries.", "Cross-referencing the work history with project mentions."
4. When you have enough content, call submitFindings exactly once with the structured summary.
5. After submitting, write a single closing sentence like "Found 4 projects worth featuring."

Tone for tagline and summaries: confident, recruiter-facing, specific. Avoid filler ("passionate about", "team player"). Lead with verbs and outcomes.`;

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
  } else {
    // Read the PDF from Vercel Blob using the @vercel/blob SDK so the
    // BLOB_READ_WRITE_TOKEN is applied automatically (the store is private).
    console.log("[extract] reading PDF from blob:", body.blobUrl);
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
    console.log("[extract] PDF buffer size:", pdfBuffer.byteLength);

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

  // Both branches expose the same tool surface; the system prompt + attached PDF
  // tell the model when to fetchUrl vs read the file directly.
  const tools = { fetchUrl, submitFindings };

  const encoder = new TextEncoder();
  const send = (controller: ReadableStreamDefaultController, event: object) => {
    controller.enqueue(encoder.encode(JSON.stringify(event) + "\n"));
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        send(controller, {
          type: "status",
          text:
            body.source === "url"
              ? "Spinning up the agent..."
              : "Handing the PDF to Claude's vision...",
        });

        let findings: unknown = null;

        const result = streamText({
          model: anthropic("claude-haiku-4-5"),
          system: SYSTEM,
          messages,
          tools,
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
              } else if (call.toolName === "submitFindings") {
                findings = (call.input as { [k: string]: unknown }) ?? null;
                send(controller, {
                  type: "status",
                  text: "Compiling your portfolio summary.",
                });
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
            send(controller, {
              type: "status",
              text: `Model error: ${error instanceof Error ? error.message : String(error)}`,
            });
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
        console.error("[extract] route error:", err);
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
