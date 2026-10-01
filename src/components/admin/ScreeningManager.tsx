"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Pencil, Trash2, Plus, Copy, RotateCcw } from "lucide-react";
import {
  customizeScreening,
  resetScreeningToDefault,
  addScreeningQuestion,
  updateScreeningQuestion,
  deleteScreeningQuestion,
  type QuestionInput,
} from "@/app/actions/curriculum";
import { QuestionEditor } from "@/components/admin/QuestionEditor";

type Opt = { id: string; text: string; emoji: string; isCorrect?: boolean };
type Q = { id: string; domain_id: string; prompt: string; visual_cue: string | null; options: Opt[]; domains?: { name: string; icon_emoji: string | null } | null };
type D = { id: string; name: string; icon_emoji: string | null };

const btn = "min-h-11 px-4 rounded-xl font-semibold inline-flex items-center gap-2";

function DomainSelect({ value, onChange, domains }: { value: string; onChange: (v: string) => void; domains: D[] }) {
  return (
    <label className="block text-sm font-semibold">
      Subject this question checks
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border-2 border-border rounded-xl px-3 py-2 text-sm bg-card min-h-11"
      >
        {domains.map((d) => (
          <option key={d.id} value={d.id}>
            {d.icon_emoji} {d.name}
          </option>
        ))}
      </select>
    </label>
  );
}

export function ScreeningManager({ isCustom, questions, domains }: { isCustom: boolean; questions: Q[]; domains: D[] }) {
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [domainFor, setDomainFor] = useState<Record<string, string>>({});
  const [newDomain, setNewDomain] = useState(domains[0]?.id ?? "");

  const after = async (p: Promise<{ success: boolean; error?: string }>, ok: string) => {
    const res = await p;
    setMsg(res.success ? { ok: true, text: ok } : { ok: false, text: res.error || "Something went wrong." });
    if (res.success) router.refresh();
    return res;
  };

  const toInput = (q: Q): Partial<QuestionInput> => ({
    prompt: q.prompt,
    visual: q.visual_cue ?? "",
    options: q.options.map((o) => ({ text: o.text, emoji: o.emoji })),
    correctIndex: Math.max(0, q.options.findIndex((o) => o.isCorrect)),
  });

  return (
    <div className="space-y-6 pb-16">
      <Link href="/admin/curriculum" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground min-h-11">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Subjects
      </Link>
      <div className="bg-card border-2 border-border rounded-3xl p-5 sm:p-6 space-y-3">
        <h1 className="text-2xl font-bold font-heading">Screening questions</h1>
        <p className="text-sm text-muted-foreground">
          {isCustom
            ? "Your school's students take this screening. Edit, remove or add questions — at least one is needed."
            : "Your school uses the default 8-question screening (the same one individual learners take). Customise it to make changes for your school."}
        </p>
        <div className="flex flex-wrap gap-2">
          {!isCustom ? (
            <button type="button" onClick={() => after(customizeScreening(), "Your school now has its own screening set.")} className={`${btn} border-2 border-border`}>
              <Copy className="h-4 w-4" /> Customise for my school
            </button>
          ) : (
            <button
              type="button"
              onClick={() => window.confirm("Go back to the default 8 questions? Your changes will be removed.") && after(resetScreeningToDefault(), "Back to the default screening.")}
              className={`${btn} border-2 border-border`}
            >
              <RotateCcw className="h-4 w-4" /> Reset to default
            </button>
          )}
        </div>
        {msg && (
          <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-success" : "text-destructive"}`}>
            {msg.text}
          </p>
        )}
      </div>

      <ol className="space-y-3">
        {questions.map((q, i) =>
          editing === q.id ? (
            <li key={q.id}>
              <QuestionEditor
                mode="screening"
                initial={toInput(q)}
                onCancel={() => setEditing(null)}
                extra={<DomainSelect domains={domains} value={domainFor[q.id] ?? q.domain_id} onChange={(v) => setDomainFor((m) => ({ ...m, [q.id]: v }))} />}
                onSave={async (v) => {
                  const res = await after(updateScreeningQuestion(q.id, domainFor[q.id] ?? q.domain_id, v), "Question saved.");
                  if (res.success) setEditing(null);
                  return res;
                }}
              />
            </li>
          ) : (
            <li key={q.id} className="max-w-none bg-card rounded-2xl border-2 border-border p-4 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {i + 1}. {q.domains?.icon_emoji} {q.domains?.name}
                  </p>
                  <p className="font-semibold">
                    <span aria-hidden="true">{q.visual_cue}</span> {q.prompt}
                  </p>
                </div>
                {isCustom && (
                  <div className="flex gap-1">
                    <button type="button" aria-label="Edit question" onClick={() => setEditing(q.id)} className="min-h-11 min-w-11 rounded-xl border-2 border-border flex items-center justify-center hover:bg-muted">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Delete question"
                      onClick={() => window.confirm("Delete this question?") && after(deleteScreeningQuestion(q.id), "Question deleted.")}
                      className="min-h-11 min-w-11 rounded-xl border-2 border-border flex items-center justify-center hover:bg-muted hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>
              <ul className="flex flex-wrap gap-2 text-sm">
                {q.options.map((o) => (
                  <li key={o.id} className={`px-3 py-1 rounded-xl border ${o.isCorrect ? "bg-success-soft border-success/40 font-semibold" : "border-border"}`}>
                    {o.emoji} {o.text}
                    {o.isCorrect && <span className="sr-only"> (correct)</span>}
                  </li>
                ))}
              </ul>
            </li>
          )
        )}
      </ol>

      {adding ? (
        <QuestionEditor
          mode="screening"
          saveLabel="Add question"
          onCancel={() => setAdding(false)}
          extra={<DomainSelect domains={domains} value={newDomain} onChange={setNewDomain} />}
          onSave={async (v) => {
            const res = await after(addScreeningQuestion(newDomain, v), "Question added.");
            if (res.success) setAdding(false);
            return res;
          }}
        />
      ) : (
        <button type="button" onClick={() => setAdding(true)} className={`${btn} bg-primary text-primary-foreground`}>
          <Plus className="h-4 w-4" /> Add a question
        </button>
      )}
    </div>
  );
}
