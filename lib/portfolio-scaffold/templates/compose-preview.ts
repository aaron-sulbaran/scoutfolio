import {
  BODY_FONTS,
  DISPLAY_FONTS,
  MONO_FONTS,
} from "../themes";
import {
  buildBasePreviewCss,
  escapeHtml,
  type PortfolioContent,
} from "./_common";
import {
  selectAbout,
  selectContact,
  selectHero,
  selectWork,
} from "./index";

export function buildPreviewHtml(content: PortfolioContent): string {
  const theme = content.theme;
  const display = DISPLAY_FONTS[theme.fonts.display];
  const body = BODY_FONTS[theme.fonts.body];
  const mono = MONO_FONTS[theme.fonts.mono];
  const fontsHref = `https://fonts.googleapis.com/css2?family=${display.googleSpec}&family=${body.googleSpec}&family=${mono.googleSpec}&display=swap`;

  const hero = selectHero(theme.layout.hero);
  const work = selectWork(theme.layout.work);
  const about = selectAbout(theme.layout.about);
  const contact = selectContact(theme.layout.contact);

  const css = [
    buildBasePreviewCss(theme),
    hero.buildPreviewCss(),
    work.buildPreviewCss(),
    about.buildPreviewCss(),
    contact.buildPreviewCss(),
    theme.customCss ?? "",
  ].join("\n");

  const heroMarkup = hero.buildPreviewMarkup(content);
  const workMarkup = work.buildPreviewMarkup(content);
  const aboutMarkup = about.buildPreviewMarkup(content);
  const contactMarkup = contact.buildPreviewMarkup(content);

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(content.name)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="${fontsHref}" rel="stylesheet" />
<style>${css}</style>
</head>
<body class="scout-page">
${heroMarkup}
${workMarkup}
${aboutMarkup}
${contactMarkup}
</body>
</html>`;
}
