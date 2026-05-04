"use client";

import { PortfolioCard } from "./portfolio-card";
import {
  RiyaHeroPage,
  RiyaWorkPage,
  RiyaBrandPage,
  RiyaContactPage,
  RiyaFullPortfolio,
} from "./portfolios/riya-portfolio";

export function RiyaCard() {
  return (
    <PortfolioCard
      number="03"
      field="Product Design"
      personaName="Riya Patel"
      school="Senior, Design / RISD"
      description="Used her portfolio URL and resume to generate a visual-first site. The agent extracted project thumbnails, inferred a brand system from her existing work, and structured it as an editorial design portfolio."
      generationTime="Generated in 58s"
      connectors={[
        { type: "url", label: "riyapatel.design" },
        { type: "resume", label: "Resume PDF" },
        { type: "linkedin", label: "LinkedIn" },
      ]}
      transition="dissolve"
      staggerDelay={2400}
      navItems={["Hero", "Work", "System", "Contact"]}
      pages={[
        <RiyaHeroPage key="hero" />,
        <RiyaWorkPage key="work" />,
        <RiyaBrandPage key="brand" />,
        <RiyaContactPage key="contact" />,
      ]}
      fullPortfolio={<RiyaFullPortfolio />}
    />
  );
}
