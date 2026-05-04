// Theme registry. Drives both the export's globals.css/layout.tsx and the
// preview HTML's inline CSS + Google Fonts URL. Keep these in sync: every
// font key here must work in both next/font/google (export) and the public
// Google Fonts CSS API (preview).

export type DisplayFont =
  | "fraunces"
  | "instrument-serif"
  | "playfair-display"
  | "cormorant-garamond"
  | "space-grotesk";

export type BodyFont =
  | "dm-sans"
  | "inter-tight"
  | "manrope"
  | "work-sans"
  | "geist";

export type MonoFont =
  | "ibm-plex-mono"
  | "jetbrains-mono"
  | "geist-mono"
  | "space-mono";

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
};

export const DISPLAY_FONTS: Record<DisplayFont, FontEntry> = {
  fraunces: {
    importName: "Fraunces",
    cssFamily: "Fraunces",
    cssVar: "--font-fraunces",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-fraunces",
  style: ["normal", "italic"],
  display: "swap",
}`,
    googleSpec:
      "Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..700",
  },
  "instrument-serif": {
    importName: "Instrument_Serif",
    cssFamily: "Instrument Serif",
    cssVar: "--font-instrument-serif",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  weight: "400",
  style: ["normal", "italic"],
  display: "swap",
}`,
    googleSpec: "Instrument+Serif:ital@0;1",
  },
  "playfair-display": {
    importName: "Playfair_Display",
    cssFamily: "Playfair Display",
    cssVar: "--font-playfair-display",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-playfair-display",
  style: ["normal", "italic"],
  display: "swap",
}`,
    googleSpec: "Playfair+Display:ital,wght@0,400..900;1,400..900",
  },
  "cormorant-garamond": {
    importName: "Cormorant_Garamond",
    cssFamily: "Cormorant Garamond",
    cssVar: "--font-cormorant-garamond",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-cormorant-garamond",
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
}`,
    googleSpec:
      "Cormorant+Garamond:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700",
  },
  "space-grotesk": {
    importName: "Space_Grotesk",
    cssFamily: "Space Grotesk",
    cssVar: "--font-space-grotesk",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  display: "swap",
}`,
    googleSpec: "Space+Grotesk:wght@300..700",
  },
};

export const BODY_FONTS: Record<BodyFont, FontEntry> = {
  "dm-sans": {
    importName: "DM_Sans",
    cssFamily: "DM Sans",
    cssVar: "--font-dm-sans",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
}`,
    googleSpec: "DM+Sans:wght@400;500;700",
  },
  "inter-tight": {
    importName: "Inter_Tight",
    cssFamily: "Inter Tight",
    cssVar: "--font-inter-tight",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
}`,
    googleSpec: "Inter+Tight:wght@300..700",
  },
  manrope: {
    importName: "Manrope",
    cssFamily: "Manrope",
    cssVar: "--font-manrope",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
}`,
    googleSpec: "Manrope:wght@200..800",
  },
  "work-sans": {
    importName: "Work_Sans",
    cssFamily: "Work Sans",
    cssVar: "--font-work-sans",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-work-sans",
  display: "swap",
}`,
    googleSpec: "Work+Sans:wght@300..700",
  },
  geist: {
    importName: "Geist",
    cssFamily: "Geist",
    cssVar: "--font-geist",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
}`,
    googleSpec: "Geist:wght@300..700",
  },
};

export const MONO_FONTS: Record<MonoFont, FontEntry> = {
  "ibm-plex-mono": {
    importName: "IBM_Plex_Mono",
    cssFamily: "IBM Plex Mono",
    cssVar: "--font-ibm-plex-mono",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  display: "swap",
}`,
    googleSpec: "IBM+Plex+Mono:wght@400;500",
  },
  "jetbrains-mono": {
    importName: "JetBrains_Mono",
    cssFamily: "JetBrains Mono",
    cssVar: "--font-jetbrains-mono",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500"],
  display: "swap",
}`,
    googleSpec: "JetBrains+Mono:wght@400;500",
  },
  "geist-mono": {
    importName: "Geist_Mono",
    cssFamily: "Geist Mono",
    cssVar: "--font-geist-mono",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-geist-mono",
  weight: ["400", "500"],
  display: "swap",
}`,
    googleSpec: "Geist+Mono:wght@400;500",
  },
  "space-mono": {
    importName: "Space_Mono",
    cssFamily: "Space Mono",
    cssVar: "--font-space-mono",
    nextFontConfig: `{
  subsets: ["latin"],
  variable: "--font-space-mono",
  weight: ["400", "700"],
  display: "swap",
}`,
    googleSpec: "Space+Mono:wght@400;700",
  },
};

export type ThemeMode = "light" | "dark";

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
