// Theme registry. Drives both the export's globals.css/layout.tsx and the
// preview HTML's inline CSS + Google Fonts URL. Keep these in sync: every
// font key here must work in both next/font/google (export) and the public
// Google Fonts CSS API (preview).

export type DisplayFont =
  | "fraunces"
  | "instrument-serif"
  | "playfair-display"
  | "cormorant-garamond"
  | "eb-garamond"
  | "lora"
  | "space-grotesk"
  | "bricolage-grotesque"
  | "hanken-grotesk"
  | "familjen-grotesk"
  | "archivo-black"
  | "fjalla-one"
  | "bebas-neue"
  | "anton"
  | "big-shoulders-display"
  | "caveat"
  | "permanent-marker"
  | "pacifico"
  | "abril-fatface"
  | "yeseva-one";

export type BodyFont =
  | "dm-sans"
  | "inter-tight"
  | "manrope"
  | "work-sans"
  | "geist"
  | "public-sans"
  | "sora"
  | "source-serif-4"
  | "crimson-pro"
  | "lora";

export type MonoFont =
  | "ibm-plex-mono"
  | "jetbrains-mono"
  | "geist-mono"
  | "space-mono"
  | "fira-code"
  | "dm-mono";

export type FontEntry = {
  /** Export-side: named export from `next/font/google`. */
  importName: string;
  /** CSS family name for the preview iframe. */
  cssFamily: string;
  /** CSS custom property the variable font binding writes to (must be unique). */
  cssVar: string;
  /** Constructor argument literal for `next/font/google`. */
  nextFontConfig: string;
  /** Spec following `family=` in Google Fonts CSS API v2 URL. */
  googleSpec: string;
  /** Short categorical hint for the agent prompt (e.g., "editorial serif"). */
  category: string;
};

function fontConfig(varName: string, opts?: { weight?: string[]; italic?: boolean }): string {
  const lines: string[] = [`subsets: ["latin"]`, `variable: "${varName}"`];
  if (opts?.weight) {
    lines.push(`weight: [${opts.weight.map((w) => `"${w}"`).join(", ")}]`);
  }
  if (opts?.italic) {
    lines.push(`style: ["normal", "italic"]`);
  }
  lines.push(`display: "swap"`);
  return `{\n  ${lines.join(",\n  ")},\n}`;
}

export const DISPLAY_FONTS: Record<DisplayFont, FontEntry> = {
  fraunces: {
    importName: "Fraunces",
    cssFamily: "Fraunces",
    cssVar: "--font-fraunces",
    nextFontConfig: fontConfig("--font-fraunces", { italic: true }),
    googleSpec:
      "Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700",
    category: "editorial serif (Studio Monograph default)",
  },
  "instrument-serif": {
    importName: "Instrument_Serif",
    cssFamily: "Instrument Serif",
    cssVar: "--font-instrument-serif",
    nextFontConfig: fontConfig("--font-instrument-serif", {
      weight: ["400"],
      italic: true,
    }),
    googleSpec: "Instrument+Serif:ital@0;1",
    category: "editorial serif (literary)",
  },
  "playfair-display": {
    importName: "Playfair_Display",
    cssFamily: "Playfair Display",
    cssVar: "--font-playfair-display",
    nextFontConfig: fontConfig("--font-playfair-display", { italic: true }),
    googleSpec: "Playfair+Display:ital,wght@0,400..900;1,400..900",
    category: "editorial serif (high contrast)",
  },
  "cormorant-garamond": {
    importName: "Cormorant_Garamond",
    cssFamily: "Cormorant Garamond",
    cssVar: "--font-cormorant-garamond",
    nextFontConfig: fontConfig("--font-cormorant-garamond", {
      weight: ["400", "500", "600", "700"],
      italic: true,
    }),
    googleSpec:
      "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700",
    category: "editorial serif (elegant)",
  },
  "eb-garamond": {
    importName: "EB_Garamond",
    cssFamily: "EB Garamond",
    cssVar: "--font-eb-garamond",
    nextFontConfig: fontConfig("--font-eb-garamond", { italic: true }),
    googleSpec: "EB+Garamond:ital,wght@0,400..800;1,400..800",
    category: "classical serif",
  },
  lora: {
    importName: "Lora",
    cssFamily: "Lora",
    cssVar: "--font-lora",
    nextFontConfig: fontConfig("--font-lora", { italic: true }),
    googleSpec: "Lora:ital,wght@0,400..700;1,400..700",
    category: "editorial serif (warm)",
  },
  "space-grotesk": {
    importName: "Space_Grotesk",
    cssFamily: "Space Grotesk",
    cssVar: "--font-space-grotesk",
    nextFontConfig: fontConfig("--font-space-grotesk"),
    googleSpec: "Space+Grotesk:wght@300..700",
    category: "geometric sans (technical)",
  },
  "bricolage-grotesque": {
    importName: "Bricolage_Grotesque",
    cssFamily: "Bricolage Grotesque",
    cssVar: "--font-bricolage-grotesque",
    nextFontConfig: fontConfig("--font-bricolage-grotesque"),
    googleSpec: "Bricolage+Grotesque:opsz,wght@12..96,200..800",
    category: "geometric sans (modern)",
  },
  "hanken-grotesk": {
    importName: "Hanken_Grotesk",
    cssFamily: "Hanken Grotesk",
    cssVar: "--font-hanken-grotesk",
    nextFontConfig: fontConfig("--font-hanken-grotesk"),
    googleSpec: "Hanken+Grotesk:wght@300..900",
    category: "geometric sans (clean)",
  },
  "familjen-grotesk": {
    importName: "Familjen_Grotesk",
    cssFamily: "Familjen Grotesk",
    cssVar: "--font-familjen-grotesk",
    nextFontConfig: fontConfig("--font-familjen-grotesk", { italic: true }),
    googleSpec: "Familjen+Grotesk:ital,wght@0,400..700;1,400..700",
    category: "geometric sans (humanist)",
  },
  "archivo-black": {
    importName: "Archivo_Black",
    cssFamily: "Archivo Black",
    cssVar: "--font-archivo-black",
    nextFontConfig: fontConfig("--font-archivo-black", { weight: ["400"] }),
    googleSpec: "Archivo+Black",
    category: "brutalist heavy display",
  },
  "fjalla-one": {
    importName: "Fjalla_One",
    cssFamily: "Fjalla One",
    cssVar: "--font-fjalla-one",
    nextFontConfig: fontConfig("--font-fjalla-one", { weight: ["400"] }),
    googleSpec: "Fjalla+One",
    category: "condensed display",
  },
  "bebas-neue": {
    importName: "Bebas_Neue",
    cssFamily: "Bebas Neue",
    cssVar: "--font-bebas-neue",
    nextFontConfig: fontConfig("--font-bebas-neue", { weight: ["400"] }),
    googleSpec: "Bebas+Neue",
    category: "narrow display (poster)",
  },
  anton: {
    importName: "Anton",
    cssFamily: "Anton",
    cssVar: "--font-anton",
    nextFontConfig: fontConfig("--font-anton", { weight: ["400"] }),
    googleSpec: "Anton",
    category: "narrow display (heavy)",
  },
  "big-shoulders-display": {
    importName: "Big_Shoulders_Display",
    cssFamily: "Big Shoulders Display",
    cssVar: "--font-big-shoulders-display",
    nextFontConfig: fontConfig("--font-big-shoulders-display"),
    googleSpec: "Big+Shoulders+Display:wght@300..900",
    category: "industrial display",
  },
  caveat: {
    importName: "Caveat",
    cssFamily: "Caveat",
    cssVar: "--font-caveat",
    nextFontConfig: fontConfig("--font-caveat"),
    googleSpec: "Caveat:wght@400..700",
    category: "handwritten script",
  },
  "permanent-marker": {
    importName: "Permanent_Marker",
    cssFamily: "Permanent Marker",
    cssVar: "--font-permanent-marker",
    nextFontConfig: fontConfig("--font-permanent-marker", { weight: ["400"] }),
    googleSpec: "Permanent+Marker",
    category: "marker handwritten",
  },
  pacifico: {
    importName: "Pacifico",
    cssFamily: "Pacifico",
    cssVar: "--font-pacifico",
    nextFontConfig: fontConfig("--font-pacifico", { weight: ["400"] }),
    googleSpec: "Pacifico",
    category: "casual script",
  },
  "abril-fatface": {
    importName: "Abril_Fatface",
    cssFamily: "Abril Fatface",
    cssVar: "--font-abril-fatface",
    nextFontConfig: fontConfig("--font-abril-fatface", { weight: ["400"] }),
    googleSpec: "Abril+Fatface",
    category: "heavy display serif (retro)",
  },
  "yeseva-one": {
    importName: "Yeseva_One",
    cssFamily: "Yeseva One",
    cssVar: "--font-yeseva-one",
    nextFontConfig: fontConfig("--font-yeseva-one", { weight: ["400"] }),
    googleSpec: "Yeseva+One",
    category: "expressive display serif",
  },
};

export const BODY_FONTS: Record<BodyFont, FontEntry> = {
  "dm-sans": {
    importName: "DM_Sans",
    cssFamily: "DM Sans",
    cssVar: "--font-dm-sans",
    nextFontConfig: fontConfig("--font-dm-sans"),
    googleSpec: "DM+Sans:wght@400;500;700",
    category: "neutral sans (default body)",
  },
  "inter-tight": {
    importName: "Inter_Tight",
    cssFamily: "Inter Tight",
    cssVar: "--font-inter-tight",
    nextFontConfig: fontConfig("--font-inter-tight"),
    googleSpec: "Inter+Tight:wght@300..700",
    category: "neutral sans (tight)",
  },
  manrope: {
    importName: "Manrope",
    cssFamily: "Manrope",
    cssVar: "--font-manrope",
    nextFontConfig: fontConfig("--font-manrope"),
    googleSpec: "Manrope:wght@200..800",
    category: "neutral sans (rounded)",
  },
  "work-sans": {
    importName: "Work_Sans",
    cssFamily: "Work Sans",
    cssVar: "--font-work-sans",
    nextFontConfig: fontConfig("--font-work-sans"),
    googleSpec: "Work+Sans:wght@300..700",
    category: "neutral sans (workhorse)",
  },
  geist: {
    importName: "Geist",
    cssFamily: "Geist",
    cssVar: "--font-geist",
    nextFontConfig: fontConfig("--font-geist"),
    googleSpec: "Geist:wght@300..700",
    category: "neutral sans (Vercel)",
  },
  "public-sans": {
    importName: "Public_Sans",
    cssFamily: "Public Sans",
    cssVar: "--font-public-sans",
    nextFontConfig: fontConfig("--font-public-sans"),
    googleSpec: "Public+Sans:wght@300..700",
    category: "neutral sans (institutional)",
  },
  sora: {
    importName: "Sora",
    cssFamily: "Sora",
    cssVar: "--font-sora",
    nextFontConfig: fontConfig("--font-sora"),
    googleSpec: "Sora:wght@200..800",
    category: "geometric sans (futuristic)",
  },
  "source-serif-4": {
    importName: "Source_Serif_4",
    cssFamily: "Source Serif 4",
    cssVar: "--font-source-serif-4",
    nextFontConfig: fontConfig("--font-source-serif-4", { italic: true }),
    googleSpec: "Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900",
    category: "transitional serif (long-form)",
  },
  "crimson-pro": {
    importName: "Crimson_Pro",
    cssFamily: "Crimson Pro",
    cssVar: "--font-crimson-pro",
    nextFontConfig: fontConfig("--font-crimson-pro", { italic: true }),
    googleSpec: "Crimson+Pro:ital,wght@0,200..900;1,200..900",
    category: "old-style serif (book)",
  },
  lora: {
    importName: "Lora",
    cssFamily: "Lora",
    cssVar: "--font-lora-body",
    nextFontConfig: fontConfig("--font-lora-body", { italic: true }),
    googleSpec: "Lora:ital,wght@0,400..700;1,400..700",
    category: "warm serif (body)",
  },
};

export const MONO_FONTS: Record<MonoFont, FontEntry> = {
  "ibm-plex-mono": {
    importName: "IBM_Plex_Mono",
    cssFamily: "IBM Plex Mono",
    cssVar: "--font-ibm-plex-mono",
    nextFontConfig: fontConfig("--font-ibm-plex-mono", {
      weight: ["400", "500"],
    }),
    googleSpec: "IBM+Plex+Mono:wght@400;500",
    category: "humanist mono",
  },
  "jetbrains-mono": {
    importName: "JetBrains_Mono",
    cssFamily: "JetBrains Mono",
    cssVar: "--font-jetbrains-mono",
    nextFontConfig: fontConfig("--font-jetbrains-mono", {
      weight: ["400", "500"],
    }),
    googleSpec: "JetBrains+Mono:wght@400;500",
    category: "developer mono (terminal feel)",
  },
  "geist-mono": {
    importName: "Geist_Mono",
    cssFamily: "Geist Mono",
    cssVar: "--font-geist-mono",
    nextFontConfig: fontConfig("--font-geist-mono", { weight: ["400", "500"] }),
    googleSpec: "Geist+Mono:wght@400;500",
    category: "modern mono (Vercel)",
  },
  "space-mono": {
    importName: "Space_Mono",
    cssFamily: "Space Mono",
    cssVar: "--font-space-mono",
    nextFontConfig: fontConfig("--font-space-mono", { weight: ["400", "700"] }),
    googleSpec: "Space+Mono:wght@400;700",
    category: "geometric mono",
  },
  "fira-code": {
    importName: "Fira_Code",
    cssFamily: "Fira Code",
    cssVar: "--font-fira-code",
    nextFontConfig: fontConfig("--font-fira-code", { weight: ["400", "500"] }),
    googleSpec: "Fira+Code:wght@300..700",
    category: "developer mono (ligatures)",
  },
  "dm-mono": {
    importName: "DM_Mono",
    cssFamily: "DM Mono",
    cssVar: "--font-dm-mono",
    nextFontConfig: fontConfig("--font-dm-mono", {
      weight: ["400", "500"],
      italic: true,
    }),
    googleSpec: "DM+Mono:ital,wght@0,400;0,500;1,400;1,500",
    category: "soft mono",
  },
};

export type ThemeMode = "light" | "dark";

export type ThemeLayout = {
  hero: HeroVariant;
  work: WorkVariant;
  about: AboutVariant;
  contact: ContactVariant;
};

export type HeroVariant =
  | "centered-editorial"
  | "asymmetric-display"
  | "terminal-prompt"
  | "minimal-stack";

export type WorkVariant =
  | "ledger-grid"
  | "card-grid"
  | "list-stack"
  | "git-log"
  | "gallery-asymmetric";

export type AboutVariant =
  | "drop-cap"
  | "pull-quote"
  | "code-block"
  | "single-block";

export type ContactVariant =
  | "card-bordered"
  | "inline-middots"
  | "code-block"
  | "footer-band";

export type Theme = {
  mode: ThemeMode;
  colors: {
    paper: string;
    ink: string;
    stone: string;
    rust: string;
    rule: string;
    card: string;
  };
  fonts: {
    display: DisplayFont;
    body: BodyFont;
    mono: MonoFont;
  };
  layout: ThemeLayout;
  customCss?: string;
};

export const DEFAULT_LAYOUT: ThemeLayout = {
  hero: "centered-editorial",
  work: "ledger-grid",
  about: "drop-cap",
  contact: "card-bordered",
};

export const DEFAULT_THEME: Theme = {
  mode: "light",
  colors: {
    paper: "#F2EEE5",
    ink: "#14110E",
    stone: "#6E665C",
    rust: "#B5462C",
    rule: "#DCD5C7",
    card: "#EDE7D9",
  },
  fonts: {
    display: "fraunces",
    body: "dm-sans",
    mono: "ibm-plex-mono",
  },
  layout: DEFAULT_LAYOUT,
};

export const DARK_PRESET_HINT: Theme = {
  mode: "dark",
  colors: {
    paper: "#0F0E0C",
    ink: "#EDE7D9",
    stone: "#9A9288",
    rust: "#D8704A",
    rule: "#2A2521",
    card: "#1A1714",
  },
  fonts: {
    display: "fraunces",
    body: "dm-sans",
    mono: "ibm-plex-mono",
  },
  layout: DEFAULT_LAYOUT,
};

const HEX_RE = /^#[0-9A-Fa-f]{6}$/;

export function isValidHex(s: string): boolean {
  return HEX_RE.test(s);
}

export function dotColorFor(mode: ThemeMode): string {
  return mode === "dark"
    ? "rgba(255, 245, 230, 0.04)"
    : "rgba(20, 17, 14, 0.025)";
}

export function selectionFgFor(theme: Theme): string {
  // Use paper as the selection foreground so text inverts on either palette.
  return theme.colors.paper;
}

export const DISPLAY_FONT_IDS = [
  "fraunces",
  "instrument-serif",
  "playfair-display",
  "cormorant-garamond",
  "eb-garamond",
  "lora",
  "space-grotesk",
  "bricolage-grotesque",
  "hanken-grotesk",
  "familjen-grotesk",
  "archivo-black",
  "fjalla-one",
  "bebas-neue",
  "anton",
  "big-shoulders-display",
  "caveat",
  "permanent-marker",
  "pacifico",
  "abril-fatface",
  "yeseva-one",
] as const satisfies readonly DisplayFont[];

export const BODY_FONT_IDS = [
  "dm-sans",
  "inter-tight",
  "manrope",
  "work-sans",
  "geist",
  "public-sans",
  "sora",
  "source-serif-4",
  "crimson-pro",
  "lora",
] as const satisfies readonly BodyFont[];

export const MONO_FONT_IDS = [
  "ibm-plex-mono",
  "jetbrains-mono",
  "geist-mono",
  "space-mono",
  "fira-code",
  "dm-mono",
] as const satisfies readonly MonoFont[];

export const HERO_VARIANT_IDS = [
  "centered-editorial",
  "asymmetric-display",
  "terminal-prompt",
  "minimal-stack",
] as const satisfies readonly HeroVariant[];

export const WORK_VARIANT_IDS = [
  "ledger-grid",
  "card-grid",
  "list-stack",
  "git-log",
  "gallery-asymmetric",
] as const satisfies readonly WorkVariant[];

export const ABOUT_VARIANT_IDS = [
  "drop-cap",
  "pull-quote",
  "code-block",
  "single-block",
] as const satisfies readonly AboutVariant[];

export const CONTACT_VARIANT_IDS = [
  "card-bordered",
  "inline-middots",
  "code-block",
  "footer-band",
] as const satisfies readonly ContactVariant[];
