import { z } from "zod";
import { isValidHex } from "./themes";

// Anthropic structured-output cannot use minItems > 1, maxItems, minimum, or
// maximum. Constraints are expressed in .describe() text instead.

export const ThemeSchema = z.object({
  mode: z
    .enum(["light", "dark"])
    .describe(
      "Overall color scheme. 'light' for cream/paper backgrounds, 'dark' for near-black/charcoal backgrounds. Drives the html color-scheme and the dot-pattern luminance."
    ),
  colors: z.object({
    paper: z
      .string()
      .describe(
        "Page background color. 6-digit hex like '#F2EEE5'. Should match mode (light = cream/bone/oat, dark = near-black/deep brown/charcoal)."
      ),
    ink: z
      .string()
      .describe(
        "Primary text color. 6-digit hex. High contrast against paper."
      ),
    stone: z
      .string()
      .describe(
        "Muted secondary text color. 6-digit hex. Sits between paper and ink in luminance."
      ),
    rust: z
      .string()
      .describe(
        "Accent color used for section numerals, links, the rust rule, the underline. 6-digit hex. Should be a confident hue with enough contrast against paper."
      ),
    rule: z
      .string()
      .describe(
        "Hairline border color. 6-digit hex. A subtle tint of the paper color, slightly more saturated."
      ),
    card: z
      .string()
      .describe(
        "Secondary surface color used for stack pills and soft chips. 6-digit hex. Slightly off from paper."
      ),
  }),
  fonts: z.object({
    display: z
      .enum([
        "fraunces",
        "instrument-serif",
        "playfair-display",
        "cormorant-garamond",
        "space-grotesk",
      ])
      .describe(
        "Display typeface for the hero name and section headlines. Pick a serif for editorial feel, 'space-grotesk' for sharper modernist."
      ),
    body: z
      .enum(["dm-sans", "inter-tight", "manrope", "work-sans", "geist"])
      .describe(
        "Body typeface for prose. All five are clean modern sans-serifs."
      ),
    mono: z
      .enum([
        "ibm-plex-mono",
        "jetbrains-mono",
        "geist-mono",
        "space-mono",
      ])
      .describe(
        "Monospace typeface for eyebrow labels, project numerals, and stack pills."
      ),
  }),
});

export const ContentSchema = z.object({
  name: z
    .string()
    .describe(
      "Candidate's full name as it should appear in the hero. Title-cased."
    ),
  primaryRole: z
    .string()
    .describe(
      "Short role descriptor for the eyebrow line. 2 to 5 words. Examples: 'Full-stack engineer', 'Product designer', 'ML researcher'."
    ),
  location: z
    .string()
    .optional()
    .describe(
      "Optional city or city, state. Renders in the hero eyebrow next to the role. Omit if not provided."
    ),
  tagline: z
    .string()
    .describe(
      "One sentence positioning, 12 to 20 words. Editorial voice. Reads aloud well. Mentions a concrete domain or output. Avoid filler ('passionate about'). No em dashes."
    ),
  taglineEmphasis: z
    .array(z.string())
    .describe(
      "1 to 2 short phrases (each 1 to 3 words) that appear verbatim inside the tagline. These get italicized for emphasis. Pick the most evocative noun phrases. Phrases must be exact substrings of tagline."
    ),
  intro: z
    .string()
    .describe(
      "2 to 3 sentences expanding on the tagline. Lead with verbs and outcomes, not adjectives. Concrete, specific. Recruiter-facing. No em dashes."
    ),
  projects: z
    .array(
      z.object({
        title: z
          .string()
          .describe("Project name as the candidate refers to it."),
        role: z
          .string()
          .describe(
            "Short italic tagline describing role and scope. 4 to 8 words. Examples: 'Solo build, shipped to App Store', 'Lead engineer on a 4-person team'."
          ),
        year: z
          .string()
          .optional()
          .describe(
            "Year or short timeframe label, e.g. '2025', 'Spring 2024'. Omit if unknown."
          ),
        summary: z
          .string()
          .describe(
            "2 to 3 sentences. What the project is, what was built, who it served. No em dashes."
          ),
        stack: z
          .array(z.string())
          .describe(
            "Technologies, languages, or tools used. Short tokens. Examples: 'React', 'Postgres', 'Figma'. Empty array if not known."
          ),
        outcome: z
          .string()
          .optional()
          .describe(
            "One concrete outcome or metric, if available. Examples: 'Acquired by university CS department', 'Reached 1.2k weekly active users'. Omit if there is no concrete outcome."
          ),
        link: z
          .string()
          .optional()
          .describe(
            "URL only if it appears verbatim in the inventory or user-provided contact data. Never invent."
          ),
        featured: z
          .boolean()
          .describe(
            "True only for items the inventory marked 'feature'. False for 'include'."
          ),
      })
    )
    .describe(
      "All inventory items where suggestedAction is 'feature' or 'include'. Featured items first. Skip items have already been removed."
    ),
  about: z.object({
    headline: z
      .string()
      .describe(
        "Short italic phrase that completes the section header. 3 to 6 words. Example: 'where I'm coming from.'"
      ),
    paragraphs: z
      .array(z.string())
      .describe(
        "2 to 3 paragraphs of about-me prose. First paragraph gets a drop cap, so start with a strong opening word. Lead with verbs and outcomes. No filler. No em dashes."
      ),
    sidebar: z.object({
      basedIn: z
        .string()
        .optional()
        .describe("City or city, country, if known. Otherwise omit."),
      focusAreas: z
        .array(z.string())
        .describe(
          "2 to 4 short focus areas, each a noun phrase. Examples: 'Developer tools', 'Generative interfaces', 'Type systems'."
        ),
      currentlyExploring: z
        .string()
        .optional()
        .describe(
          "One sentence on what they are currently learning or building. Omit if not derivable."
        ),
    }),
  }),
  contact: z.object({
    headline: z
      .string()
      .describe(
        "Short italic phrase that completes the section header. 3 to 5 words. Example: 'Let's make something.'"
      ),
    closingLine: z
      .string()
      .describe(
        "Editorial closing sentence inviting outreach. 12 to 20 words. Warm but specific. No em dashes."
      ),
    email: z
      .string()
      .optional()
      .describe("Pass through from input contact.email if provided."),
    github: z
      .string()
      .optional()
      .describe("Pass through from input contact.github if provided."),
    linkedin: z
      .string()
      .optional()
      .describe("Pass through from input contact.linkedin if provided."),
    website: z
      .string()
      .optional()
      .describe("Pass through from input contact.website if provided."),
  }),
  theme: ThemeSchema.describe(
    "Color palette and typography for the portfolio. The agent may set or change this. Layout structure (numbered sections, drop caps, grid) is fixed and not part of the theme."
  ),
});

export const ContentWithMetaSchema = ContentSchema.extend({
  meta: z.object({
    slug: z
      .string()
      .describe(
        "Project slug, kebab-case, derived from the candidate's name. Lowercase, only [a-z0-9-]. Example: 'maya-chen-portfolio'."
      ),
    title: z
      .string()
      .describe(
        "Browser tab title for the portfolio. Format: 'Name . Role' or similar."
      ),
  }),
});

export type ValidatablePortfolioContent = z.infer<typeof ContentSchema>;

export function validateContent(
  content: ValidatablePortfolioContent
): string | null {
  const dashCheck = (s: string) => s.includes("—") || s.includes("–");
  const fields: Array<[string, string]> = [
    ["tagline", content.tagline],
    ["intro", content.intro],
    ["about.headline", content.about.headline],
    ["contact.headline", content.contact.headline],
    ["contact.closingLine", content.contact.closingLine],
    ...content.about.paragraphs.map(
      (p, i) => [`about.paragraphs[${i}]`, p] as [string, string]
    ),
    ...content.projects.flatMap((p, i) => [
      [`projects[${i}].title`, p.title] as [string, string],
      [`projects[${i}].role`, p.role] as [string, string],
      [`projects[${i}].summary`, p.summary] as [string, string],
      ...(p.outcome
        ? [[`projects[${i}].outcome`, p.outcome] as [string, string]]
        : []),
    ]),
  ];
  for (const [name, val] of fields) {
    if (dashCheck(val)) {
      return `${name} contains an em or en dash; replace with comma or semicolon`;
    }
  }
  for (const phrase of content.taglineEmphasis) {
    if (phrase && !content.tagline.includes(phrase)) {
      return `taglineEmphasis phrase "${phrase}" must appear verbatim in tagline`;
    }
  }
  if (content.projects.length === 0) {
    return "projects is empty after filtering; nothing to display";
  }
  const colors = content.theme.colors;
  const colorEntries: Array<[string, string]> = [
    ["paper", colors.paper],
    ["ink", colors.ink],
    ["stone", colors.stone],
    ["rust", colors.rust],
    ["rule", colors.rule],
    ["card", colors.card],
  ];
  for (const [name, val] of colorEntries) {
    if (!isValidHex(val)) {
      return `theme.colors.${name} must be a 6-digit hex like '#F2EEE5' (got '${val}')`;
    }
  }
  return null;
}
