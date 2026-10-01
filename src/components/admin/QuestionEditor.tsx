"use client";

import { useState } from "react";
import { Loader2, Plus, Trash2, Save, X } from "lucide-react";
import type { QuestionInput } from "@/app/actions/curriculum";

type Mode = "quiz" | "screening" | "activity";

const input =
  "w-full border-2 border-border rounded-xl px-3 py-2 text-sm bg-card min-h-11 focus:outline-none focus:border-primary";

export function QuestionEditor({
  mode,
  initial,
  onSave,
  onCancel,
  saveLabel = "Save question",
  extra,
}: {
  mode: Mode;
  initial?: Partial<QuestionInput>;
  onSave: (q: QuestionInput) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
  saveLabel?: string;
  extra?: React.ReactNode;
}) {
  const [q, setQ] = useState<QuestionInput>({
    prompt: initial?.prompt ?? "",
    visual: initial?.visual ?? "",
    subText: initial?.subText ?? "",
    imageSrc: initial?.imageSrc ?? "",
    title: initial?.title ?? "",
    helperText: initial?.helperText ?? "",
    hint: initial?.hint ?? "",
    options: initial?.options?.length ? initial.options : [{ text: "", emoji: "" }, { text: "", emoji: "" }, { text: "", emoji: "" }],
    correctIndex: initial?.correctIndex ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<QuestionInput>) => setQ((s) => ({ ...s, ...patch }));
  const setOpt = (i: number, patch: { text?: string; emoji?: string }) =>
    set({ options: q.options.map((o, j) => (j === i ? { ...o, ...patch } : o)) });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    const res = await onSave(q);
    setSaving(false);
    if (!res.success) setError(res.error || "Could not save.");
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-2xl border-2 border-border bg-background p-4">
      {extra}
      {mode === "activity" && (
        <label className="block text-sm font-semibold">
          Activity title
          <input className={input} value={q.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Choosing the right coin" />
        </label>
      )}
      <label className="block text-sm font-semibold">
        Question
        <input
          className={input}
          value={q.prompt}
          onChange={(e) => set({ prompt: e.target.value })}
          placeholder="e.g. Which note pays for a ₹20 juice?"
          required
        />
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block text-sm font-semibold">
          Picture (emoji)
          <input className={input} value={q.visual} onChange={(e) => set({ visual: e.target.value })} placeholder="e.g. 🧃 ₹20" />
        </label>
        {mode === "quiz" && (
          <label className="block text-sm font-semibold">
            Speech bubble / caption (optional)
            <input className={input} value={q.subText} onChange={(e) => set({ subText: e.target.value })} />
          </label>
        )}
        {mode === "activity" && (
          <label className="block text-sm font-semibold">
            Hint (optional)
            <input className={input} value={q.hint} onChange={(e) => set({ hint: e.target.value })} />
          </label>
        )}
      </div>
      {mode === "quiz" && (
        <label className="block text-sm font-semibold">
          Image link (optional)
          <input className={input} value={q.imageSrc} onChange={(e) => set({ imageSrc: e.target.value })} placeholder="https://… or /images/…" />
        </label>
      )}
      {mode === "activity" && (
        <label className="block text-sm font-semibold">
          Read-aloud help text (optional)
          <input className={input} value={q.helperText} onChange={(e) => set({ helperText: e.target.value })} placeholder="e.g. Look at the pictures and tap the right one." />
        </label>
      )}

      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold">Answer choices — select the correct one</legend>
        {q.options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="radio"
              name="correct"
              checked={q.correctIndex === i}
              onChange={() => set({ correctIndex: i })}
              aria-label={`Choice ${i + 1} is correct`}
              className="h-5 w-5 accent-[var(--primary)] shrink-0"
            />
            <input
              className={`${input} w-20 shrink-0`}
              value={o.emoji}
              onChange={(e) => setOpt(i, { emoji: e.target.value })}
              placeholder="🙂"
              aria-label={`Choice ${i + 1} emoji`}
            />
            <input
              className={input}
              value={o.text}
              onChange={(e) => setOpt(i, { text: e.target.value })}
              placeholder={`Choice ${i + 1}`}
              aria-label={`Choice ${i + 1} text`}
            />
            {q.options.length > 2 && (
              <button
                type="button"
                onClick={() =>
                  set({
                    options: q.options.filter((_, j) => j !== i),
                    correctIndex: q.correctIndex === i ? 0 : q.correctIndex > i ? q.correctIndex - 1 : q.correctIndex,
                  })
                }
                className="min-h-11 min-w-11 flex items-center justify-center rounded-xl hover:bg-muted"
                aria-label={`Remove choice ${i + 1}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {q.options.length < 4 && (
          <button
            type="button"
            onClick={() => set({ options: [...q.options, { text: "", emoji: "" }] })}
            className="min-h-11 inline-flex items-center gap-1 text-sm font-semibold text-primary"
          >
            <Plus className="h-4 w-4" /> Add a choice
          </button>
        )}
      </fieldset>

      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={saving}
          className="min-h-11 px-5 rounded-xl bg-primary text-primary-foreground font-semibold inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {saveLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="min-h-11 px-4 rounded-xl border-2 border-border font-semibold inline-flex items-center gap-2">
            <X className="h-4 w-4" /> Cancel
          </button>
        )}
      </div>
    </form>
  );
}
