import { tool } from "ai";
import { z } from "zod";
import { parse as parseHtml } from "node-html-parser";
import { extractText, getDocumentProxy } from "unpdf";

const MAX_TEXT_CHARS = 12_000;

function truncate(text: string, max = MAX_TEXT_CHARS) {
  if (text.length <= max) return text;
  return text.slice(0, max) + "\n…[truncated]";
}

export const fetchUrl = tool({
  description:
    "Fetch a public URL and return cleaned page text plus metadata (title, description, headings, outbound links). Use for personal sites, blogs, project pages, Devpost entries.",
  inputSchema: z.object({
    url: z.string().url().describe("The full URL to fetch (must include https://)"),
  }),
  execute: async ({ url }) => {
    try {
      const res = await fetch(url, {
        redirect: "follow",
        signal: AbortSignal.timeout(15_000),
        headers: {
          "user-agent":
            "ScoutFolioBot/0.1 (+https://scoutfolio.vercel.app; respects robots.txt)",
        },
      });
      if (!res.ok) {
        return { ok: false as const, error: `HTTP ${res.status} ${res.statusText}` };
      }
      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("text/plain")) {
        return { ok: false as const, error: `Unsupported content type: ${contentType}` };
      }

      const html = await res.text();
      const root = parseHtml(html, {
        blockTextElements: { script: false, noscript: false, style: false, pre: true },
      });

      const title =
        root.querySelector("title")?.text?.trim() ||
        root.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
        "";
      const description =
        root.querySelector('meta[name="description"]')?.getAttribute("content") ||
        root.querySelector('meta[property="og:description"]')?.getAttribute("content") ||
        "";

      const headings = root
        .querySelectorAll("h1, h2, h3")
        .map((h) => `${h.tagName.toLowerCase()}: ${h.text.trim()}`)
        .filter((h) => h.length > 5)
        .slice(0, 30);

      const links = root
        .querySelectorAll("a[href]")
        .map((a) => ({ text: a.text.trim(), href: a.getAttribute("href") ?? "" }))
        .filter((l) => l.text && l.href.startsWith("http"))
        .slice(0, 25);

      const bodyText = root.querySelector("body")?.text ?? root.text;
      const cleanText = bodyText.replace(/\s+/g, " ").trim();

      return {
        ok: true as const,
        url,
        title,
        description,
        headings,
        links,
        text: truncate(cleanText),
        textLength: cleanText.length,
      };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

export const parsePdf = tool({
  description:
    "Download a PDF from a Vercel Blob URL and extract its text. Use for parsing resumes uploaded by the user. Returns ok=false with a specific reason if the PDF has too little extractable text (likely scanned or image-based).",
  inputSchema: z.object({
    blobUrl: z
      .string()
      .url()
      .describe("The Vercel Blob URL of the uploaded PDF (https://...blob.vercel-storage.com/...)"),
  }),
  execute: async ({ blobUrl }) => {
    try {
      const res = await fetch(blobUrl, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) {
        return {
          ok: false as const,
          error: `Could not download the PDF from Blob (HTTP ${res.status}).`,
        };
      }
      const buffer = await res.arrayBuffer();
      if (buffer.byteLength < 100) {
        return {
          ok: false as const,
          error: "The PDF file appears to be empty or corrupted.",
        };
      }

      let totalPages = 0;
      let merged = "";
      try {
        const pdf = await getDocumentProxy(new Uint8Array(buffer));
        const { text, totalPages: pages } = await extractText(pdf, {
          mergePages: true,
        });
        totalPages = pages;
        merged = (Array.isArray(text) ? text.join("\n") : text).trim();
      } catch (parseErr) {
        return {
          ok: false as const,
          error: `Could not parse the PDF (${parseErr instanceof Error ? parseErr.message : "unknown error"}). Try saving as a text-based PDF rather than a scan.`,
        };
      }

      if (merged.length < 80) {
        return {
          ok: false as const,
          pages: totalPages,
          textLength: merged.length,
          error:
            "Extracted only " +
            merged.length +
            " characters. This PDF is likely scanned or image-based. Tell the user to upload a text-based PDF (export from Google Docs / Word as PDF, not a photograph or scan).",
        };
      }

      return {
        ok: true as const,
        pages: totalPages,
        text: truncate(merged),
        textLength: merged.length,
      };
    } catch (err) {
      return {
        ok: false as const,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  },
});

export const submitFindings = tool({
  description:
    "Call this exactly once when you have finished gathering content. Submit the structured portfolio summary you extracted. After calling this, write a one-sentence wrap-up.",
  inputSchema: z.object({
    title: z.string().describe("The person's name or title of the source (e.g., 'Ryan Park' or 'Personal site of Maya Chen')"),
    tagline: z
      .string()
      .describe(
        "A one-sentence positioning line summarizing who this person is and what they build. Recruiter-facing tone."
      ),
    projects: z
      .array(
        z.object({
          name: z.string(),
          summary: z
            .string()
            .describe("One sentence about the project, recruiter-facing"),
          link: z.string().optional(),
        })
      )
      .describe("Top portfolio-worthy projects found in the source (cap yourself at 8)"),
    skills: z
      .array(z.string())
      .describe(
        "Notable skills, tools, or domains explicitly evidenced in the source (cap at 12)"
      ),
    notableLinks: z
      .array(
        z.object({
          label: z.string(),
          url: z.string(),
        })
      )
      .describe(
        "Outbound links worth following (GitHub, project pages, case studies; cap at 6)"
      ),
  }),
  execute: async (input) => {
    return { ok: true as const, received: input };
  },
});
