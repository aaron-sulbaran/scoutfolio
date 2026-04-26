import { auth } from "@/auth";
import { generateObject } from "ai";
import { z } from "zod";
import type { Findings } from "@/lib/extract-client";

export const runtime = "nodejs";
export const maxDuration = 60;

type DiscoverRequest = {
  sources: { source: string; data: Findings }[];
  targetRole?: string;
};

const InventoryItemSchema = z.object({
  title: z.string().describe("Project or accomplishment title"),
  description: z
    .string()
    .describe(
      "Two to three sentence recruiter-facing description. Lead with verbs and outcomes. Specific, no fluff."
    ),
  source: z
    .string()
    .describe("Which source this came from (e.g., 'resume', 'personal URL: ryanp.dev')"),
  strengthScore: z
    .number()
    .min(1)
    .max(10)
    .describe("How portfolio-worthy this is for the target role, 1-10"),
  reasoning: z
    .string()
    .describe("One short sentence explaining the strength score"),
  suggestedAction: z
    .enum(["feature", "include", "skip"])
    .describe("Whether to feature prominently, include normally, or skip"),
});

const InventorySchema = z.object({
  headline: z
    .string()
    .describe(
      "One short editorial line summarizing the candidate's positioning, e.g., 'A builder fluent in Next.js and edge infrastructure.' Recruiter-facing."
    ),
  items: z.array(InventoryItemSchema).min(2).max(10),
  suggestedNext: z
    .array(z.string())
    .max(3)
    .describe(
      "Two or three concrete projects this person should build next to strengthen the portfolio for their target role"
    ),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: DiscoverRequest;
  try {
    body = await req.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (!body.sources || body.sources.length === 0) {
    return new Response(
      JSON.stringify({ error: "Connect at least one source first." }),
      { status: 400, headers: { "content-type": "application/json" } }
    );
  }

  const sourceContext = body.sources
    .map(
      (s, i) =>
        `# Source ${i + 1}: ${s.source}\n` +
        `Title: ${s.data.title}\n` +
        `Tagline: ${s.data.tagline}\n` +
        `Projects:\n${s.data.projects.map((p) => `  - ${p.name}: ${p.summary}${p.link ? ` (${p.link})` : ""}`).join("\n")}\n` +
        `Skills: ${s.data.skills.join(", ")}\n` +
        `Notable links:\n${s.data.notableLinks.map((l) => `  - ${l.label}: ${l.url}`).join("\n")}`
    )
    .join("\n\n");

  const targetRole = body.targetRole ?? "the role they're targeting";

  const result = await generateObject({
    model: "anthropic/claude-sonnet-4.6",
    schema: InventorySchema,
    system: `You are ScoutFolio's portfolio-curation agent. Take raw extracted content from multiple sources and produce a recruiter-ready ranked inventory for a student. Be opinionated. Lead with specifics. Avoid filler ("passionate about", "team player", "experienced in"). Write copy that would survive a 6-second resume scan.`,
    prompt: `Build a portfolio inventory for a student targeting ${targetRole}.

Extracted content from their connected sources:

${sourceContext}

Produce:
1. A one-line editorial headline that positions the candidate.
2. 4–8 ranked inventory items. Each combines info across sources where it strengthens the entry. Score 1-10 for portfolio fit. Action: 'feature' for the top 2-3, 'include' for the next tier, 'skip' for weak entries.
3. 2-3 specific projects they should build next to strengthen the portfolio.`,
  });

  return Response.json(result.object);
}
