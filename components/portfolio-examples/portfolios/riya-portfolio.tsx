import { Mail, Dribbble, ArrowUpRight } from "lucide-react";

const WORK_ITEMS = [
  {
    title: "Hue / Identity System",
    category: "Brand Identity",
    gradient: "from-rose-300/60 via-amber-200/40 to-violet-300/60",
  },
  {
    title: "Wavelength / Music App",
    category: "Product Design",
    gradient: "from-indigo-400/50 via-purple-300/40 to-pink-300/50",
  },
  {
    title: "Forma / Type Specimen",
    category: "Editorial",
    gradient: "from-stone-300/50 via-stone-200/30 to-stone-400/50",
  },
  {
    title: "Prism / AR Exhibit",
    category: "Experience Design",
    gradient: "from-cyan-300/50 via-emerald-200/40 to-blue-300/50",
  },
  {
    title: "Bloom / Packaging",
    category: "Brand Identity",
    gradient: "from-emerald-300/50 via-lime-200/40 to-teal-300/50",
  },
  {
    title: "Echo / Sound Viz",
    category: "Interaction Design",
    gradient: "from-amber-300/50 via-orange-200/40 to-red-300/50",
  },
];

const BRAND_COLORS = [
  { name: "Deep Plum", hex: "#3D2D4F", className: "bg-accent" },
  { name: "Warm White", hex: "#FAF8F5", className: "bg-background border border-border" },
  { name: "Rose Mist", hex: "#E8CCC8", className: "bg-[#E8CCC8]" },
  { name: "Fog", hex: "#D4D0CC", className: "bg-[#D4D0CC]" },
  { name: "Charcoal", hex: "#1A1A1A", className: "bg-foreground" },
];

export function RiyaHeroPage() {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <div className="flex items-center justify-between">
        <span className="font-serif text-sm italic text-foreground">R.P.</span>
        <div className="flex gap-3">
          <span className="text-[8px] uppercase tracking-widest text-muted">Work</span>
          <span className="text-[8px] uppercase tracking-widest text-muted">System</span>
          <span className="text-[8px] uppercase tracking-widest text-muted">About</span>
        </div>
      </div>
      <div className="mt-auto">
        <h2 className="font-serif text-3xl italic leading-none tracking-tight text-foreground">
          Riya Patel
        </h2>
        <p className="mt-2 text-[9px] leading-relaxed text-muted">
          Product Designer exploring brand systems,<br />
          visual identity, and the space between them.
        </p>
        <p className="mt-2 font-mono text-[7px] uppercase tracking-[0.2em] text-muted">
          Senior, Design / RISD
        </p>
      </div>
    </div>
  );
}

export function RiyaWorkPage() {
  return (
    <div className="flex h-full flex-col bg-background p-5">
      <p className="mb-3 font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
        Selected Work
      </p>
      <div className="grid flex-1 grid-cols-2 gap-2">
        {WORK_ITEMS.slice(0, 4).map((item) => (
          <div key={item.title} className="relative overflow-hidden rounded-lg">
            <div
              className={`absolute inset-0 bg-gradient-to-br ${item.gradient}`}
            />
            <div className="relative flex h-full flex-col justify-end p-2">
              <p className="text-[7px] font-medium leading-snug text-foreground/80">
                {item.title}
              </p>
              <p className="font-mono text-[6px] text-muted">{item.category}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function RiyaBrandPage() {
  return (
    <div className="flex h-full flex-col bg-background p-6">
      <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
        Design System
      </p>
      <div className="mt-3 space-y-3">
        <div>
          <p className="mb-1.5 text-[7px] font-medium text-foreground">Color Palette</p>
          <div className="flex gap-1.5">
            {BRAND_COLORS.map((c) => (
              <div key={c.name} className="flex flex-col items-center gap-1">
                <div className={`size-6 rounded-md ${c.className}`} />
                <span className="font-mono text-[5px] text-muted">{c.hex}</span>
              </div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1 text-[7px] font-medium text-foreground">Typography</p>
          <div className="space-y-1">
            <p className="font-serif text-sm italic text-foreground">
              Instrument Serif
            </p>
            <p className="text-[9px] text-muted">Instrument Sans / Body</p>
            <p className="font-mono text-[8px] text-muted">JetBrains Mono</p>
          </div>
        </div>
        <div className="rounded-md border border-border p-2">
          <p className="text-[6px] text-muted">
            A system built on warmth, restraint, and intentional contrast.
          </p>
        </div>
      </div>
    </div>
  );
}

export function RiyaContactPage() {
  return (
    <div className="flex h-full flex-col items-center justify-center bg-background p-6 text-center">
      <div className="size-8 rounded-full border border-accent/30 p-1">
        <div className="size-full rounded-full bg-accent/20" />
      </div>
      <h3 className="mt-3 font-serif text-base italic text-foreground">
        Let&rsquo;s create together.
      </h3>
      <p className="mt-1 text-[8px] text-muted">
        Open to brand, product, and<br />
        identity design collaborations.
      </p>
      <div className="mt-2.5 flex gap-3">
        <span className="flex items-center gap-1 text-[7px] text-muted">
          <Mail className="size-2" />
          riya@risd.edu
        </span>
        <span className="flex items-center gap-1 text-[7px] text-muted">
          <Dribbble className="size-2" />
          Dribbble
        </span>
      </div>
    </div>
  );
}

export function RiyaFullPortfolio() {
  return (
    <div className="bg-background">
      {/* Hero */}
      <section data-section="hero" className="px-10 pb-16 pt-12">
        <div className="flex items-center justify-between">
          <span className="font-serif text-lg italic text-foreground">R.P.</span>
          <nav className="flex gap-6">
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              Work
            </span>
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              System
            </span>
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              About
            </span>
            <span className="text-xs text-muted transition-colors hover:text-foreground">
              Contact
            </span>
          </nav>
        </div>
        <div className="mt-24">
          <h1 className="font-serif text-6xl italic tracking-tight text-foreground">
            Riya Patel
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
            Product Designer exploring brand systems, visual identity, and the
            space between them. Senior at RISD with a focus on systematic
            thinking applied to visual communication.
          </p>
          <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.2em] text-muted">
            Senior, Design / RISD
          </p>
        </div>
      </section>

      {/* Work Grid */}
      <section data-section="work" className="border-t border-border px-10 py-16">
        <p className="eyebrow mb-8">Selected Work</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {WORK_ITEMS.map((item) => (
            <div
              key={item.title}
              className="group relative aspect-[4/5] overflow-hidden rounded-xl"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${item.gradient} transition-transform duration-500 group-hover:scale-105`}
              />
              <div className="relative flex h-full flex-col justify-end p-5">
                <h3 className="text-sm font-medium text-foreground/90">
                  {item.title}
                </h3>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  {item.category}
                </p>
                <div className="mt-2 flex items-center gap-1 text-xs text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  View <ArrowUpRight className="size-3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Brand System */}
      <section data-section="system" className="border-t border-border px-10 py-16">
        <p className="eyebrow mb-8">Design System</p>
        <div className="grid gap-8 md:grid-cols-2">
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground">
              Color Palette
            </h3>
            <div className="flex gap-3">
              {BRAND_COLORS.map((c) => (
                <div key={c.name} className="flex flex-col items-center gap-2">
                  <div className={`size-14 rounded-xl ${c.className}`} />
                  <span className="text-[10px] text-muted">{c.name}</span>
                  <span className="font-mono text-[9px] text-muted/60">
                    {c.hex}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-4 text-sm font-medium text-foreground">
              Typography
            </h3>
            <div className="space-y-3">
              <div className="rounded-xl border border-border p-4">
                <p className="font-serif text-2xl italic text-foreground">
                  Instrument Serif
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  Display / Headlines
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="text-base text-foreground">Instrument Sans</p>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  Body / Interface
                </p>
              </div>
              <div className="rounded-xl border border-border p-4">
                <p className="font-mono text-sm text-foreground">
                  JetBrains Mono
                </p>
                <p className="mt-1 font-mono text-[10px] text-muted">
                  Labels / Code
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-8 rounded-xl border border-border p-6">
          <p className="text-sm leading-relaxed text-muted">
            A system built on warmth, restraint, and intentional contrast. The
            palette centers on deep aubergine as an anchor, warm off-white as a
            canvas, and rose mist as a gentle accent. Typography pairs an
            editorial serif for display with a clean sans for readability.
          </p>
        </div>
      </section>

      {/* Contact */}
      <section data-section="contact" className="border-t border-border px-10 py-20 text-center">
        <div className="mx-auto size-16 rounded-full border border-accent/30 p-2">
          <div className="size-full rounded-full bg-accent/20" />
        </div>
        <h3 className="mt-6 font-serif text-3xl italic text-foreground">
          Let&rsquo;s create together.
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm text-muted">
          Open to brand, product, and identity design collaborations. I believe
          every system tells a story; let me help tell yours.
        </p>
        <div className="mt-6 flex items-center justify-center gap-6">
          <span className="flex items-center gap-2 text-sm text-muted">
            <Mail className="size-4" />
            riya@risd.edu
          </span>
          <span className="flex items-center gap-2 text-sm text-muted">
            <Dribbble className="size-4" />
            Dribbble
          </span>
        </div>
      </section>
    </div>
  );
}
