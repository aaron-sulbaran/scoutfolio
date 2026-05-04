import { Github, Mail, ArrowUpRight, Star } from "lucide-react";

const PROJECTS = [
  {
    name: "taskflow",
    stars: 142,
    description: "Multiplayer kanban built on Yjs + Supabase Realtime",
    tech: ["TypeScript", "React", "Yjs", "Supabase"],
    color: "from-emerald-500/20 to-emerald-500/5",
  },
  {
    name: "deno-edge-cache",
    stars: 38,
    description: "Stale-while-revalidate caching middleware for Deno Deploy",
    tech: ["Deno", "TypeScript", "Edge"],
    color: "from-cyan-400/20 to-cyan-400/5",
  },
  {
    name: "build-log",
    stars: 17,
    description: "Why I rewrote my homepage in 4 hours (and what I learned)",
    tech: ["Next.js", "MDX", "Vercel"],
    color: "from-amber-400/20 to-amber-400/5",
  },
];

const SKILLS_GRID = [
  { name: "TypeScript", abbr: "TS", color: "bg-blue-400" },
  { name: "React", abbr: "Re", color: "bg-cyan-400" },
  { name: "Next.js", abbr: "Nx", color: "bg-white" },
  { name: "Node.js", abbr: "No", color: "bg-emerald-400" },
  { name: "PostgreSQL", abbr: "Pg", color: "bg-blue-300" },
  { name: "Redis", abbr: "Rd", color: "bg-red-400" },
  { name: "Docker", abbr: "Dk", color: "bg-blue-500" },
  { name: "Rust", abbr: "Rs", color: "bg-orange-400" },
];

export function JordanHeroPage() {
  return (
    <div className="flex h-full flex-col bg-[#0f0f13] p-6">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] text-white/60">jp.dev</span>
        <div className="flex gap-3">
          <span className="text-[8px] uppercase tracking-widest text-white/40">
            Projects
          </span>
          <span className="text-[8px] uppercase tracking-widest text-white/40">
            About
          </span>
        </div>
      </div>
      <div className="mt-auto">
        <h2 className="font-mono text-xl leading-none text-white">
          jordan-park
          <span className="animate-pulse text-emerald-400">.dev</span>
        </h2>
        <p className="mt-2 text-[9px] leading-relaxed text-white/50">
          CS Junior at UCLA, building tools for developers.<br />
          Interested in real-time systems and edge computing.
        </p>
        <div className="mt-3 flex gap-2">
          <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[7px] text-white/60">
            open to work
          </span>
          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 font-mono text-[7px] text-emerald-400">
            product engineering
          </span>
        </div>
      </div>
    </div>
  );
}

export function JordanProjectsPage() {
  return (
    <div className="flex h-full flex-col bg-[#0f0f13] p-6">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
        Featured Projects
      </p>
      <div className="mt-3 space-y-2">
        {PROJECTS.map((project) => (
          <div
            key={project.name}
            className="rounded-lg border border-white/10 bg-white/5 p-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] text-white">
                {project.name}
              </span>
              <span className="flex items-center gap-0.5 text-[8px] text-amber-400/80">
                <Star className="size-2" />
                {project.stars}
              </span>
            </div>
            <p className="mt-1 text-[8px] leading-relaxed text-white/40">
              {project.description}
            </p>
            <div className="mt-1.5 flex gap-1">
              {project.tech.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="rounded bg-white/8 px-1 py-0.5 font-mono text-[6px] text-white/50"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function JordanSkillsPage() {
  return (
    <div className="flex h-full flex-col bg-[#0f0f13] p-6">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/40">
        Tech Stack
      </p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {SKILLS_GRID.map((skill) => (
          <div
            key={skill.abbr}
            className="flex flex-col items-center gap-1.5 rounded-lg border border-white/8 bg-white/5 p-2.5"
          >
            <div
              className={`flex size-5 items-center justify-center rounded-md ${skill.color}`}
            >
              <span className="font-mono text-[7px] font-bold text-[#0f0f13]">
                {skill.abbr}
              </span>
            </div>
            <span className="text-center font-mono text-[6px] text-white/50">
              {skill.name}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-auto rounded-md border border-white/8 bg-white/5 p-2.5">
        <div className="flex items-center gap-1.5">
          <div className="size-1.5 rounded-full bg-emerald-400" />
          <span className="font-mono text-[7px] text-white/40">
            1,247 contributions this year
          </span>
        </div>
      </div>
    </div>
  );
}

export function JordanContactPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-[#0f0f13] p-6 text-center">
      <div className="flex size-10 items-center justify-center rounded-full border border-white/10">
        <span className="font-mono text-sm text-emerald-400">&gt;_</span>
      </div>
      <h3 className="mt-3 font-mono text-sm text-white">
        let&rsquo;s build something
      </h3>
      <p className="mt-1 text-[8px] text-white/40">
        Open to internships in product engineering,<br />
        infra, and developer tools.
      </p>
      <div className="mt-3 flex gap-3">
        <span className="flex items-center gap-1 text-[8px] text-white/50">
          <Github className="size-2.5" />
          @jpark
        </span>
        <span className="flex items-center gap-1 text-[8px] text-white/50">
          <Mail className="size-2.5" />
          jordan@ucla.edu
        </span>
      </div>
    </div>
  );
}

export function JordanFullPortfolio() {
  return (
    <div className="bg-[#0f0f13]">
      {/* Hero */}
      <section data-section="hero" className="px-10 pb-16 pt-12">
        <div className="flex items-center justify-between">
          <span className="font-mono text-sm text-white/60">jp.dev</span>
          <nav className="flex gap-6">
            <span className="font-mono text-xs text-white/40 transition-colors hover:text-white">
              Projects
            </span>
            <span className="font-mono text-xs text-white/40 transition-colors hover:text-white">
              About
            </span>
            <span className="font-mono text-xs text-white/40 transition-colors hover:text-white">
              Contact
            </span>
          </nav>
        </div>
        <div className="mt-24">
          <h1 className="font-mono text-4xl text-white">
            jordan-park
            <span className="text-emerald-400">.dev</span>
          </h1>
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/50">
            CS Junior at UCLA. I build tools that make developers faster. Interested
            in real-time collaboration, edge computing, and the gap between prototype
            and production.
          </p>
          <div className="mt-6 flex gap-3">
            <span className="rounded-md bg-white/10 px-3 py-1.5 font-mono text-xs text-white/60">
              open to work
            </span>
            <span className="rounded-md bg-emerald-500/20 px-3 py-1.5 font-mono text-xs text-emerald-400">
              product engineering
            </span>
          </div>
        </div>
      </section>

      {/* Projects */}
      <section data-section="projects" className="border-t border-white/10 px-10 py-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          Featured Projects
        </p>
        <div className="space-y-5">
          {PROJECTS.map((project) => (
            <div
              key={project.name}
              className="group rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-white/20"
            >
              <div className={`mb-4 h-24 rounded-lg bg-gradient-to-br ${project.color}`} />
              <div className="flex items-center justify-between">
                <h3 className="font-mono text-lg text-white">{project.name}</h3>
                <span className="flex items-center gap-1 text-sm text-amber-400/80">
                  <Star className="size-3.5" />
                  {project.stars}
                </span>
              </div>
              <p className="mt-2 text-sm text-white/40">{project.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {project.tech.map((t) => (
                  <span
                    key={t}
                    className="rounded-md bg-white/8 px-2.5 py-1 font-mono text-[10px] text-white/50"
                  >
                    {t}
                  </span>
                ))}
              </div>
              <div className="mt-4 flex items-center gap-1 font-mono text-xs text-emerald-400 opacity-0 transition-opacity group-hover:opacity-100">
                View project <ArrowUpRight className="size-3" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Skills */}
      <section data-section="skills" className="border-t border-white/10 px-10 py-16">
        <p className="mb-8 font-mono text-xs uppercase tracking-[0.2em] text-white/40">
          Tech Stack
        </p>
        <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
          {SKILLS_GRID.map((skill) => (
            <div
              key={skill.abbr}
              className="flex flex-col items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-4"
            >
              <div
                className={`flex size-8 items-center justify-center rounded-lg ${skill.color}`}
              >
                <span className="font-mono text-xs font-bold text-[#0f0f13]">
                  {skill.abbr}
                </span>
              </div>
              <span className="text-center font-mono text-[10px] text-white/50">
                {skill.name}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.03] p-5">
          <div className="flex items-center gap-2">
            <div className="size-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-sm text-white/50">
              1,247 contributions this year
            </span>
          </div>
          <div className="mt-3 flex h-6 gap-0.5">
            {Array.from({ length: 52 }).map((_, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{
                  backgroundColor: `rgba(52, 211, 153, ${0.1 + Math.random() * 0.5})`,
                }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Contact */}
      <section data-section="contact" className="border-t border-white/10 px-10 py-20 text-center">
        <div className="mx-auto flex size-16 items-center justify-center rounded-full border border-white/10">
          <span className="font-mono text-xl text-emerald-400">&gt;_</span>
        </div>
        <h3 className="mt-6 font-mono text-2xl text-white">
          let&rsquo;s build something
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm text-white/40">
          Open to internships in product engineering, infrastructure, and developer
          tools. I write code that ships.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="flex items-center gap-2 font-mono text-sm text-white/50">
            <Github className="size-4" />
            @jpark
          </span>
          <span className="flex items-center gap-2 font-mono text-sm text-white/50">
            <Mail className="size-4" />
            jordan@ucla.edu
          </span>
        </div>
      </section>
    </div>
  );
}
