// AAC vocabulary — ported 1:1 from the standalone AAC module
// (standalone_autism_module/app/services/aac_engine.py).
// Images live in /public/aac/cards/*.svg

export type GrammaticalType =
  | "subject_starter"
  | "verb"
  | "noun"
  | "adjective"
  | "social_phrase";

export interface AACCard {
  id: string;
  label: string;
  category: string;
  emoji: string;
  imageUrl: string;
  color: string;
  voiceWord: string;
  grammaticalType: GrammaticalType;
  defaultNextHints: string[];
}

export interface AACCategory {
  id: string;
  name: string;
  icon: string;
  color: string;
  description: string;
}

export const AAC_CATEGORIES: AACCategory[] = [
  { id: "starters", name: "Sentence Starters", icon: "🗣️", color: "#3B82F6", description: "Core subject openings to initiate requests and communication" },
  { id: "actions", name: "Daily Actions", icon: "⚡", color: "#06B6D4", description: "Everyday activities like eating, drinking, washing, resting" },
  { id: "needs", name: "Support & Needs", icon: "⚠️", color: "#F59E0B", description: "Immediate physiological, sensory, and transition needs" },
  { id: "feelings", name: "Emotions & Mood", icon: "💖", color: "#EC4899", description: "Zones of regulation, feelings, and internal states" },
  { id: "social", name: "Social & Courtesy", icon: "🤝", color: "#8B5CF6", description: "Greetings, affirmative/negative responses, and politeness" },
];

const img = (id: string) => `/aac/cards/${id}.svg`;

export const AAC_CARDS: AACCard[] = [
  // Starters
  { id: "i_want", label: "I want", category: "starters", emoji: "👉", imageUrl: img("i_want"), color: "#3B82F6", voiceWord: "I want", grammaticalType: "subject_starter", defaultNextHints: ["drink_water", "eat_food", "play_toys", "take_break", "read_book"] },
  { id: "i_feel", label: "I feel", category: "starters", emoji: "💖", imageUrl: img("i_feel"), color: "#EC4899", voiceWord: "I feel", grammaticalType: "subject_starter", defaultNextHints: ["feel_happy", "feel_sad", "feel_anxious", "feel_calm", "feel_tired"] },
  { id: "i_need", label: "I need", category: "starters", emoji: "⚠️", imageUrl: img("i_need"), color: "#F59E0B", voiceWord: "I need", grammaticalType: "subject_starter", defaultNextHints: ["help_please", "take_break", "go_bathroom", "rest_sleep"] },

  // Actions
  { id: "drink_water", label: "Drink Water", category: "actions", emoji: "💧", imageUrl: img("drink_water"), color: "#06B6D4", voiceWord: "to drink water", grammaticalType: "verb", defaultNextHints: ["thank_you", "yes", "help_please"] },
  { id: "eat_food", label: "Eat Food", category: "actions", emoji: "🍎", imageUrl: img("eat_food"), color: "#EF4444", voiceWord: "to eat food", grammaticalType: "verb", defaultNextHints: ["thank_you", "yes", "help_please"] },
  { id: "wash_hands", label: "Wash Hands", category: "actions", emoji: "🧼", imageUrl: img("wash_hands"), color: "#3B82F6", voiceWord: "to wash my hands", grammaticalType: "verb", defaultNextHints: ["thank_you", "help_please"] },
  { id: "brush_teeth", label: "Brush Teeth", category: "actions", emoji: "🪥", imageUrl: img("brush_teeth"), color: "#14B8A6", voiceWord: "to brush my teeth", grammaticalType: "verb", defaultNextHints: ["help_please", "thank_you"] },
  { id: "play_toys", label: "Play with Toys", category: "actions", emoji: "🧸", imageUrl: img("play_toys"), color: "#F59E0B", voiceWord: "to play with toys", grammaticalType: "verb", defaultNextHints: ["thank_you", "yes"] },
  { id: "read_book", label: "Read Book", category: "actions", emoji: "📖", imageUrl: img("read_book"), color: "#10B981", voiceWord: "to read a book", grammaticalType: "verb", defaultNextHints: ["help_please", "thank_you"] },

  // Needs
  { id: "take_break", label: "Take a Break", category: "needs", emoji: "⏸️", imageUrl: img("take_break"), color: "#8B5CF6", voiceWord: "to take a quiet break", grammaticalType: "verb", defaultNextHints: ["feel_calm", "rest_sleep", "thank_you"] },
  { id: "go_bathroom", label: "Go to Bathroom", category: "needs", emoji: "🚻", imageUrl: img("go_bathroom"), color: "#64748B", voiceWord: "to go to the bathroom", grammaticalType: "verb", defaultNextHints: ["help_please", "wash_hands"] },
  { id: "rest_sleep", label: "Rest / Sleep", category: "needs", emoji: "😴", imageUrl: img("rest_sleep"), color: "#6366F1", voiceWord: "to rest and sleep", grammaticalType: "verb", defaultNextHints: ["feel_calm", "thank_you"] },
  { id: "help_please", label: "Help Please", category: "needs", emoji: "🙋", imageUrl: img("help_please"), color: "#DC2626", voiceWord: "help please", grammaticalType: "social_phrase", defaultNextHints: ["thank_you", "yes"] },

  // Feelings
  { id: "feel_happy", label: "Happy", category: "feelings", emoji: "😊", imageUrl: img("feel_happy"), color: "#CA8A04", voiceWord: "happy and good", grammaticalType: "adjective", defaultNextHints: ["play_toys", "thank_you", "read_book"] },
  { id: "feel_sad", label: "Sad", category: "feelings", emoji: "😢", imageUrl: img("feel_sad"), color: "#2563EB", voiceWord: "sad right now", grammaticalType: "adjective", defaultNextHints: ["help_please", "take_break", "rest_sleep"] },
  { id: "feel_anxious", label: "Overwhelmed", category: "feelings", emoji: "😰", imageUrl: img("feel_anxious"), color: "#EA580C", voiceWord: "overwhelmed and anxious", grammaticalType: "adjective", defaultNextHints: ["take_break", "help_please", "rest_sleep"] },
  { id: "feel_calm", label: "Calm", category: "feelings", emoji: "😌", imageUrl: img("feel_calm"), color: "#16A34A", voiceWord: "calm and ready", grammaticalType: "adjective", defaultNextHints: ["read_book", "play_toys", "thank_you"] },

  // Social
  { id: "yes", label: "Yes", category: "social", emoji: "✅", imageUrl: img("yes"), color: "#16A34A", voiceWord: "yes", grammaticalType: "social_phrase", defaultNextHints: ["thank_you"] },
  { id: "no", label: "No", category: "social", emoji: "❌", imageUrl: img("no"), color: "#DC2626", voiceWord: "no thank you", grammaticalType: "social_phrase", defaultNextHints: ["take_break"] },
  { id: "thank_you", label: "Thank You", category: "social", emoji: "🙏", imageUrl: img("thank_you"), color: "#A855F7", voiceWord: "thank you", grammaticalType: "social_phrase", defaultNextHints: [] },
];

export const AAC_CARD_MAP: Record<string, AACCard> = Object.fromEntries(
  AAC_CARDS.map((c) => [c.id, c])
);

export function getCardById(id: string): AACCard | undefined {
  return AAC_CARD_MAP[id];
}

export function getCardsByCategory(category: string | null): AACCard[] {
  if (!category || category === "all") return AAC_CARDS;
  return AAC_CARDS.filter((c) => c.category === category);
}
