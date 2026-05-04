import type { ComponentModule } from "../types";
import { escapeHtml, type PortfolioContent } from "../../templates/_common";

const TSX = `import { content } from "../data";

export default function About() {
  const { headline, paragraphs, sidebar } = content.about;
  const focusList = sidebar.focusAreas.length > 0
    ? sidebar.focusAreas.map((f) => \`"\${f}"\`).join(", ")
    : "[]";
  return (
    <section
      id="about"
      className="scout-section scout-about scout-about-code border-t border-rule px-6 py-20 md:py-28"
    >
      <div className="mx-auto max-w-3xl">
        <p className="scout-section-eyebrow text-[11px] tracking-[0.18em] text-stone">
          $ cat ./about.md
        </p>

        <pre className="scout-pre scout-about-prose mt-8 overflow-x-auto whitespace-pre-wrap font-mono text-[13px] leading-[1.7]">
{\`# \${headline}

\${paragraphs.join("\\n\\n")}\`}
        </pre>

        <div className="scout-about-sidebar mt-8 rounded-sm border border-rule bg-card p-5 font-mono text-[12px] leading-[1.7] text-ink">
          <span className="text-stone">// metadata</span>
          {"\\n"}
          {sidebar.basedIn ? (
            <>
              <span className="text-rust">based_in</span>
              <span className="text-stone"> = </span>
              <span>&quot;{sidebar.basedIn}&quot;</span>
              {"\\n"}
            </>
          ) : null}
          <span className="text-rust">focus</span>
          <span className="text-stone"> = </span>
          <span>[{focusList}]</span>
          {sidebar.currentlyExploring ? (
            <>
              {"\\n"}
              <span className="text-rust">currently</span>
              <span className="text-stone"> = </span>
              <span>&quot;{sidebar.currentlyExploring}&quot;</span>
            </>
          ) : null}
        </div>
      </div>
    </section>
  );
}
`;

export const codeBlock: ComponentModule = {
  id: "code-block",
  description:
    "About rendered as a `cat ./about.md` mono block (bordered, soft-tinted background, line-wrapped) with a metadata block below using key = value syntax for sidebar fields. Best for developer briefs.",
  buildTsx: () => TSX,
  buildPreviewMarkup: (content: PortfolioContent) => {
    const { paragraphs, sidebar, headline } = content.about;
    const body = `# ${escapeHtml(headline)}\n\n${paragraphs.map((p) => escapeHtml(p)).join("\n\n")}`;
    const meta: string[] = ["<span class=\"scout-comment\">// metadata</span>"];
    if (sidebar.basedIn) {
      meta.push(
        `<span class="scout-keyword">based_in</span><span class="scout-comment"> = </span><span class="scout-string">&quot;${escapeHtml(sidebar.basedIn)}&quot;</span>`
      );
    }
    const focusList =
      sidebar.focusAreas.length > 0
        ? `[${sidebar.focusAreas.map((f) => `&quot;${escapeHtml(f)}&quot;`).join(", ")}]`
        : "[]";
    meta.push(
      `<span class="scout-keyword">focus</span><span class="scout-comment"> = </span><span class="scout-string">${focusList}</span>`
    );
    if (sidebar.currentlyExploring) {
      meta.push(
        `<span class="scout-keyword">currently</span><span class="scout-comment"> = </span><span class="scout-string">&quot;${escapeHtml(sidebar.currentlyExploring)}&quot;</span>`
      );
    }

    return `
    <section id="about" class="scout-section scout-about scout-about-code section bordered">
      <div class="container">
        <p class="eyebrow scout-section-eyebrow">$ cat ./about.md</p>
        <pre class="scout-pre scout-about-prose code-about-pre">${body}</pre>
        <div class="scout-about-sidebar code-about-meta">${meta.join("\n")}</div>
      </div>
    </section>
  `;
  },
  buildPreviewCss: () => `
  .scout-about-code .code-about-pre { margin-top: 32px; }
  .scout-about-code .code-about-meta {
    margin-top: 24px;
    border: 1px solid var(--color-rule);
    background: var(--color-card);
    padding: 20px;
    font-family: var(--font-mono);
    font-size: 12px;
    line-height: 1.7;
    color: var(--color-ink);
    border-radius: 2px;
    white-space: pre-wrap;
  }
`,
};
