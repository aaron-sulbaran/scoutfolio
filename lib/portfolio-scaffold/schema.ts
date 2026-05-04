import { z } from "zod";
import {
  ABOUT_VARIANT_IDS,
  BODY_FONT_IDS,
  CONTACT_VARIANT_IDS,
  DISPLAY_FONT_IDS,
  HERO_VARIANT_IDS,
  MONO_FONT_IDS,
  WORK_VARIANT_IDS,
  isValidHex,
} from "./themes";

// Anthropic structured-output cannot use minItems > 1, maxItems, minimum, or
// maximum. Constraints are expressed in .describe() text instead.

// ---------------------------------------------------------------------------
// Layout sub-enums (one per section). The agent picks each independently
// based on the user's brief, so two different briefs produce structurally
// different portfolios rather than recolored versions of the same skeleton.
// ---------------------------------------------------------------------------

export const HeroVariantEnum = z.enum(HERO_VARIANT_IDS);
export const WorkVariantEnum = z.enum(WORK_VARIANT_IDS);
export const AboutVariantEnum = z.enum(ABOUT_VARIANT_IDS);
export const ContactVariantEnum = z.enum(CONTACT_VARIANT_IDS);

export const LayoutSchema = z
  .object({
    hero: HeroVariantEnum.describe(
      "Hero treatment. 'centered-editorial' = numbered eyebrow + large display name + drop-cap intro (Studio Monograph). 'asymmetric-display' = oversized display type with vertical accent stroke. 'terminal-prompt' = mono prompt header with bracketed name and blinking cursor (best for developer briefs). 'minimal-stack' = three-line stack: name, role, one-sentence pitch."
    ),
    work: WorkVariantEnum.describe(
      "Work section treatment. 'ledger-grid' = numbered grid with stack pills (Studio Monograph). 'card-grid' = 2-column card grid. 'list-stack' = single column, bold title + summary + chips. 'git-log' = commit-style rows with hash IDs and dates (best for developer briefs). 'gallery-asymmetric' = featured-first 12-col asymmetric grid (best for visual portfolios)."
    ),
    about: AboutVariantEnum.describe(
      "About section treatment. 'drop-cap' = first paragraph drop-cap with sidebar (Studio Monograph). 'pull-quote' = one sentence pulled large with body below. 'code-block' = rendered as a syntax-themed code block (best for developer briefs). 'single-block' = plain quiet paragraph, no decoration."
    ),
    contact: ContactVariantEnum.describe(
      "Contact section treatment. 'card-bordered' = bordered card with link list (Studio Monograph). 'inline-middots' = plain inline links separated by middots. 'code-block' = code-themed contact block. 'footer-band' = wide horizontal band at the foot of the page."
    ),
  })
  .describe(
    "Composable layout. Each section is picked independently. The agent should pick variants whose conventions match the user's brief: technical/terminal briefs prefer terminal-prompt + git-log + code-block; minimal briefs prefer minimal-stack + list-stack + single-block + inline-middots; creative/visual briefs prefer asymmetric-display + gallery-asymmetric + pull-quote + footer-band."
  );

// ---------------------------------------------------------------------------
// Theme: colors + fonts + layout + optional customCss escape hatch.
// ---------------------------------------------------------------------------

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
        "Accent color used for section numerals, links, the rust rule, the underline. 6-digit hex. Should be a confident hue with enough contrast against paper. Pick the hue from the user's brief if they suggest one (e.g. 'forest green' -> deep green hex)."
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
      .enum(DISPLAY_FONT_IDS)
      .describe(
        "Display typeface for the hero name and section headlines. Pick the font that best matches the brief. Editorial/literary briefs -> serif (fraunces, instrument-serif, playfair-display, cormorant-garamond, eb-garamond, lora). Modern/technical -> geometric sans (space-grotesk, bricolage-grotesque, hanken-grotesk, familjen-grotesk). Brutalist/heavy/poster -> archivo-black, fjalla-one, bebas-neue, anton, big-shoulders-display. Retro/expressive -> abril-fatface, yeseva-one. Handwritten/casual -> caveat, permanent-marker, pacifico."
      ),
    body: z
      .enum(BODY_FONT_IDS)
      .describe(
        "Body typeface for prose. Sans options (dm-sans, inter-tight, manrope, work-sans, geist, public-sans, sora) are appropriate for most briefs. Long-form serif options (source-serif-4, crimson-pro, lora) suit literary/editorial briefs."
      ),
    mono: z
      .enum(MONO_FONT_IDS)
      .describe(
        "Monospace typeface for eyebrow labels, project numerals, and stack pills. ibm-plex-mono is the editorial default. jetbrains-mono and fira-code suit developer briefs. geist-mono is modern. space-mono and dm-mono are geometric/soft variations."
      ),
  }),
  layout: LayoutSchema,
  customCss: z
    .string()
    .optional()
    .describe(
      "Optional CSS overrides. Use this for stylistic details the structured fields cannot express (texture, decorative treatments, letter-spacing, font-feature-settings). Limit ~1500 characters. Target only these stable class hooks: .scout-page, .scout-hero, .scout-hero-name, .scout-hero-tagline, .scout-hero-intro, .scout-section, .scout-section-header, .scout-section-eyebrow, .scout-section-numeral, .scout-section-title, .scout-work-list, .scout-work-item, .scout-work-title, .scout-work-meta, .scout-work-summary, .scout-work-stack, .scout-about, .scout-about-prose, .scout-about-sidebar, .scout-contact, .scout-contact-line, .scout-contact-list, .scout-rule, .scout-accent. You may also target :root (CSS variables only), and a/body/html (limited properties). @media size queries are allowed. Do NOT use @import, @font-face, * selectors, attribute selectors, or url() pointing anywhere except data: URIs. Anything outside this whitelist is dropped server-side."
    ),
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
    "Color palette, typography, layout composition, and optional custom CSS. The agent picks every field based on the user's brief; freedom is intentional."
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

// ---------------------------------------------------------------------------
// Style preferences: optional input to /api/generate-portfolio collected on
// the /configure page. Every field is optional. Empty preferences (=
// "Just decide for me") falls back to the editorial defaults.
// ---------------------------------------------------------------------------

export const StylePreferencesSchema = z
  .object({
    brief: z
      .string()
      .trim()
      .max(500)
      .optional()
      .describe(
        "Free-text user description of the portfolio they want. Treat as the strongest signal."
      ),
    presetId: z
      .string()
      .min(1)
      .max(40)
      .optional()
      .describe(
        "Optional theme preset ID to seed the baseline (editorial / developer / minimal / creative)."
      ),
    paletteId: z
      .string()
      .min(1)
      .max(40)
      .optional()
      .describe(
        "Optional color palette ID. Suggestion only; the brief may override."
      ),
    mode: z
      .enum(["light", "dark"])
      .optional()
      .describe(
        "Optional explicit mode. If omitted, the preset's default mode is used."
      ),
    layoutOverrides: z
      .object({
        hero: HeroVariantEnum.optional(),
        work: WorkVariantEnum.optional(),
        about: AboutVariantEnum.optional(),
        contact: ContactVariantEnum.optional(),
      })
      .optional()
      .describe(
        "User-pinned layout slots. Any pinned slot must be honored exactly by the agent."
      ),
  })
  .strict();

export type StylePreferences = z.infer<typeof StylePreferencesSchema>;

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
  if (
    content.theme.customCss !== undefined &&
    content.theme.customCss.length > 1500
  ) {
    return `theme.customCss exceeds 1500 character limit (${content.theme.customCss.length})`;
  }
  return null;
}
