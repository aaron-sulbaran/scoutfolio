import type { ComponentModule } from "../types";
import {
  contactLinks,
  escapeHtml,
  linkLabel,
  type PortfolioContent,
} from "../../templates/_common";

const TSX = `import { content } from "../data";
import { ensureUrl } from "./_shared";

export default function Contact() {
  const { headline, closingLine, email, github, linkedin, website } =
    content.contact;
  const links: Array<{ label: string; href: string }> = [];
  if (email) links.push({ label: "email", href: \`mailto:\${email}\` });
  if (github) links.push({ label: "github", href: ensureUrl(github) });
  if (linkedin) links.push({ label: "linkedin", href: ensureUrl(linkedin) });
  if (website) links.push({ label: "website", href: ensureUrl(website) });

  return (
    <section
      id="contact"
      className="scout-section scout-contact font-mono px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <p className="scout-section-eyebrow text-[11px] tracking-[0.18em] text-stone">
          $ cat ./contact.json
        </p>
        <pre className="scout-pre mt-8 overflow-x-auto whitespace-pre-wrap font-mono text-sm leading-[1.7]">
{\`{
  "tagline": "\${headline.replace(/"/g, '\\"')}",
  "message": "\${closingLine.replace(/"/g, '\\"')}",
  "links": [
\${links.map((l) => \`    { "label": "\${l.label}", "href": "\${l.href}" }\`).join(",\\n")}
  ]
}\`}
        </pre>

        <ul className="scout-contact-list mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {links.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                target={l.href.startsWith("mailto:") ? undefined : "_blank"}
                rel={
                  l.href.startsWith("mailto:")
                    ? undefined
                    : "noopener noreferrer"
                }
                className="flex items-baseline gap-3 border border-rule px-4 py-3 transition-colors hover:border-rust hover:text-rust"
              >
                <span className="text-rust">&rarr;</span>
                <span className="text-stone">{l.label}:</span>
                <span className="text-ink">{l.href}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
`;

export const codeBlock: ComponentModule = {
  id: "code-block",
  description:
    "Contact rendered as a JSON code block (`cat ./contact.json`) with a clickable list of `→ label: href` rows below. Best for developer briefs. Pairs with terminal-prompt hero and git-log work.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const links = contactLinks(content.contact).map((l) => ({
      ...l,
      label: l.label.toLowerCase(),
    }));
    const jsonLinks = links
      .map(
        (l) =>
          `    { "label": "${escapeHtml(l.label)}", "href": "${escapeHtml(l.href)}" }`
      )
      .join(",\n");
    const jsonBody = `{
  "tagline": "${escapeHtml(content.contact.headline)}",
  "message": "${escapeHtml(content.contact.closingLine)}",
  "links": [
${jsonLinks}
  ]
}`;
    const linkRows = links
      .map((l) => {
        const isMail = l.href.startsWith("mailto:");
        return `
      <li>
        <a href="${escapeHtml(l.href)}"${isMail ? "" : ` target="_blank" rel="noopener noreferrer"`} class="contact-code-row">
          <span class="contact-code-arrow">&rarr;</span>
          <span class="contact-code-key">${escapeHtml(l.label)}:</span>
          <span class="contact-code-val">${escapeHtml(linkLabel(l.href))}</span>
        </a>
      </li>`;
      })
      .join("");
    return `
    <section id="contact" class="scout-section scout-contact section contact-code-section">
      <div class="container">
        <p class="eyebrow scout-section-eyebrow contact-code-prompt">$ cat ./contact.json</p>
        <pre class="scout-pre contact-code-pre">${jsonBody}</pre>
        <ul class="scout-contact-list contact-code-list">${linkRows}</ul>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .contact-code-section { font-family: var(--font-mono); }
  .contact-code-prompt { font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.18em; text-transform: uppercase; color: var(--color-stone); }
  .contact-code-pre { margin-top: 24px; }
  .scout-contact-list.contact-code-list { list-style: none; margin-top: 32px; display: grid; gap: 10px; grid-template-columns: 1fr; }
  .contact-code-row {
    display: flex;
    align-items: baseline;
    gap: 12px;
    border: 1px solid var(--color-rule);
    padding: 12px 16px;
    transition: border-color 0.2s ease, color 0.2s ease;
    font-family: var(--font-mono);
    font-size: 13px;
  }
  .contact-code-row:hover { border-color: var(--color-rust); color: var(--color-rust); }
  .contact-code-arrow { color: var(--color-rust); }
  .contact-code-key { color: var(--color-stone); }
  .contact-code-val { color: var(--color-ink); word-break: break-all; }
  @media (min-width: 640px) {
    .scout-contact-list.contact-code-list { grid-template-columns: 1fr 1fr; }
  }
`,
};
