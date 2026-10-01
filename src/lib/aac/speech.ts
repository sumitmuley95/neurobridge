// Text-to-speech for AAC — same settings as the standalone module's
// speakSentence() / playBeep() (browser Web Speech API, no server, no keys).
// Client-side only: call these from "use client" components.

export const SPEECH_RATE = 0.92;
export const SPEECH_PITCH = 1.05;
/** Accent / language used for speech. "en-IN" = Indian English. */
export const SPEECH_LANG = "en-IN";

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

// Voices load asynchronously in most browsers, so cache them once they arrive.
let cachedVoices: SpeechSynthesisVoice[] = [];
function loadVoices() {
  if (!isSpeechSupported()) return;
  const voices = window.speechSynthesis.getVoices();
  if (voices.length) cachedVoices = voices;
}
if (isSpeechSupported()) {
  loadVoices();
  window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
}

/**
 * Best installed voice for a language, e.g. "en-IN".
 * Prefers natural/online voices (Edge, newer Windows), then any exact match.
 * Returns undefined if the device has no voice for that language.
 */
export function pickVoice(lang: string = SPEECH_LANG): SpeechSynthesisVoice | undefined {
  loadVoices();
  const want = lang.toLowerCase();
  const matches = cachedVoices.filter((v) => v.lang.replace("_", "-").toLowerCase() === want);
  return (
    matches.find((v) => /natural|online|neural/i.test(v.name)) ??
    matches.find((v) => v.localService) ??
    matches[0]
  );
}

/** Speak text aloud. Returns false if the browser has no speech support. */
export function speak(text: string, onEnd?: () => void, lang: string = SPEECH_LANG): boolean {
  if (!isSpeechSupported() || !text.trim()) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = SPEECH_RATE;
  utterance.pitch = SPEECH_PITCH;
  // Setting lang lets the browser pick an Indian-English voice by itself;
  // setting voice forces the best one we found. If none is installed,
  // the browser falls back to its default English voice.
  utterance.lang = lang;
  const voice = pickVoice(lang);
  if (voice) {
    try {
      utterance.voice = voice;
    } catch {
      // keep browser default; utterance.lang still asks for Indian English
    }
  }
  if (onEnd) {
    utterance.onend = onEnd;
    utterance.onerror = onEnd;
  }
  window.speechSynthesis.speak(utterance);
  return true;
}

export function stopSpeaking(): void {
  if (isSpeechSupported()) window.speechSynthesis.cancel();
}

/** Gentle 440 Hz tap tone (0.1 s) played when a card is tapped. */
export function playTapTone(): void {
  try {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(440, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
    osc.onended = () => void ctx.close();
  } catch {
    // ignore autoplay restrictions
  }
}
