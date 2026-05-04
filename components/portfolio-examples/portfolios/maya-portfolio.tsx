import { Mail, Linkedin, ArrowUpRight } from "lucide-react";

const CASE_STUDIES = [
  {
    title: "How students choose what to make next",
    method: "Field Study",
    participants: "n=22",
    description:
      "Observed 22 Information Studies students over 6 weeks to map their project-selection heuristics. Uncovered three decision archetypes.",
    color: "from-accent/20 to-accent/5",
  },
  {
    title: "Redesigning the on-campus shuttle wait",
    method: "Service Blueprint",
    participants: "8 routes",
    description:
      "Mapped the end-to-end shuttle experience from app check to drop-off. Identified four friction moments and prototyped a predictive ETA feature.",
    color: "from-muted/15 to-muted/5",
  },
  {
    title: "What recruiters actually skim",
    method: "Diary Study",
    participants: "n=14",
    description:
      "Recruited 14 tech recruiters for a two-week diary study on portfolio review habits. Found that case study structure matters more than visual polish.",
    color: "from-accent/15 to-border",
  },
];

const SKILLS = [
  "User Interviews",
  "Contextual Inquiry",
  "Affinity Mapping",
  "Service Blueprinting",
  "Usability Testing",
  "Survey Design",
  "Figma",
  "Miro",
  "Dovetail",
];

export function MayaHeroPage() {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <div className="flex items-center justify-between">
        <span className="font-serif text-sm text-foreground">MC</span>
        <div className="flex gap-4">
          <span className="text-[9px] uppercase tracking-widest text-muted">Work</span>
          <span className="text-[9px] uppercase tracking-widest text-muted">About</span>
          <span className="text-[9px] uppercase tracking-widest text-muted">Contact</span>
        </div>
      </div>
      <div className="mt-auto">
        <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
          UX Researcher
        </p>
        <h2 className="mt-2 font-serif text-2xl leading-none tracking-tight text-foreground">
          Maya Chen
        </h2>
        <p className="mt-2 text-[10px] leading-relaxed text-muted">
          I study how people make decisions, then design<br />
          systems that respect those patterns.
        </p>
      </div>
      <div className="mt-4 h-px w-12 bg-accent/40" />
    </div>
  );
}

export function MayaCaseStudiesPage() {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
        Selected Work
      </p>
      <div className="mt-3 space-y-2.5">
        {CASE_STUDIES.map((study) => (
          <div
            key={study.title}
            className="rounded-lg border border-border bg-card p-3"
          >
            <div className="mb-2 h-8 rounded bg-gradient-to-br from-accent/10 to-border/60" />
            <p className="text-[9px] font-medium leading-snug text-foreground">
              {study.title}
            </p>
            <div className="mt-1.5 flex gap-1.5">
              <span className="rounded-full bg-accent/10 px-1.5 py-0.5 font-mono text-[7px] text-accent">
                {study.method}
              </span>
              <span className="rounded-full bg-muted/10 px-1.5 py-0.5 font-mono text-[7px] text-muted">
                {study.participants}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function MayaAboutPage() {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">About</p>
      <div className="mt-3 flex gap-3">
        <div className="size-12 shrink-0 rounded-full bg-gradient-to-br from-accent/30 to-muted/20" />
        <div>
          <p className="text-[9px] font-medium text-foreground">Maya Chen</p>
          <p className="text-[8px] text-muted">Junior, Information Studies</p>
          <p className="text-[8px] text-muted">UT Austin</p>
        </div>
      </div>
      <p className="mt-3 text-[8px] leading-relaxed text-muted">
        I believe good research is invisible; it shows up as products that
        feel intuitive rather than research that sits in a slide deck.
        Currently exploring mixed-methods approaches to evaluate AI-driven
        interfaces.
      </p>
      <div className="mt-3">
        <p className="mb-1.5 font-mono text-[7px] uppercase tracking-[0.2em] text-muted">
          Methods
        </p>
        <div className="flex flex-wrap gap-1">
          {SKILLS.slice(0, 6).map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-1.5 py-0.5 text-[7px] text-muted"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MayaContactPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-6 text-center">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
        Get in Touch
      </p>
      <h3 className="mt-2 font-serif text-lg text-foreground">
        Let&rsquo;s talk research.
      </h3>
      <div className="mt-3 flex gap-3">
        <div className="flex items-center gap-1 text-[8px] text-muted">
          <Mail className="size-2.5" />
          maya@utexas.edu
        </div>
        <div className="flex items-center gap-1 text-[8px] text-muted">
          <Linkedin className="size-2.5" />
          LinkedIn
        </div>
      </div>
    </div>
  );
}

export function MayaFullPortfolio() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section data-section="hero" className="px-10 pb-16 pt-12">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg text-foreground">MC</span>
          <nav className="flex gap-6">
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              Work
            </span>
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              About
            </span>
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              Contact
            </span>
          </nav>
        </div>
        <div className="mt-20">
          <p className="eyebrow">UX Researcher</p>
          <h1 className="mt-3 font-serif text-5xl tracking-tight text-foreground">
            Maya Chen
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            I study how people make decisions, then design systems that respect
            those patterns. Junior at UT Austin studying Information Studies,
            focused on mixed-methods research for product teams.
          </p>
        </div>
        <div className="mt-8 h-px w-20 bg-accent/40" />
      </section>

      {/* Case Studies */}
      <section data-section="work" className="border-t border-border px-10 py-16">
        <p className="eyebrow mb-8">Selected Work</p>
        <div className="space-y-6">
          {CASE_STUDIES.map((study) => (
            <div
              key={study.title}
              className="group rounded-xl border border-border p-6 transition-colors hover:border-accent/30"
            >
              <div
                className={`mb-5 h-32 rounded-lg bg-gradient-to-br ${study.color}`}
              />
              <h3 className="font-serif text-xl text-foreground">
                {study.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {study.description}
              </p>
              <div className="mt-4 flex gap-2">
                <span className="rounded-full bg-accent/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-accent">
                  {study.method}
                </span>
                <span className="rounded-full bg-muted/10 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-muted">
                  {study.participants}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-1 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                Read case study <ArrowUpRight className="size-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* About */}
      <section data-section="about" className="border-t border-border px-10 py-16">
        <p className="eyebrow mb-8">About</p>
        <div className="flex gap-8">
          <div className="size-24 shrink-0 rounded-full bg-gradient-to-br from-accent/30 to-muted/20" />
          <div>
            <h3 className="font-serif text-2xl text-foreground">
              A researcher who codes.
            </h3>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted">
              I believe good research is invisible; it shows up as products
              that feel intuitive rather than research that sits in a slide
              deck. Currently exploring mixed-methods approaches to evaluate
              AI-driven interfaces and their impact on decision-making.
            </p>
            <div className="mt-6">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
                Methods &amp; Tools
              </p>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section data-section="contact" className="border-t border-border px-10 py-20 text-center">
        <p className="eyebrow mb-4">Get in Touch</p>
        <h3 className="font-serif text-3xl text-foreground">
          Let&rsquo;s talk research.
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Open to research internships, contract work, and collaborations
          in product research and design strategy.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Mail className="size-4" />
            maya@utexas.edu
          </span>
          <span className="flex items-center gap-2 text-sm text-muted">
            <Linkedin className="size-4" />
            LinkedIn
          </span>
        </div>
      </section>
    </div>
  );
}
