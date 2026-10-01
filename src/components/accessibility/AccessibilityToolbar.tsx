"use client";

/**
 * Floating accessibility toolbar available on every screen. Lets a
 * student, parent, teacher, or admin adjust presentation to their needs
 * without leaving the page. All preferences are frontend-only (see
 * AccessibilityProvider) — nothing here calls the backend.
 */

import { useState } from "react";
import {
  Accessibility,
  Contrast,
  Ruler,
  RotateCcw,
  Type,
  X,
} from "lucide-react";
import { useAccessibility, type FontScale } from "@/lib/accessibility/accessibility-context";
import { cn } from "@/lib/utils";

const FONT_SCALE_OPTIONS: { value: FontScale; label: string; sample: string }[] = [
  { value: "md", label: "Default", sample: "text-sm" },
  { value: "lg", label: "Large", sample: "text-base" },
  { value: "xl", label: "Extra large", sample: "text-lg" },
];

export function AccessibilityToolbar() {
  const [open, setOpen] = useState(false);
  const {
    highContrast,
    setHighContrast,
    fontScale,
    setFontScale,
    readingGuide,
    setReadingGuide,
    reducedMotion,
    setReducedMotion,
    resetAll,
  } = useAccessibility();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="accessibility-panel"
        aria-label={open ? "Close accessibility settings" : "Open accessibility settings"}
        className={cn(
          "fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-2xl",
          "bg-primary text-primary-foreground shadow-lg border-2 border-primary",
          "transition-colors hover:opacity-90 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Accessibility className="h-7 w-7" />}
      </button>

      {open && (
        <div
          id="accessibility-panel"
          role="dialog"
          aria-label="Accessibility settings"
          className={cn(
            "fixed bottom-24 right-5 z-50 w-[min(22rem,calc(100vw-2.5rem))]",
            "rounded-3xl border-2 border-border bg-card text-card-foreground shadow-xl p-5 space-y-5"
          )}
        >
          <div>
            <h2 className="text-lg font-semibold">Accessibility</h2>
            <p className="text-sm text-muted-foreground mt-1">
              These settings only change how this page looks on your device.
            </p>
          </div>

          {/* High contrast */}
          <ToggleRow
            icon={<Contrast className="h-5 w-5" />}
            label="High contrast"
            description="Stronger text and border contrast"
            checked={highContrast}
            onChange={setHighContrast}
          />

          {/* Reading guide */}
          <ToggleRow
            icon={<Ruler className="h-5 w-5" />}
            label="Reading guide"
            description="A highlighted bar that follows your cursor"
            checked={readingGuide}
            onChange={setReadingGuide}
          />

          {/* Reduce motion */}
          <ToggleRow
            icon={<RotateCcw className="h-5 w-5" />}
            label="Reduce motion"
            description="Turn off animations and transitions"
            checked={reducedMotion}
            onChange={setReducedMotion}
          />

          {/* Font size */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Type className="h-5 w-5 text-foreground" />
              <span className="font-medium text-sm">Text size</span>
            </div>
            <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Text size">
              {FONT_SCALE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={fontScale === opt.value}
                  onClick={() => setFontScale(opt.value)}
                  className={cn(
                    "min-h-[48px] rounded-xl border-2 px-2 py-2 text-sm font-medium transition-colors",
                    "focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring",
                    fontScale === opt.value
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border bg-background hover:bg-muted"
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={resetAll}
            className="w-full min-h-[48px] rounded-xl border-2 border-border text-sm font-medium hover:bg-muted transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Reset to defaults
          </button>
        </div>
      )}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="w-full flex items-center gap-3 min-h-[48px] rounded-xl border-2 border-border px-3 py-2 text-left hover:bg-muted transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <span className="text-foreground shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="block text-xs text-muted-foreground mt-0.5">{description}</span>
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative shrink-0 h-6 w-11 rounded-full border-2 transition-colors",
          checked ? "bg-primary border-primary" : "bg-muted border-border"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-[22px]" : "translate-x-0.5"
          )}
        />
      </span>
    </button>
  );
}
