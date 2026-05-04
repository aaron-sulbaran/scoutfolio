import {
  DEFAULT_LAYOUT,
  DEFAULT_THEME,
  type AboutVariant,
  type BodyFont,
  type ContactVariant,
  type DisplayFont,
  type HeroVariant,
  type MonoFont,
  type Theme,
  type ThemeLayout,
  type ThemeMode,
  type WorkVariant,
} from "./themes";

// ---------------------------------------------------------------------------
// Color palettes
//
// Each palette has matched light + dark variants. The agent receives the
// resolved variant as a baseline theme, then is allowed to deviate based on
// the user's brief (e.g., brief says "deeper green" -> agent shifts the
// rust slot accordingly).
// ---------------------------------------------------------------------------

export type PaletteSwatches = {
  paper: string;
  ink: string;
  stone: string;
  rust: string;
  rule: string;
  card: string;
};

export type ColorPalette = {
  id: string;
  label: string;
  blurb: string;
  light: PaletteSwatches;
  dark: PaletteSwatches;
};

export const COLOR_PALETTES: ColorPalette[] = [
  {
    id: "bone-rust",
    label: "Bone & Rust",
    blurb: "Warm cream paper, rust accent. Studio Monograph default.",
    light: {
      paper: "#F2EEE5",
      ink: "#14110E",
      stone: "#6E665C",
      rust: "#B5462C",
      rule: "#DCD5C7",
      card: "#EDE7D9",
    },
    dark: {
      paper: "#0F0E0C",
      ink: "#EDE7D9",
      stone: "#9A9288",
      rust: "#D8704A",
      rule: "#2A2521",
      card: "#1A1714",
    },
  },
  {
    id: "aubergine-cream",
    label: "Aubergine Cream",
    blurb: "ScoutFolio brand palette. Deep aubergine accent on warm cream.",
    light: {
      paper: "#FAF8F5",
      ink: "#1A1A1A",
      stone: "#6B5E70",
      rust: "#3D2D4F",
      rule: "#EAE6E0",
      card: "#FDFBF8",
    },
    dark: {
      paper: "#15101A",
      ink: "#F1ECEE",
      stone: "#9F8FA3",
      rust: "#B89DD9",
      rule: "#2C2333",
      card: "#1F1828",
    },
  },
  {
    id: "ocean-blue",
    label: "Ocean Blue",
    blurb: "Cool slate paper, deep marine accent.",
    light: {
      paper: "#EEF2F6",
      ink: "#0E1A24",
      stone: "#5C6F80",
      rust: "#1E5C8A",
      rule: "#D6DEE6",
      card: "#E2E8EE",
    },
    dark: {
      paper: "#0B1620",
      ink: "#DCE5EC",
      stone: "#7C8B98",
      rust: "#67A6D1",
      rule: "#1B2832",
      card: "#13202C",
    },
  },
  {
    id: "forest-green",
    label: "Forest Green",
    blurb: "Bone paper, deep forest accent.",
    light: {
      paper: "#F1EEE6",
      ink: "#13190E",
      stone: "#5F6B58",
      rust: "#2F5D34",
      rule: "#D8DBCD",
      card: "#E5E5D6",
    },
    dark: {
      paper: "#0C140C",
      ink: "#E4ECDF",
      stone: "#869884",
      rust: "#7BB66E",
      rule: "#1F2B20",
      card: "#13201A",
    },
  },
  {
    id: "crimson",
    label: "Crimson",
    blurb: "Warm cream, deep crimson accent.",
    light: {
      paper: "#F4EFEA",
      ink: "#1B0F11",
      stone: "#7A5E5F",
      rust: "#B0202E",
      rule: "#E2D7D5",
      card: "#EFE4DF",
    },
    dark: {
      paper: "#180B0E",
      ink: "#F1E0DE",
      stone: "#A38484",
      rust: "#E55A5C",
      rule: "#291417",
      card: "#1F0F12",
    },
  },
  {
    id: "amber",
    label: "Amber",
    blurb: "Bone paper, sunset amber accent.",
    light: {
      paper: "#F5F0E2",
      ink: "#1A150C",
      stone: "#7A6A50",
      rust: "#C77A1F",
      rule: "#E5DBC2",
      card: "#EFE5C9",
    },
    dark: {
      paper: "#140F08",
      ink: "#F2E6CC",
      stone: "#A89B7E",
      rust: "#E89F45",
      rule: "#2A2014",
      card: "#1B1407",
    },
  },
  {
    id: "indigo",
    label: "Indigo",
    blurb: "Cool stone paper, deep indigo accent.",
    light: {
      paper: "#EFEFF5",
      ink: "#101225",
      stone: "#666980",
      rust: "#3A3DAE",
      rule: "#D6D6E2",
      card: "#E2E2EC",
    },
    dark: {
      paper: "#0B0C18",
      ink: "#E0E1F0",
      stone: "#878AA3",
      rust: "#7479D6",
      rule: "#1A1C30",
      card: "#13152A",
    },
  },
  {
    id: "mono",
    label: "Mono",
    blurb: "Black, white, single grey rule. Maximum reduction.",
    light: {
      paper: "#FFFFFF",
      ink: "#0A0A0A",
      stone: "#737373",
      rust: "#0A0A0A",
      rule: "#E5E5E5",
      card: "#F5F5F5",
    },
    dark: {
      paper: "#0A0A0A",
      ink: "#FAFAFA",
      stone: "#A1A1A1",
      rust: "#FAFAFA",
      rule: "#262626",
      card: "#171717",
    },
  },
];

export function findPalette(id: string | undefined): ColorPalette | undefined {
  if (!id) return undefined;
  return COLOR_PALETTES.find((p) => p.id === id);
}

export function paletteSwatches(
  palette: ColorPalette,
  mode: ThemeMode
): PaletteSwatches {
  return mode === "dark" ? palette.dark : palette.light;
}

// ---------------------------------------------------------------------------
// Theme presets
//
// Surfaced under the optional "Refine the details" disclosure on /configure
// as starting suggestions. Not the primary input. The user's free-text brief
// is what mainly drives the agent.
// ---------------------------------------------------------------------------

export type ThemePreset = {
  id: string;
  label: string;
  blurb: string;
  layout: ThemeLayout;
  defaultMode: ThemeMode;
  defaultPaletteId: string;
  fonts: {
    display: DisplayFont;
    body: BodyFont;
    mono: MonoFont;
  };
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "editorial",
    label: "Editorial",
    blurb:
      "Studio Monograph. Numbered sections, drop caps, work ledger. Fraunces + DM Sans.",
    layout: {
      hero: "centered-editorial",
      work: "ledger-grid",
      about: "drop-cap",
      contact: "card-bordered",
    },
    defaultMode: "light",
    defaultPaletteId: "bone-rust",
    fonts: { display: "fraunces", body: "dm-sans", mono: "ibm-plex-mono" },
  },
  {
    id: "developer",
    label: "Developer",
    blurb:
      "Terminal aesthetic. Mono prompt header, bracketed section markers, projects render like git log entries.",
    layout: {
      hero: "terminal-prompt",
      work: "git-log",
      about: "code-block",
      contact: "code-block",
    },
    defaultMode: "dark",
    defaultPaletteId: "mono",
    fonts: {
      display: "space-grotesk",
      body: "geist",
      mono: "jetbrains-mono",
    },
  },
  {
    id: "minimal",
    label: "Minimal",
    blurb:
      "Stripped to a single column. Generous rhythm, hairline rules, no decoration.",
    layout: {
      hero: "minimal-stack",
      work: "list-stack",
      about: "single-block",
      contact: "inline-middots",
    },
    defaultMode: "light",
    defaultPaletteId: "mono",
    fonts: { display: "hanken-grotesk", body: "inter-tight", mono: "geist-mono" },
  },
  {
    id: "creative",
    label: "Creative",
    blurb:
      "Asymmetric grid, expressive display type, larger gestures. For visual portfolios.",
    layout: {
      hero: "asymmetric-display",
      work: "gallery-asymmetric",
      about: "pull-quote",
      contact: "footer-band",
    },
    defaultMode: "light",
    defaultPaletteId: "crimson",
    fonts: {
      display: "playfair-display",
      body: "work-sans",
      mono: "space-mono",
    },
  },
];

export function findPreset(id: string | undefined): ThemePreset | undefined {
  if (!id) return undefined;
  return THEME_PRESETS.find((p) => p.id === id);
}

// ---------------------------------------------------------------------------
// resolveBaselineTheme
//
// Takes optional style preferences from the configure form and produces a
// fully-formed Theme the agent receives as its starting baseline. The agent
// is then free to adjust any field based on the user's free-text brief.
// ---------------------------------------------------------------------------

export type StylePreferencesInput = {
  brief?: string;
  mode?: ThemeMode;
  paletteId?: string;
  presetId?: string;
  layoutOverrides?: {
    hero?: HeroVariant;
    work?: WorkVariant;
    about?: AboutVariant;
    contact?: ContactVariant;
  };
};

export function resolveBaselineTheme(
  prefs: StylePreferencesInput | undefined
): Theme {
  const p = prefs ?? {};
  const preset = findPreset(p.presetId) ?? THEME_PRESETS[0];
  const mode: ThemeMode = p.mode ?? preset.defaultMode;
  const palette =
    findPalette(p.paletteId) ??
    findPalette(preset.defaultPaletteId) ??
    COLOR_PALETTES[0];

  const swatches = paletteSwatches(palette, mode);
  const layout: ThemeLayout = {
    hero: p.layoutOverrides?.hero ?? preset.layout.hero,
    work: p.layoutOverrides?.work ?? preset.layout.work,
    about: p.layoutOverrides?.about ?? preset.layout.about,
    contact: p.layoutOverrides?.contact ?? preset.layout.contact,
  };

  return {
    mode,
    colors: { ...swatches },
    fonts: { ...preset.fonts },
    layout,
  };
}

export function isLayoutComplete(
  layout: Partial<ThemeLayout>
): layout is ThemeLayout {
  return (
    typeof layout.hero === "string" &&
    typeof layout.work === "string" &&
    typeof layout.about === "string" &&
    typeof layout.contact === "string"
  );
}

export function fillLayoutDefaults(
  layout: Partial<ThemeLayout> | undefined
): ThemeLayout {
  return {
    hero: layout?.hero ?? DEFAULT_LAYOUT.hero,
    work: layout?.work ?? DEFAULT_LAYOUT.work,
    about: layout?.about ?? DEFAULT_LAYOUT.about,
    contact: layout?.contact ?? DEFAULT_LAYOUT.contact,
  };
}

void DEFAULT_THEME;
