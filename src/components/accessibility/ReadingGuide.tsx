"use client";

/**
 * A slim horizontal band that follows the cursor to help a reader track
 * one line of text at a time. Positioned via a CSS custom property so we
 * never trigger layout thrash or rely on animation.
 */

import { useEffect } from "react";
import { useAccessibility } from "@/lib/accessibility/accessibility-context";

export function ReadingGuide() {
  const { readingGuide } = useAccessibility();

  useEffect(() => {
    if (!readingGuide) return;

    const handleMove = (e: PointerEvent) => {
      document.documentElement.style.setProperty(
        "--reading-guide-y",
        `${e.clientY}px`
      );
    };

    window.addEventListener("pointermove", handleMove);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      document.documentElement.style.removeProperty("--reading-guide-y");
    };
  }, [readingGuide]);

  if (!readingGuide) return null;

  return <div className="reading-guide" aria-hidden="true" />;
}
