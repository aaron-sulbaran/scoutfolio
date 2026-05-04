"use client";

import { PortfolioCard } from "./portfolio-card";
import {
  MayaHeroPage,
  MayaCaseStudiesPage,
  MayaAboutPage,
  MayaContactPage,
  MayaFullPortfolio,
} from "./portfolios/maya-portfolio";

export function MayaCard() {
  return (
    <PortfolioCard
      number="01"
      field="UX Research"
      personaName="Maya Chen"
      school="Junior, Information Studies / UT Austin"
      description="Connected her resume and two personal URLs to generate a research-focused portfolio with case study structure, methodology badges, and recruiter-friendly framing."
      generationTime="Generated in 64s"
      connectors={[
        { type: "resume", label: "Resume PDF" },
        { type: "url", label: "mayachen.me" },
        { type: "url", label: "Medium blog" },
      ]}
      transition="fade"
      staggerDelay={0}
      navItems={["Hero", "Work", "About", "Contact"]}
      pages={[
        <MayaHeroPage key="hero" />,
        <MayaCaseStudiesPage key="cases" />,
        <MayaAboutPage key="about" />,
        <MayaContactPage key="contact" />,
      ]}
      fullPortfolio={<MayaFullPortfolio />}
    />
  );
}
