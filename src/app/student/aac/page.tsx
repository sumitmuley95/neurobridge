"use client";

/* eslint-disable @next/next/no-img-element */
// AAC Talk Board: next-card predictor + sentence former + text-to-speech.
// Everything runs in the browser. No server actions, no database, no API calls.

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Delete, Trash2, Volume2, Sparkles, Square } from "lucide-react";
import { AAC_CATEGORIES, getCardById, getCardsByCategory, type AACCard } from "@/lib/aac/cards";
import { predictNextCards } from "@/lib/aac/predictor";
import { formSentence } from "@/lib/aac/sentence-former";
import { speak, stopSpeaking, playTapTone, isSpeechSupported } from "@/lib/aac/speech";

const SENTIMENT_STYLE: Record<string, string> = {
  positive: "bg-emerald-100 text-emerald-800",
  needs_support: "bg-amber-100 text-amber-800",
  neutral: "bg-slate-100 text-slate-600",
};

const INTENT_LABEL: Record<string, string> = {
  request_need: "Request",
  emotional_expression: "Feeling",
  urgent_need: "Need",
  social_polite: "Polite",
  agreement: "Yes",
  declination: "No",
  statement: "Statement",
  unknown: "Unknown",
  empty: "",
};

export default function AACBoardPage() {
  const [sequence, setSequence] = useState<string[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [speaking, setSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);

  const stripCards = useMemo(
    () => sequence.map((id) => getCardById(id)).filter((c): c is AACCard => !!c),
    [sequence]
  );
  const sentence = useMemo(() => formSentence(sequence), [sequence]);
  const predictions = useMemo(() => predictNextCards(sequence, 4), [sequence]);
  const gridCards = useMemo(() => getCardsByCategory(category), [category]);

  const addCard = (id: string) => {
    playTapTone();
    setSequence((s) => [...s, id]);
  };
  const removeAt = (index: number) => setSequence((s) => s.filter((_, i) => i !== index));
  const backspace = () => setSequence((s) => s.slice(0, -1));
  const clearAll = () => {
    stopSpeaking();
    setSpeaking(false);
    setSequence([]);
  };

  const handleSpeak = () => {
    if (speaking) {
      stopSpeaking();
      setSpeaking(false);
      return;
    }
    if (!isSpeechSupported()) {
      setSpeechError("Speech is not supported in this browser.");
      return;
    }
    setSpeechError(null);
    const text = sentence.speechText || "Please add cards to speak.";
    setSpeaking(true);
    speak(text, () => setSpeaking(false));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>

      <div className="bg-gradient-to-r from-sky-600 to-indigo-700 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-2">
        <span className="text-xs font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full inline-block">
          AAC Talk Board
        </span>
        <h1 className="text-2xl sm:text-3xl font-black">Tap pictures to build a sentence</h1>
        <p className="text-sky-100 text-sm font-medium">
          Tap cards, then press Speak Aloud. Suggested next cards appear as you go.
        </p>
      </div>

      {/* Sentence strip */}
      <section className="bg-white rounded-3xl border-2 border-slate-100 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="min-h-28 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-3 flex flex-wrap gap-3 items-center">
          {stripCards.length === 0 ? (
            <p className="text-slate-400 font-semibold px-2">Your sentence will appear here…</p>
          ) : (
            stripCards.map((card, i) => (
              <button
                key={`${card.id}-${i}`}
                onClick={() => removeAt(i)}
                aria-label={`Remove ${card.label}`}
                className="w-20 min-h-20 rounded-xl bg-white border-2 p-1.5 flex flex-col items-center justify-center gap-1 hover:opacity-70 transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
                style={{ borderColor: card.color }}
              >
                <img src={card.imageUrl} alt="" className="w-10 h-10" />
                <span className="text-[11px] font-bold text-slate-700 leading-tight text-center">
                  {card.label}
                </span>
              </button>
            ))
          )}
        </div>

        {/* Formed sentence */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div className="space-y-1" aria-live="polite">
            <p className="text-xl sm:text-2xl font-black text-slate-900">
              {sentence.formedSentence || " "}
            </p>
            {sentence.intent !== "empty" && (
              <div className="flex gap-2">
                <span className="text-xs font-extrabold bg-sky-100 text-sky-800 px-2.5 py-1 rounded-full">
                  {INTENT_LABEL[sentence.intent] ?? sentence.intent}
                </span>
                <span
                  className={`text-xs font-extrabold px-2.5 py-1 rounded-full ${SENTIMENT_STYLE[sentence.sentiment]}`}
                >
                  {sentence.sentiment === "needs_support" ? "Needs support" : sentence.sentiment}
                </span>
              </div>
            )}
          </div>

          <div className="flex gap-2 flex-wrap">
            <button
              onClick={backspace}
              disabled={sequence.length === 0}
              className="min-h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
            >
              <Delete className="w-4 h-4" /> Back
            </button>
            <button
              onClick={clearAll}
              disabled={sequence.length === 0}
              className="min-h-12 px-4 rounded-xl border-2 border-slate-200 bg-white font-bold text-slate-700 inline-flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Clear
            </button>
            <button
              onClick={handleSpeak}
              className="min-h-12 px-5 rounded-xl bg-primary text-primary-foreground font-black inline-flex items-center gap-2 hover:opacity-90"
            >
              {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-5 h-5" />}
              {speaking ? "Stop" : "Speak Aloud"}
            </button>
          </div>
        </div>
        {speechError && <p className="text-sm font-semibold text-red-600">{speechError}</p>}
      </section>

      {/* Predictions */}
      <section className="space-y-2">
        <h2 className="text-sm font-extrabold text-slate-500 uppercase tracking-wider inline-flex items-center gap-2">
          <Sparkles className="w-4 h-4" /> Suggested next
        </h2>
        <div className="flex flex-wrap gap-2">
          {predictions.map((p) => (
            <button
              key={p.card.id}
              onClick={() => addCard(p.card.id)}
              title={`${p.reason} (${Math.round(p.probability * 100)}%)`}
              className="min-h-12 pl-2 pr-4 rounded-full bg-white border-2 border-slate-200 hover:border-sky-500 inline-flex items-center gap-2 font-bold text-slate-800 shadow-sm transition"
            >
              <img src={p.card.imageUrl} alt="" className="w-8 h-8" />
              {p.card.label}
            </button>
          ))}
        </div>
      </section>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2" role="tablist">
        {[{ id: "all", name: "All", icon: "🗂️" }, ...AAC_CATEGORIES].map((cat) => (
          <button
            key={cat.id}
            role="tab"
            aria-selected={category === cat.id}
            onClick={() => setCategory(cat.id)}
            className={`min-h-11 px-4 rounded-xl font-bold text-sm border-2 transition ${
              category === cat.id
                ? "bg-slate-900 text-white border-slate-900"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
            }`}
          >
            <span className="mr-1.5">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {gridCards.map((card) => (
          <button
            key={card.id}
            onClick={() => addCard(card.id)}
            className="bg-white rounded-2xl border-2 border-slate-100 shadow-sm p-3 flex flex-col items-center gap-2 hover:shadow-md hover:-translate-y-0.5 transition focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            style={{ borderTopColor: card.color, borderTopWidth: 6 }}
          >
            <img src={card.imageUrl} alt="" className="w-16 h-16 sm:w-20 sm:h-20" />
            <span className="text-sm font-extrabold text-slate-800 text-center">{card.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
