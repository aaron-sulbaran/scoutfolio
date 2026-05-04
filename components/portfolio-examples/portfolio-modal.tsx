"use client";

import { useEffect, useCallback, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

interface PortfolioModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  personaName: string;
  field: string;
  navItems?: string[];
}

export function PortfolioModal({
  open,
  onClose,
  children,
  personaName,
  field,
  navItems = [],
}: PortfolioModalProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "";
    };
  }, [open, handleEscape]);

  const scrollToSection = (sectionId: string) => {
    const container = scrollRef.current;
    if (!container) return;
    const target = container.querySelector(`[data-section="${sectionId}"]`);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10"
      role="dialog"
      aria-modal="true"
      aria-label={`${personaName} portfolio preview`}
    >
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div
        className="absolute inset-0 bg-foreground/60 backdrop-blur-sm"
        style={{ animation: "modal-fade-in 200ms ease-out both" }}
        onClick={onClose}
      />

      <div
        className="relative z-10 flex w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"
        style={{ animation: "modal-scale-in 200ms ease-out both" }}
      >
        {/* Browser chrome header with nav */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5 sm:px-5 sm:py-3">
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-1.5 sm:flex">
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
              <span className="size-2.5 rounded-full bg-border" />
            </div>
            <span className="font-mono text-[11px] text-muted">
              {personaName.toLowerCase().replace(" ", "-")}.dev
            </span>
          </div>

          {navItems.length > 0 && (
            <nav className="hidden items-center gap-4 md:flex">
              {navItems.map((item) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(item.toLowerCase())}
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-muted transition-colors hover:text-foreground"
                >
                  {item}
                </button>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:inline">
              {field}
            </span>
            <button
              onClick={onClose}
              className="flex size-7 items-center justify-center rounded-md text-muted transition-colors hover:bg-accent/10 hover:text-foreground"
              aria-label="Close preview"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="max-h-[85vh] overflow-y-auto overscroll-contain scroll-smooth"
        >
          {children}
        </div>
      </div>
    </div>
  );
}
