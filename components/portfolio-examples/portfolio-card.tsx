"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { ArrowUpRight, FileText, Github, Globe, Link2 } from "lucide-react";
import { PortfolioModal } from "./portfolio-modal";

export interface Connector {
  type: "github" | "resume" | "url" | "linkedin";
  label: string;
}

export type TransitionStyle = "fade" | "slide" | "dissolve";

interface PortfolioCardProps {
  number: string;
  field: string;
  personaName: string;
  school: string;
  description: string;
  generationTime: string;
  connectors: Connector[];
  pages: ReactNode[];
  fullPortfolio: ReactNode;
  navItems: string[];
  transition?: TransitionStyle;
  staggerDelay?: number;
  dark?: boolean;
}

const CONNECTOR_ICONS: Record<Connector["type"], typeof Github> = {
  github: Github,
  resume: FileText,
  url: Globe,
  linkedin: Link2,
};

function getPageStyle(
  index: number,
  activePage: number,
  prevPage: number,
  isTransitioning: boolean,
  transition: TransitionStyle,
): React.CSSProperties {
  const isActive = index === activePage;
  const isLeaving = index === prevPage && isTransitioning;

  if (transition === "slide") {
    let transform = "translateX(100%)";
    let opacity = 0;
    if (isActive) {
      transform = "translateX(0)";
      opacity = 1;
    } else if (isLeaving) {
      transform = "translateX(-100%)";
      opacity = 1;
    }
    return { transform, opacity, transition: "transform 700ms cubic-bezier(0.4, 0, 0.2, 1), opacity 700ms ease" };
  }

  if (transition === "dissolve") {
    let transform = "scale(1.04)";
    let opacity = 0;
    let filter = "blur(4px)";
    if (isActive) {
      transform = "scale(1)";
      opacity = 1;
      filter = "blur(0px)";
    } else if (isLeaving) {
      transform = "scale(0.97)";
      opacity = 0;
      filter = "blur(4px)";
    }
    return { transform, opacity, filter, transition: "transform 800ms ease, opacity 800ms ease, filter 800ms ease" };
  }

  return {
    opacity: isActive ? 1 : 0,
    transition: "opacity 700ms ease-in-out",
  };
}

export function PortfolioCard({
  number,
  field,
  personaName,
  school,
  description,
  generationTime,
  connectors,
  pages,
  fullPortfolio,
  navItems,
  transition = "fade",
  staggerDelay = 0,
  dark = false,
}: PortfolioCardProps) {
  const [activePage, setActivePage] = useState(0);
  const [prevPage, setPrevPage] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [started, setStarted] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>(null);

  useEffect(() => {
    const id = setTimeout(() => setStarted(true), staggerDelay);
    return () => clearTimeout(id);
  }, [staggerDelay]);

  const advance = useCallback(() => {
    setIsTransitioning(true);
    setActivePage((prev) => {
      setPrevPage(prev);
      return (prev + 1) % pages.length;
    });
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setIsTransitioning(false), 850);
  }, [pages.length]);

  useEffect(() => {
    if (modalOpen || !started) return;
    const id = setInterval(advance, 3500);
    return () => clearInterval(id);
  }, [advance, modalOpen, started]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const cardBg = dark
    ? "bg-accent text-accent-foreground"
    : "bg-card border border-border text-foreground";

  const mutedText = dark ? "opacity-60" : "text-muted";
  const borderColor = dark ? "border-accent-foreground/15" : "border-border";

  return (
    <>
      <article
        role="button"
        tabIndex={0}
        onClick={() => setModalOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setModalOpen(true);
          }
        }}
        className={`group relative grid cursor-pointer overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_30px_60px_-15px_rgba(61,45,79,0.25)] md:grid-cols-[1fr_1.6fr] ${cardBg}`}
      >
        {/* Left: metadata panel */}
        <div className={`flex flex-col p-6 md:border-r md:p-7 ${borderColor}`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`font-mono ${mutedText}`}>{number}</span>
            <span
              className={
                dark
                  ? "font-mono text-[10px] uppercase tracking-[0.18em] opacity-70"
                  : "eyebrow"
              }
            >
              {field}
            </span>
          </div>

          <div className="mt-6 md:mt-8">
            <h3
              className={`font-serif text-2xl tracking-tight md:text-3xl ${dark ? "" : "text-foreground"}`}
            >
              {personaName}
            </h3>
            <p className={`mt-1 text-xs ${mutedText}`}>{school}</p>
          </div>

          <p
            className={`mt-4 text-xs leading-relaxed md:mt-5 md:text-sm md:leading-relaxed ${mutedText}`}
          >
            {description}
          </p>

          {/* Connectors used */}
          <div className={`mt-6 border-t pt-4 md:mt-auto md:pt-5 ${borderColor}`}>
            <p
              className={`mb-2.5 font-mono text-[9px] uppercase tracking-[0.2em] ${mutedText}`}
            >
              Sources connected
            </p>
            <div className="flex flex-wrap gap-2">
              {connectors.map((c) => {
                const Icon = CONNECTOR_ICONS[c.type];
                return (
                  <span
                    key={c.label}
                    className={`inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-[10px] font-medium ${
                      dark
                        ? "bg-accent-foreground/10"
                        : "bg-accent/5 text-foreground"
                    }`}
                  >
                    <Icon className="size-3 opacity-60" />
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className={`mt-4 flex items-center justify-between border-t pt-4 ${borderColor}`}>
            <span
              className={`font-mono text-[10px] uppercase tracking-wider ${mutedText}`}
            >
              {generationTime}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-xs font-medium transition-transform group-hover:translate-x-0.5 ${dark ? "" : "text-accent"}`}
            >
              Preview
              <ArrowUpRight className="size-3" />
            </span>
          </div>
        </div>

        {/* Right: portfolio preview */}
        <div className="relative aspect-[4/3] overflow-hidden md:aspect-auto">
          {pages.map((page, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={getPageStyle(i, activePage, prevPage, isTransitioning, transition)}
              aria-hidden={i !== activePage}
            >
              {page}
            </div>
          ))}

          <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
            {pages.map((_, i) => (
              <span
                key={i}
                className={`size-1.5 rounded-full transition-all duration-300 ${
                  i === activePage
                    ? dark
                      ? "bg-accent-foreground scale-125"
                      : "bg-accent scale-125"
                    : dark
                      ? "bg-accent-foreground/30"
                      : "bg-accent/20"
                }`}
              />
            ))}
          </div>
        </div>
      </article>

      <PortfolioModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        personaName={personaName}
        field={field}
        navItems={navItems}
      >
        {fullPortfolio}
      </PortfolioModal>
    </>
  );
}
