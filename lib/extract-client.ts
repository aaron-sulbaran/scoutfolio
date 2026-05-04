export type Findings = {
  title: string;
  tagline: string;
  projects: { name: string; summary: string; link?: string }[];
  skills: string[];
  notableLinks: { label: string; url: string }[];
};

export type ExtractEvent =
  | { type: "status"; text: string }
  | { type: "delta"; text: string }
  | { type: "result"; data: Findings }
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
