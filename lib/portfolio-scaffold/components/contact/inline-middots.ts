import type { ComponentModule } from "../types";
import {
  contactLinks,
  escapeHtml,
  linkLabel,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";
import { ensureUrl, labelFor } from "./_shared";

export default function Contact() {
  const { headline, closingLine, email, github, linkedin, website } =
    content.contact;
  const links: Array<{ label: string; href: string }> = [];
  if (email) links.push({ label: "Email", href: \`mailto:\${email}\` });
  if (github) links.push({ label: "GitHub", href: ensureUrl(github) });
  if (linkedin) links.push({ label: "LinkedIn", href: ensureUrl(linkedin) });
  if (website) links.push({ label: "Website", href: ensureUrl(website) });

  return (
    <section
      id="contact"
      className="scout-section scout-contact border-t border-rule px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-xl text-center">
        <p className="scout-section-eyebrow eyebrow mb-4">{headline}</p>
        <p className="scout-contact-line font-display text-2xl leading-[1.4] text-ink md:text-3xl">
          {closingLine}
        </p>
        <ul className="scout-contact-list mt-10 flex flex-wrap items-baseline justify-center gap-x-3 gap-y-2 text-sm text-ink/85">
          {links.map((l, i) => (
            <li key={l.label} className="flex items-baseline gap-3">
              {i > 0 ? <span className="text-stone">&middot;</span> : null}
              <a
                href={l.href}
                className="underline decoration-rust/40 underline-offset-4 transition-colors hover:decoration-rust hover:text-rust"
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  l.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
              >
                {labelFor(l.href)}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
`;

export const inlineMiddots: ComponentModule = {
  id: "inline-middots",
  description:
    "Centered closing line + a single horizontal row of links separated by middots, hairline underline only. No card, no key labels, no footer chrome. Best for minimal briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const links = contactLinks(content.contact);
    const linkItems = links
      .map((l, i) => {
        const isMail = l.href.startsWith("mailto:");
        const sep = i > 0 ? `<span class="middot-sep">&middot;</span>` : "";
        return `${sep}<a href="${escapeHtml(l.href)}"${isMail ? "" : ` target="_blank" rel="noopener noreferrer"`} class="middot-link">${escapeHtml(linkLabel(l.href))}</a>`;
      })
      .join("");
    return `
    <section id="contact" class="scout-section scout-contact section bordered">
      <div class="container container-narrow middot-wrap">
        <p class="eyebrow scout-section-eyebrow">${escapeHtml(content.contact.headline)}</p>
        <p class="scout-contact-line middot-line">${escapeHtml(content.contact.closingLine)}</p>
        <p class="scout-contact-list middot-links">${linkItems}</p>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .middot-wrap { text-align: center; }
  .middot-line {
    margin-top: 16px;
    font-family: var(--font-display);
    font-size: 26px;
    line-height: 1.4;
    color: var(--color-ink);
  }
  .scout-contact-list.middot-links {
    margin-top: 32px;
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    align-items: baseline;
    gap: 8px 12px;
    font-size: 14px;
    color: color-mix(in srgb, var(--color-ink) 85%, transparent);
  }
  .middot-sep { color: var(--color-stone); }
  .middot-link {
    text-decoration: underline;
    text-decoration-color: color-mix(in srgb, var(--color-rust) 40%, transparent);
    text-underline-offset: 4px;
  }
  .middot-link:hover { color: var(--color-rust); text-decoration-color: var(--color-rust); }
  @media (min-width: 768px) {
    .middot-line { font-size: 30px; }
  }
`,
};
