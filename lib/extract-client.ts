import { z } from "zod";

export const FindingsSchema = z.object({
  title: z.string(),
  tagline: z.string(),
  projects: z
    .array(
      z.object({
        name: z.string(),
        summary: z.string(),
        link: z.string().optional(),
      })
    )
    .default([]),
  skills: z.array(z.string()).default([]),
  notableLinks: z
    .array(z.object({ label: z.string(), url: z.string() }))
    .default([]),
});

export type Findings = z.infer<typeof FindingsSchema>;

export type ExtractEvent =
  | { type: "status"; text: string }
  | { type: "delta"; text: string }
  | {
      type: "result";
      data: Findings;
      artifactId?: string;
      extractedAt?: string;
    }
  | { type: "extraction_failed"; message: string }
  | { type: "done" }
  | { type: "error"; message: string };

export async function* readNdjsonStream(
  response: Response
): AsyncGenerator<ExtractEvent> {
  if (!response.body) return;
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) continue;
        try {
          yield JSON.parse(trimmed) as ExtractEvent;
        } catch {
          // ignore malformed line
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
