import type { ComponentModule } from "../types";
import {
  contactLinks,
  escapeHtml,
  linkLabel,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";
import { SectionHeader, ensureUrl, labelFor } from "./_shared";

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
      <div className="mx-auto max-w-3xl">
        <SectionHeader
          numeral="§03"
          label="Contact"
          title=""
          emphasized={headline}
        />

        <p className="scout-contact-line font-display text-2xl leading-[1.3] text-ink md:text-3xl">
          {closingLine}
        </p>

        <div className="mt-10 rule-rust scout-rule" />

        <ul className="scout-contact-list mt-10 flex flex-wrap gap-x-10 gap-y-4">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="group inline-flex items-baseline gap-3 text-ink transition-colors hover:text-rust"
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  l.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-stone group-hover:text-rust">
                  {l.label}
                </span>
                <span className="font-display text-lg italic">
                  {labelFor(l.href)}
                </span>
              </a>
            </li>
          ))}
        </ul>

        <p className="mt-20 font-mono text-[10px] uppercase tracking-[0.2em] text-stone">
          Built with ScoutFolio &middot; A Vercel Zero to Agent project
        </p>
      </div>
    </section>
  );
}
`;

export const cardBordered: ComponentModule = {
  id: "card-bordered",
  description:
    "Bordered closing card: numbered eyebrow + closing line + rust hairline + key/value link list (Studio Monograph default).",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const links = contactLinks(content.contact);
    const linksHtml = links
      .map((l) => {
        const isMail = l.href.startsWith("mailto:");
        return `
      <li>
        <a href="${escapeHtml(l.href)}"${isMail ? "" : ` target="_blank" rel="noopener noreferrer"`}>
          <span class="key">${escapeHtml(l.label)}</span>
          <span class="value">${escapeHtml(linkLabel(l.href))}</span>
        </a>
      </li>`;
      })
      .join("");

    return `
    <section id="contact" class="scout-section scout-contact section bordered">
      <div class="container">
        <div class="scout-section-header section-header">
          <span class="scout-section-numeral section-numeral">&sect;03</span>
          <div>
            <p class="eyebrow scout-section-eyebrow label">Contact</p>
            <h2 class="scout-section-title"><span class="em">${escapeHtml(content.contact.headline)}</span></h2>
          </div>
        </div>
        <p class="scout-contact-line contact-line">${escapeHtml(content.contact.closingLine)}</p>
        <div class="rule-rust scout-rule contact-rule"></div>
        <ul class="scout-contact-list contact-list">${linksHtml}</ul>
        <p class="contact-footer">Built with ScoutFolio &middot; A Vercel Zero to Agent project</p>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-contact-line.contact-line {
    font-family: var(--font-display);
    font-size: 26px;
    line-height: 1.3;
    color: var(--color-ink);
  }
  .scout-contact-list.contact-list { list-style: none; margin-top: 40px; display: flex; flex-wrap: wrap; gap: 16px 40px; }
  .scout-contact-list a {
    display: inline-flex;
    align-items: baseline;
    gap: 12px;
    color: var(--color-ink);
    transition: color 0.2s ease;
  }
  .scout-contact-list a:hover { color: var(--color-rust); }
  .scout-contact-list .key {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: var(--color-stone);
  }
  .scout-contact-list .value {
    font-family: var(--font-display);
    font-size: 18px;
    font-style: italic;
  }
  .contact-rule { margin-top: 40px; }
  .contact-footer {
    margin-top: 80px;
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.2em;
    color: var(--color-stone);
  }
  @media (min-width: 768px) {
    .scout-contact-line.contact-line { font-size: 32px; }
  }
`,
};
