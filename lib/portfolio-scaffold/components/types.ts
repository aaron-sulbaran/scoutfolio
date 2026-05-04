// Shared interfaces for individual layout component modules.
//
// Each component module exports both:
//   - buildTsx: the source for the exported component file (e.g. hero.tsx)
//   - buildPreviewMarkup: an HTML string for the iframe preview
//   - buildPreviewCss: scoped CSS that styles the preview markup
//
// Both halves render the same data via the same `.scout-*` class hooks, so
// the iframe and the exported portfolio look identical and the agent's
// optional customCss can target either consistently.

import type { PortfolioContent } from "../templates/_common";

export type ComponentModule = {
  /** Matches the schema enum value (e.g. "centered-editorial"). */
  id: string;
  /** Short description shown to the agent in the system prompt. */
  description: string;
  /** Source for the exported component .tsx file. */
  buildTsx: (content: PortfolioContent) => string;
  /** HTML string for the iframe preview (escaped, no scripts). */
  buildPreviewMarkup: (content: PortfolioContent) => string;
  /** CSS this component contributes to the preview iframe. */
  buildPreviewCss: () => string;
};

export type SectionKind = "hero" | "work" | "about" | "contact";
