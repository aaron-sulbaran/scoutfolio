"use client";

import { useCallback, useEffect, useState } from "react";

export type LimitSnapshot = {
  remaining: number;
  max: number;
  resetMs: number;
  bypass?: boolean;
};

export type LimitsMap = {
  extractResume?: LimitSnapshot;
  extractUrl?: LimitSnapshot;
  extractGithub?: LimitSnapshot;
  discover?: LimitSnapshot;
  generate?: LimitSnapshot;
};

export function useLimits() {
  const [limits, setLimits] = useState<LimitsMap>({});
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/limits", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as LimitsMap;
      setLimits(data);
      setLoaded(true);
    } catch (err) {
      console.warn("[useLimits] refresh failed:", err);
    }
  }, []);

  useEffect(() => {
    // One-shot fetch on mount. Subsequent refreshes are explicit (callers
    // invoke refresh() after a successful op).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  return { limits, loaded, refresh };
}

export function formatRemaining(snap?: LimitSnapshot): string {
  if (!snap) return "";
  if (snap.bypass) return "Unlimited (dev)";
  return `${snap.remaining} of ${snap.max} left today`;
}
