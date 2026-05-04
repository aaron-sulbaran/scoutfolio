"use client";

import { PortfolioCard } from "./portfolio-card";
import {
  JordanHeroPage,
  JordanProjectsPage,
  JordanSkillsPage,
  JordanContactPage,
  JordanFullPortfolio,
} from "./portfolios/jordan-portfolio";

export function JordanCard() {
  return (
    <PortfolioCard
      number="02"
      field="Software Engineering"
      personaName="Jordan Park"
      school="CS Junior / UCLA"
      description="Pulled repos from GitHub and a personal site URL. The agent ranked projects by star count and commit frequency, generated recruiter copy for each, and built a dark-mode developer portfolio."
      generationTime="Generated in 71s"
      connectors={[
        { type: "github", label: "GitHub repos" },
        { type: "url", label: "jordan-park.dev" },
        { type: "resume", label: "Resume PDF" },
      ]}
      transition="slide"
      staggerDelay={1200}
      navItems={["Hero", "Projects", "Skills", "Contact"]}
      dark
      pages={[
        <JordanHeroPage key="hero" />,
        <JordanProjectsPage key="projects" />,
        <JordanSkillsPage key="skills" />,
        <JordanContactPage key="contact" />,
      ]}
      fullPortfolio={<JordanFullPortfolio />}
    />
  );
}
