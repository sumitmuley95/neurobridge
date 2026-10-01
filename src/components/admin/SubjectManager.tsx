"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Plus,
  Loader2,
  Save,
  Video,
  Zap,
  Lock,
  Copy,
  RotateCcw,
  ClipboardList,
} from "lucide-react";
import {
  updateSubject,
  deleteSubject,
  addLesson,
  updateLesson,
  deleteLesson,
  addActivity,
  deleteActivity,
  customizeQuiz,
  resetQuizToDefault,
  addQuizQuestion,
  updateQuizQuestion,
  deleteQuizQuestion,
  addScreeningQuestion,
  type QuestionInput,
  type LessonInput,
} from "@/app/actions/curriculum";
import { QuestionEditor } from "@/components/admin/QuestionEditor";

type Opt = { id: string; text: string; emoji: string; isCorrect?: boolean };
type Row = Record<string, unknown> & { id: string };

const input = "w-full border-2 border-border rounded-xl px-3 py-2 text-sm bg-card min-h-11 focus:outline-none focus:border-primary";
const btn = "min-h-11 px-4 rounded-xl font-semibold inline-flex items-center gap-2 disabled:opacity-60";

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section className="bg-card border-2 border-border rounded-3xl p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="font-heading font-bold text-xl">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}

function toQuestion(r: Row, kind: "quiz" | "screening" | "activity"): Partial<QuestionInput> {
  const options = (r.options as Opt[]) || [];
  const correctIndex =
    kind === "screening" ? Math.max(0, options.findIndex((o) => o.isCorrect)) : Math.max(0, options.findIndex((o) => o.id === r.correct_answer));
  return {
    prompt: String(r.prompt ?? ""),
    visual: String((kind === "quiz" ? r.visual_emoji : r.visual_cue) ?? ""),
    subText: String((kind === "quiz" ? r.sub_text : r.description) ?? ""),
    imageSrc: String(r.image_src ?? ""),
    title: String(r.title ?? ""),
    helperText: String(r.helper_audio_text ?? ""),
    hint: String(r.hint ?? ""),
    options: options.map((o) => ({ text: o.text, emoji: o.emoji })),
    correctIndex,
  };
}

function QuestionCard({ r, kind, badge, actions }: { r: Row; kind: "quiz" | "screening" | "activity"; badge?: string; actions?: React.ReactNode }) {
  const options = (r.options as Opt[]) || [];
  const isRight = (o: Opt) => (kind === "screening" ? o.isCorrect : o.id === r.correct_answer);
  return (
    <li className="max-w-none rounded-2xl border-2 border-border p-4 space-y-2 bg-background">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          {kind === "activity" && <p className="text-xs font-semibold text-muted-foreground">{String(r.title)}</p>}
          <p className="font-semibold">
            <span aria-hidden="true">{String((kind === "quiz" ? r.visual_emoji : r.visual_cue) ?? "")}</span> {String(r.prompt)}
          </p>
          {badge && <span className="inline-block text-xs font-semibold bg-muted text-muted-foreground px-2 py-0.5 rounded-lg mt-1">{badge}</span>}
        </div>
        {actions && <div className="flex gap-1">{actions}</div>}
      </div>
      <ul className="flex flex-wrap gap-2 text-sm">
        {options.map((o) => (
          <li
            key={o.id}
            className={`px-3 py-1 rounded-xl border ${isRight(o) ? "bg-success-soft border-success/40 font-semibold" : "border-border"}`}
          >
            {o.emoji} {o.text}
            {isRight(o) && <span className="sr-only"> (correct)</span>}
          </li>
        ))}
      </ul>
    </li>
  );
}

function IconButton({ label, onClick, children, danger }: { label: string; onClick: () => void; children: React.ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`min-h-11 min-w-11 rounded-xl border-2 border-border flex items-center justify-center hover:bg-muted ${danger ? "hover:text-destructive" : ""}`}
    >
      {children}
    </button>
  );
}

function LessonForm({ initial, onSave, onCancel, label }: { initial?: LessonInput; onSave: (l: LessonInput) => Promise<{ success: boolean; error?: string }>; onCancel?: () => void; label: string }) {
  const [l, setL] = useState<LessonInput>(initial ?? { title: "", description: "", videoUrl: "", xp: 20 });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        const res = await onSave(l);
        setSaving(false);
        if (!res.success) setError(res.error || "Could not save.");
        else if (!initial) setL({ title: "", description: "", videoUrl: "", xp: l.xp });
      }}
      className="space-y-3 rounded-2xl border-2 border-border bg-background p-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_8rem] gap-3">
        <label className="text-sm font-semibold">
          Lesson title
          <input className={input} value={l.title} onChange={(e) => setL({ ...l, title: e.target.value })} required />
        </label>
        <label className="text-sm font-semibold">
          XP reward
          <input
            className={input}
            type="number"
            min={0}
            max={1000}
            value={l.xp}
            onChange={(e) => setL({ ...l, xp: Number(e.target.value) })}
            required
          />
        </label>
      </div>
      <label className="block text-sm font-semibold">
        Video link (YouTube or .mp4)
        <input className={input} value={l.videoUrl} onChange={(e) => setL({ ...l, videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" required />
      </label>
      <label className="block text-sm font-semibold">
        Description
        <input className={input} value={l.description} onChange={(e) => setL({ ...l, description: e.target.value })} />
      </label>
      {error && <p className="text-sm font-semibold text-destructive" role="alert">{error}</p>}
      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={saving} className={`${btn} bg-primary text-primary-foreground`}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} {label}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className={`${btn} border-2 border-border`}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

export function SubjectManager(props: {
  domain: Row & { name: string; icon_emoji: string | null; description: string | null };
  isOwn: boolean;
  schoolId: string;
  modules: Row[];
  activities: Row[];
  quiz: Row[];
  quizIsCustom: boolean;
  screening: Row[];
  screeningIsCustom: boolean;
}) {
  const { domain, isOwn, schoolId, modules, activities, quiz, quizIsCustom, screening, screeningIsCustom } = props;
  const router = useRouter();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [editDetails, setEditDetails] = useState(false);
  const [details, setDetails] = useState({ name: domain.name, emoji: domain.icon_emoji ?? "📚", description: domain.description ?? "" });
  const [editingLesson, setEditingLesson] = useState<string | null>(null);
  const [editingQuiz, setEditingQuiz] = useState<string | null>(null);
  const [adding, setAdding] = useState<"lesson" | "activity" | "quiz" | "screening" | null>(null);

  const after = async (p: Promise<{ success: boolean; error?: string }>, ok: string) => {
    const res = await p;
    setMsg(res.success ? { ok: true, text: ok } : { ok: false, text: res.error || "Something went wrong." });
    if (res.success) router.refresh();
    return res;
  };

  const totalXp = modules.reduce((n, m) => n + (Number(m.xp_reward) || 0), 0);
  const canEditQuiz = isOwn || quizIsCustom;

  return (
    <div className="space-y-6 pb-16">
      <Link href="/admin/curriculum" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-foreground min-h-11">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" /> All subjects
      </Link>

      {/* Header */}
      <div className="bg-card border-2 border-border rounded-3xl p-5 sm:p-6 space-y-3">
        {!editDetails ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center text-3xl" aria-hidden="true">
                {domain.icon_emoji}
              </span>
              <div>
                <h1 className="text-2xl font-bold font-heading">{domain.name}</h1>
                <p className="text-sm text-muted-foreground">
                  {isOwn ? "Your school's subject" : "Default subject — shared with all schools"} · {modules.length} lessons · {totalXp} XP
                </p>
              </div>
            </div>
            {isOwn && (
              <div className="flex gap-2">
                <button type="button" onClick={() => setEditDetails(true)} className={`${btn} border-2 border-border`}>
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    if (!window.confirm(`Delete "${domain.name}"? This can't be undone.`)) return;
                    const res = await deleteSubject(domain.id);
                    if (res.success) router.push("/admin/curriculum");
                    else setMsg({ ok: false, text: res.error });
                  }}
                  className={`${btn} border-2 border-border hover:text-destructive`}
                >
                  <Trash2 className="h-4 w-4" /> Delete
                </button>
              </div>
            )}
          </div>
        ) : (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const res = await after(updateSubject(domain.id, details), "Subject updated.");
              if (res.success) setEditDetails(false);
            }}
            className="grid grid-cols-1 sm:grid-cols-[6rem_1fr_1fr_auto] gap-3 items-end"
          >
            <label className="text-sm font-semibold">
              Emoji
              <input className={input} value={details.emoji} onChange={(e) => setDetails({ ...details, emoji: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Name
              <input className={input} value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} />
            </label>
            <label className="text-sm font-semibold">
              Description
              <input className={input} value={details.description} onChange={(e) => setDetails({ ...details, description: e.target.value })} />
            </label>
            <button type="submit" className={`${btn} bg-primary text-primary-foreground`}>
              <Save className="h-4 w-4" /> Save
            </button>
          </form>
        )}
        {msg && (
          <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-success" : "text-destructive"}`}>
            {msg.text}
          </p>
        )}
      </div>

      {/* Lessons */}
      <Section
        title="Video lessons"
        subtitle={isOwn ? "Students unlock these one by one. 5 lessons is recommended. Set the XP each lesson is worth." : "Lessons of default subjects are managed by NeuroBridge."}
      >
        <ol className="space-y-2">
          {modules.map((m) =>
            editingLesson === m.id ? (
              <li key={m.id} className="max-w-none">
                <LessonForm
                  label="Save lesson"
                  initial={{ title: String(m.title), description: String(m.description ?? ""), videoUrl: String(m.video_url), xp: Number(m.xp_reward) || 0 }}
                  onCancel={() => setEditingLesson(null)}
                  onSave={async (l) => {
                    const res = await after(updateLesson(m.id, l), "Lesson saved.");
                    if (res.success) setEditingLesson(null);
                    return res;
                  }}
                />
              </li>
            ) : (
              <li key={m.id} className="max-w-none rounded-2xl border-2 border-border p-3 flex flex-wrap items-center justify-between gap-3 bg-background">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-9 w-9 rounded-full bg-parent text-parent-foreground font-bold flex items-center justify-center shrink-0">{String(m.order_index)}</span>
                  <div className="min-w-0">
                    <p className="font-semibold">{String(m.title)}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <Video className="h-3.5 w-3.5 shrink-0" aria-hidden="true" /> {String(m.video_url)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-sm font-semibold bg-teacher-soft text-teacher px-2.5 py-1 rounded-lg">
                    <Zap className="h-4 w-4" aria-hidden="true" /> {Number(m.xp_reward) || 0} XP
                  </span>
                  {isOwn ? (
                    <>
                      <IconButton label={`Edit ${String(m.title)}`} onClick={() => setEditingLesson(m.id)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton
                        danger
                        label={`Delete ${String(m.title)}`}
                        onClick={() => window.confirm("Delete this lesson?") && after(deleteLesson(m.id), "Lesson deleted.")}
                      >
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </>
                  ) : (
                    <Lock className="h-4 w-4 text-muted-foreground" aria-label="Read only" />
                  )}
                </div>
              </li>
            )
          )}
          {modules.length === 0 && <p className="text-sm text-muted-foreground">No lessons yet — students won&apos;t see this subject until it has one.</p>}
        </ol>
        {isOwn &&
          (adding === "lesson" ? (
            <LessonForm
              label="Add lesson"
              onCancel={() => setAdding(null)}
              onSave={(l) => after(addLesson(domain.id, l), "Lesson added.")}
            />
          ) : (
            <button type="button" onClick={() => setAdding("lesson")} className={`${btn} bg-primary text-primary-foreground`}>
              <Plus className="h-4 w-4" /> Add a lesson
            </button>
          ))}
      </Section>

      {/* Practice activities */}
      <Section title="Practice activities" subtitle="Short picture questions students practise with. The AI recommendation picks from these.">
        <ul className="space-y-2">
          {activities.map((a) => (
            <QuestionCard
              key={a.id}
              r={a}
              kind="activity"
              badge={a.school_id === schoolId ? undefined : "Default"}
              actions={
                a.school_id === schoolId ? (
                  <IconButton danger label="Delete activity" onClick={() => window.confirm("Delete this activity?") && after(deleteActivity(a.id), "Activity deleted.")}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                ) : undefined
              }
            />
          ))}
          {activities.length === 0 && <p className="text-sm text-muted-foreground">No practice activities yet.</p>}
        </ul>
        {adding === "activity" ? (
          <QuestionEditor
            mode="activity"
            saveLabel="Add activity"
            onCancel={() => setAdding(null)}
            onSave={async (q) => {
              const res = await after(addActivity(domain.id, q), "Activity added.");
              if (res.success) setAdding(null);
              return res;
            }}
          />
        ) : (
          <button type="button" onClick={() => setAdding("activity")} className={`${btn} bg-primary text-primary-foreground`}>
            <Plus className="h-4 w-4" /> Add an activity
          </button>
        )}
      </Section>

      {/* Mastery quiz */}
      <Section
        title="Unit mastery quiz"
        subtitle={
          isOwn
            ? "Students take this after finishing all lessons. 70% or more marks the unit as mastered."
            : quizIsCustom
            ? "Your school uses its own version of this quiz."
            : "Your school uses the default quiz. Customise it to change, remove or add questions."
        }
      >
        {!isOwn && (
          <div className="flex flex-wrap gap-2">
            {!quizIsCustom ? (
              <button type="button" onClick={() => after(customizeQuiz(domain.id), "You now have your own copy of this quiz.")} className={`${btn} border-2 border-border`}>
                <Copy className="h-4 w-4" /> Customise for my school
              </button>
            ) : (
              <button
                type="button"
                onClick={() => window.confirm("Go back to the default quiz? Your changes will be removed.") && after(resetQuizToDefault(domain.id), "Back to the default quiz.")}
                className={`${btn} border-2 border-border`}
              >
                <RotateCcw className="h-4 w-4" /> Reset to default
              </button>
            )}
          </div>
        )}
        <ol className="space-y-2">
          {quiz.map((q) =>
            editingQuiz === q.id ? (
              <li key={q.id} className="max-w-none">
                <QuestionEditor
                  mode="quiz"
                  initial={toQuestion(q, "quiz")}
                  onCancel={() => setEditingQuiz(null)}
                  onSave={async (v) => {
                    const res = await after(updateQuizQuestion(q.id, v), "Question saved.");
                    if (res.success) setEditingQuiz(null);
                    return res;
                  }}
                />
              </li>
            ) : (
              <QuestionCard
                key={q.id}
                r={q}
                kind="quiz"
                actions={
                  canEditQuiz ? (
                    <>
                      <IconButton label="Edit question" onClick={() => setEditingQuiz(q.id)}>
                        <Pencil className="h-4 w-4" />
                      </IconButton>
                      <IconButton danger label="Delete question" onClick={() => window.confirm("Delete this question?") && after(deleteQuizQuestion(q.id), "Question deleted.")}>
                        <Trash2 className="h-4 w-4" />
                      </IconButton>
                    </>
                  ) : undefined
                }
              />
            )
          )}
          {quiz.length === 0 && <p className="text-sm text-muted-foreground">No quiz questions yet.</p>}
        </ol>
        {adding === "quiz" ? (
          <QuestionEditor
            mode="quiz"
            saveLabel="Add question"
            onCancel={() => setAdding(null)}
            onSave={async (q) => {
              const res = await after(addQuizQuestion(domain.id, q), "Question added.");
              if (res.success) setAdding(null);
              return res;
            }}
          />
        ) : (
          <button type="button" onClick={() => setAdding("quiz")} className={`${btn} bg-primary text-primary-foreground`}>
            <Plus className="h-4 w-4" /> Add a quiz question
          </button>
        )}
      </Section>

      {/* Screening */}
      <Section
        title="Screening question"
        subtitle={
          screeningIsCustom
            ? "Your school's screening set. Questions for this subject are shown below."
            : "Your school uses the default screening. Adding a question here gives your school its own copy of the set."
        }
      >
        <ul className="space-y-2">
          {screening.map((q) => (
            <QuestionCard key={q.id} r={q} kind="screening" badge={screeningIsCustom ? undefined : "Default"} />
          ))}
          {screening.length === 0 && <p className="text-sm text-muted-foreground">No screening question for this subject yet.</p>}
        </ul>
        <div className="flex flex-wrap gap-2">
          {adding === "screening" ? (
            <div className="w-full">
              <QuestionEditor
                mode="screening"
                saveLabel="Add to screening"
                onCancel={() => setAdding(null)}
                onSave={async (q) => {
                  const res = await after(addScreeningQuestion(domain.id, q), "Screening question added.");
                  if (res.success) setAdding(null);
                  return res;
                }}
              />
            </div>
          ) : (
            <button type="button" onClick={() => setAdding("screening")} className={`${btn} bg-primary text-primary-foreground`}>
              <Plus className="h-4 w-4" /> Add a screening question
            </button>
          )}
          <Link href="/admin/screening" className={`${btn} border-2 border-border`}>
            <ClipboardList className="h-4 w-4" /> Manage the whole screening
          </Link>
        </div>
      </Section>
    </div>
  );
}
