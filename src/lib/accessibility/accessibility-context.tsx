"use client";

/**
 * Global accessibility preferences (high contrast, font scale, reading
 * guide, reduced motion). Purely a presentation-layer concern: nothing
 * here touches business logic, routing, or data fetching. State is
 * persisted to localStorage so a preference sticks across visits.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

export type FontScale = "md" | "lg" | "xl";

interface AccessibilityState {
  highContrast: boolean;
  fontScale: FontScale;
  readingGuide: boolean;
  reducedMotion: boolean;
}

interface AccessibilityContextValue extends AccessibilityState {
  setHighContrast: (value: boolean) => void;
  setFontScale: (value: FontScale) => void;
  setReadingGuide: (value: boolean) => void;
  setReducedMotion: (value: boolean) => void;
  resetAll: () => void;
}

const STORAGE_KEY = "neurobridge:a11y-preferences";

const defaultState: AccessibilityState = {
  highContrast: false,
  fontScale: "md",
  readingGuide: false,
  reducedMotion: false,
};

const AccessibilityContext = createContext<AccessibilityContextValue | null>(
  null
);

export function AccessibilityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AccessibilityState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  // Load saved preferences once, on mount, client-side only.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setState({ ...defaultState, ...JSON.parse(raw) });
    } catch {
      // localStorage unavailable — fall back to defaults silently
    }
    setHydrated(true);
  }, []);

  // Reflect state onto <html> as data-attributes (see globals.css) and persist.
  useEffect(() => {
    if (!hydrated) return;
    const root = document.documentElement;
    root.dataset.contrast = state.highContrast ? "high" : "normal";
    root.dataset.fontScale = state.fontScale;
    root.dataset.motion = state.reducedMotion ? "reduced" : "normal";
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore write failures (private browsing, quota, etc.)
    }
  }, [state, hydrated]);

  const value: AccessibilityContextValue = {
    ...state,
    setHighContrast: (highContrast) =>
      setState((s) => ({ ...s, highContrast })),
    setFontScale: (fontScale) => setState((s) => ({ ...s, fontScale })),
    setReadingGuide: (readingGuide) =>
      setState((s) => ({ ...s, readingGuide })),
    setReducedMotion: (reducedMotion) =>
      setState((s) => ({ ...s, reducedMotion })),
    resetAll: () => setState(defaultState),
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const ctx = useContext(AccessibilityContext);
  if (!ctx) {
    throw new Error(
      "useAccessibility must be used within an AccessibilityProvider"
    );
  }
  return ctx;
}
