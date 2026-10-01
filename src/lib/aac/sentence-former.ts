// AAC sentence former (rule-based NLP) — ported 1:1 from
// standalone_autism_module/app/services/nlp_sentence_former.py
// Turns a sequence of tapped card ids into a natural sentence,
// plus intent and sentiment labels. Runs entirely in the browser.

import { AACCard, getCardById } from "./cards";

export type AACIntent =
  | "empty"
  | "unknown"
  | "statement"
  | "request_need"
  | "emotional_expression"
  | "urgent_need"
  | "social_polite"
  | "agreement"
  | "declination";

export type AACSentiment = "neutral" | "positive" | "needs_support";

export interface FormedSentence {
  rawSequence: string[];
  formedSentence: string;
  speechText: string;
  intent: AACIntent;
  sentiment: AACSentiment;
  confidenceScore: number;
}

const WANT_PHRASES: Record<string, string> = {
  drink_water: "to drink some water",
  eat_food: "to eat some food",
  wash_hands: "to wash my hands",
  brush_teeth: "to brush my teeth",
  play_toys: "to play with my toys",
  read_book: "to read a book",
  take_break: "to take a quiet break",
  go_bathroom: "to go to the bathroom",
  rest_sleep: "to rest and sleep",
  help_please: "someone to help me",
};

const FEEL_PHRASES: Record<string, string> = {
  feel_happy: "happy and joyful",
  feel_sad: "sad right now",
  feel_anxious: "overwhelmed and anxious",
  feel_calm: "calm and peaceful",
  help_please: "in need of some help",
  take_break: "like I need a break",
};

const NEED_PHRASES: Record<string, string> = {
  help_please: "help from a teacher or parent",
  take_break: "a quiet sensory break",
  go_bathroom: "to use the restroom urgently",
  rest_sleep: "a rest",
  drink_water: "a glass of water",
  eat_food: "a snack",
};

const POSITIVE_IDS = ["feel_happy", "feel_calm", "thank_you", "yes"];
const SUPPORT_IDS = ["feel_sad", "feel_anxious", "help_please", "no"];

// Python str.capitalize(): first char upper, rest lower
function pyCapitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function formSentence(cardIds: string[]): FormedSentence {
  if (cardIds.length === 0) {
    return {
      rawSequence: [],
      formedSentence: "",
      speechText: "",
      intent: "empty",
      sentiment: "neutral",
      confidenceScore: 1.0,
    };
  }

  const cards = cardIds.map((id) => getCardById(id)).filter((c): c is AACCard => !!c);
  if (cards.length === 0) {
    const joined = cardIds.join(" ");
    return {
      rawSequence: cardIds,
      formedSentence: joined,
      speechText: joined,
      intent: "unknown",
      sentiment: "neutral",
      confidenceScore: 0.5,
    };
  }

  const starter = cards[0].grammaticalType === "subject_starter" ? cards[0] : null;
  const remaining = starter ? cards.slice(1) : cards;

  let intent: AACIntent = "statement";
  let sentiment: AACSentiment = "neutral";
  const hasThankYou = cards.some((c) => c.id === "thank_you");
  const contentCards = remaining.filter((c) => c.id !== "thank_you");

  // Sentiment: last matching card wins
  for (const c of cards) {
    if (POSITIVE_IDS.includes(c.id)) sentiment = "positive";
    else if (SUPPORT_IDS.includes(c.id)) sentiment = "needs_support";
  }

  let formed: string;
  if (starter) {
    if (starter.id === "i_want") {
      intent = "request_need";
      const parts = contentCards.map((c) => WANT_PHRASES[c.id] ?? c.label.toLowerCase());
      formed = parts.length ? "I want " + parts.join(" and ") : "I want something.";
    } else if (starter.id === "i_feel") {
      intent = "emotional_expression";
      const parts = contentCards.map((c) => FEEL_PHRASES[c.id] ?? c.label.toLowerCase());
      formed = parts.length ? "I feel " + parts.join(" ") : "I have feelings to share.";
    } else if (starter.id === "i_need") {
      intent = "urgent_need";
      const parts = contentCards.map((c) => NEED_PHRASES[c.id] ?? c.label.toLowerCase());
      formed = parts.length ? "I need " + parts.join(" and ") : "I need assistance.";
    } else {
      formed = cards.map((c) => c.label).join(" ");
    }
  } else if (cards[0].id === "help_please") {
    intent = "urgent_need";
    formed = "Please help me.";
  } else if (cards[0].id === "thank_you") {
    intent = "social_polite";
    formed = "Thank you very much!";
  } else if (cards[0].id === "yes") {
    intent = "agreement";
    formed = "Yes, please.";
  } else if (cards[0].id === "no") {
    intent = "declination";
    formed = "No, thank you.";
  } else {
    formed = pyCapitalize(cards.map((c) => c.voiceWord).join(" ")) + ".";
  }

  // Politeness suffix
  if (hasThankYou && !formed.toLowerCase().startsWith("thank you")) {
    formed = formed.replace(/\.+$/, "") + ", thank you.";
  }

  // Tidy: trim, terminal punctuation, capital first letter
  formed = formed.trim();
  if (!/[.!?]$/.test(formed)) formed += ".";
  formed = formed.charAt(0).toUpperCase() + formed.slice(1);

  return {
    rawSequence: cardIds,
    formedSentence: formed,
    speechText: formed,
    intent,
    sentiment,
    confidenceScore: 0.98,
  };
}
