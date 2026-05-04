import type { ScaffoldFile } from "../files";
import { SHARED_TSX, type PortfolioContent } from "./_common";
import {
  selectAbout,
  selectContact,
  selectHero,
  selectWork,
} from "./index";

const PAGE_TSX = `import Hero from "./components/hero";
import Work from "./components/work";
import About from "./components/about";
import Contact from "./components/contact";

export default function Home() {
  return (
    <main className="scout-page">
      <Hero />
      <Work />
      <About />
      <Contact />
    </main>
  );
}
`;

export function buildComponentFiles(
  content: PortfolioContent
): ScaffoldFile[] {
  const hero = selectHero(content.theme.layout.hero);
  const work = selectWork(content.theme.layout.work);
  const about = selectAbout(content.theme.layout.about);
  const contact = selectContact(content.theme.layout.contact);

  return [
    { path: "app/components/_shared.tsx", content: SHARED_TSX },
    { path: "app/components/hero.tsx", content: hero.buildTsx(content) },
    { path: "app/components/work.tsx", content: work.buildTsx(content) },
    { path: "app/components/about.tsx", content: about.buildTsx(content) },
    { path: "app/components/contact.tsx", content: contact.buildTsx(content) },
    { path: "app/page.tsx", content: PAGE_TSX },
  ];
}
