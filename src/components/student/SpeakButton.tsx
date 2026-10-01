"use client";

/**
 * Speaker button that reads its context aloud (browser Web Speech API,
 * same voice settings as the AAC Talk Board). Tap again to stop.
 *
 * Pass either:
 *  - `text`: exactly what to say (e.g. the question + its choices), or
 *  - `readPage`: read the visible headings and paragraphs inside #main-content.
 */

import { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { speak, stopSpeaking, isSpeechSupported } from "@/lib/aac/speech";

interface SpeakButtonProps {
  text?: string;
  readPage?: boolean;
  label: string;
  className?: string;
  iconClassName?: string;
}

// Emojis are read out as their names ("red apple"), which is confusing, so strip them.
function stripEmoji(s: string) {
  return s
    .replace(/[\p{Extended_Pictographic}\p{Emoji_Modifier}‍️⃣]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

function readableText(root: HTMLElement): string {
  const seen = new Set<string>();
  const parts: string[] = [];
  root.querySelectorAll<HTMLElement>("h1, h2, h3, p").forEach((el) => {
    if (el.closest("[aria-hidden='true'], nav")) return;
    const t = stripEmoji(el.innerText || "");
    if (t && !seen.has(t)) {
      seen.add(t);
      parts.push(/[.!?]$/.test(t) ? t : t + ".");
    }
  });
  return parts.join(" ");
}

export function SpeakButton({ text, readPage, label, className, iconClassName = "w-6 h-6" }: SpeakButtonProps) {
  const [speaking, setSpeaking] = useState(false);
  const mounted = useRef(true);

  // Stop talking when the content changes (next question) or the page is left.
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopSpeaking();
    };
  }, [text]);

  const handleClick = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (!isSpeechSupported()) return;

    let toSay = text ? stripEmoji(text) : "";
    if (readPage) {
      const root = document.getElementById("main-content") ?? document.body;
      toSay = readableText(root);
    }
    if (!toSay) return;

    setSpeaking(true);
    speak(toSay, () => {
      if (mounted.current) setSpeaking(false);
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={speaking ? "Stop reading" : label}
      aria-pressed={speaking}
      title={speaking ? "Stop reading" : label}
      className={`${className ?? ""} ${speaking ? "ring-2 ring-offset-2 ring-current" : ""}`}
    >
      {speaking ? (
        <Square className={iconClassName} aria-hidden="true" />
      ) : (
        <Volume2 className={iconClassName} aria-hidden="true" />
      )}
    </button>
  );
}

/** "Question. Your choices are: A, B, or C." */
export function questionWithChoices(question: string, choices: string[], extra?: string) {
  const q = question.trim().replace(/([^.!?])$/, "$1.");
  const e = extra ? ` ${extra.trim().replace(/([^.!?])$/, "$1.")}` : "";
  if (choices.length === 0) return q + e;
  const list =
    choices.length === 1
      ? choices[0]
      : choices.length === 2
      ? `${choices[0]} or ${choices[1]}`
      : `${choices.slice(0, -1).join(", ")}, or ${choices[choices.length - 1]}`;
  return `${q}${e} Your choices are: ${list}.`;
}
