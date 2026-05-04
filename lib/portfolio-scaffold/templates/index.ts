// Component registry. Each layout slot maps to a set of variant modules. The
// orchestrators (`compose-tsx.ts`, `compose-preview.ts`) consult this registry
// to pick the right module for a given `theme.layout`.

import type { ComponentModule } from "../components/types";
import type {
  AboutVariant,
  ContactVariant,
  HeroVariant,
  WorkVariant,
} from "../themes";

import { centeredEditorial } from "../components/hero/centered-editorial";
import { asymmetricDisplay } from "../components/hero/asymmetric-display";
import { terminalPrompt } from "../components/hero/terminal-prompt";
import { minimalStack } from "../components/hero/minimal-stack";

import { ledgerGrid } from "../components/work/ledger-grid";
import { cardGrid } from "../components/work/card-grid";
import { listStack } from "../components/work/list-stack";
import { gitLog } from "../components/work/git-log";
import { galleryAsymmetric } from "../components/work/gallery-asymmetric";

import { dropCap } from "../components/about/drop-cap";
import { pullQuote } from "../components/about/pull-quote";
import { codeBlock as aboutCodeBlock } from "../components/about/code-block";
import { singleBlock } from "../components/about/single-block";

import { cardBordered } from "../components/contact/card-bordered";
import { inlineMiddots } from "../components/contact/inline-middots";
import { codeBlock as contactCodeBlock } from "../components/contact/code-block";
import { footerBand } from "../components/contact/footer-band";

export const HERO_REGISTRY: Record<HeroVariant, ComponentModule> = {
  "centered-editorial": centeredEditorial,
  "asymmetric-display": asymmetricDisplay,
  "terminal-prompt": terminalPrompt,
  "minimal-stack": minimalStack,
};

export const WORK_REGISTRY: Record<WorkVariant, ComponentModule> = {
  "ledger-grid": ledgerGrid,
  "card-grid": cardGrid,
  "list-stack": listStack,
  "git-log": gitLog,
  "gallery-asymmetric": galleryAsymmetric,
};

export const ABOUT_REGISTRY: Record<AboutVariant, ComponentModule> = {
  "drop-cap": dropCap,
  "pull-quote": pullQuote,
  "code-block": aboutCodeBlock,
  "single-block": singleBlock,
};

export const CONTACT_REGISTRY: Record<ContactVariant, ComponentModule> = {
  "card-bordered": cardBordered,
  "inline-middots": inlineMiddots,
  "code-block": contactCodeBlock,
  "footer-band": footerBand,
};

export function selectHero(variant: HeroVariant): ComponentModule {
  return HERO_REGISTRY[variant] ?? centeredEditorial;
}

export function selectWork(variant: WorkVariant): ComponentModule {
  return WORK_REGISTRY[variant] ?? ledgerGrid;
}

export function selectAbout(variant: AboutVariant): ComponentModule {
  return ABOUT_REGISTRY[variant] ?? dropCap;
}

export function selectContact(variant: ContactVariant): ComponentModule {
  return CONTACT_REGISTRY[variant] ?? cardBordered;
}

export function describeLayoutVocabulary(): string {
  const lines: string[] = [];
  lines.push("HERO variants:");
  for (const v of Object.values(HERO_REGISTRY)) {
    lines.push(`  - ${v.id}: ${v.description}`);
  }
  lines.push("WORK variants:");
  for (const v of Object.values(WORK_REGISTRY)) {
    lines.push(`  - ${v.id}: ${v.description}`);
  }
  lines.push("ABOUT variants:");
  for (const v of Object.values(ABOUT_REGISTRY)) {
    lines.push(`  - ${v.id}: ${v.description}`);
  }
  lines.push("CONTACT variants:");
  for (const v of Object.values(CONTACT_REGISTRY)) {
    lines.push(`  - ${v.id}: ${v.description}`);
  }
  return lines.join("\n");
}
