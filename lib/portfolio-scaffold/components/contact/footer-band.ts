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
      className="scout-section scout-contact bg-rust text-paper px-6 py-20 md:py-28"
    >
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr,auto] md:items-end md:gap-16">
        <div>
          <p className="scout-section-eyebrow eyebrow text-paper/70 mb-3">
            {headline}
          </p>
          <p className="scout-contact-line font-display text-3xl italic leading-[1.1] md:text-5xl">
            {closingLine}
          </p>
        </div>
        <ul className="scout-contact-list flex flex-col gap-3 text-base">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className="group inline-flex items-baseline gap-3 border-b border-paper/30 pb-1 text-paper transition-colors hover:border-paper"
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  l.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
              >
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] opacity-70 transition-opacity group-hover:opacity-100">
                  {l.label}
                </span>
                <span className="font-display text-lg italic">
                  {labelFor(l.href)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
`;

export const footerBand: ComponentModule = {
  id: "footer-band",
  description:
    "Wide horizontal band painted in the rust accent color, paper-on-rust contrast. Closing line reads as an oversized italic display sentence on the left, link list stacked on the right. Best for visual / creative briefs that want a strong closing gesture.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const links = contactLinks(content.contact);
    const items = links
      .map((l) => {
        const isMail = l.href.startsWith("mailto:");
        return `
      <li>
        <a href="${escapeHtml(l.href)}"${isMail ? "" : ` target="_blank" rel="noopener noreferrer"`} class="band-link">
          <span class="band-key">${escapeHtml(l.label)}</span>
          <span class="band-val">${escapeHtml(linkLabel(l.href))}</span>
        </a>
      </li>`;
      })
      .join("");
    return `
    <section id="contact" class="scout-section scout-contact contact-band">
      <div class="container container-wide contact-band-grid">
        <div class="contact-band-copy">
          <p class="eyebrow scout-section-eyebrow contact-band-eyebrow">${escapeHtml(content.contact.headline)}</p>
          <p class="scout-contact-line contact-band-line">${escapeHtml(content.contact.closingLine)}</p>
        </div>
        <ul class="scout-contact-list contact-band-list">${items}</ul>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .contact-band {
    background: var(--color-rust);
    color: var(--color-paper);
    padding: 80px 24px;
  }
  .contact-band-grid { display: grid; gap: 40px; }
  .contact-band-eyebrow {
    color: color-mix(in srgb, var(--color-paper) 70%, transparent);
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
  }
  .contact-band-line {
    margin-top: 12px;
    font-family: var(--font-display);
    font-style: italic;
    font-size: 36px;
    line-height: 1.1;
    color: var(--color-paper);
  }
  .scout-contact-list.contact-band-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .band-link {
    display: inline-flex;
    align-items: baseline;
    gap: 12px;
    border-bottom: 1px solid color-mix(in srgb, var(--color-paper) 30%, transparent);
    padding-bottom: 4px;
    color: var(--color-paper);
    transition: border-color 0.2s ease;
  }
  .band-link:hover { border-color: var(--color-paper); }
  .band-key {
    font-family: var(--font-mono);
    font-size: 10px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    opacity: 0.7;
  }
  .band-val {
    font-family: var(--font-display);
    font-style: italic;
    font-size: 18px;
  }
  @media (min-width: 768px) {
    .contact-band { padding: 112px 24px; }
    .contact-band-grid { grid-template-columns: 1fr auto; align-items: end; gap: 64px; }
    .contact-band-line { font-size: 56px; }
  }
`,
};
