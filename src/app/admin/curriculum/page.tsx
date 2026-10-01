import Link from "next/link";
import { ArrowRight, CheckCircle2, AlertCircle, ClipboardList } from "lucide-react";
import { getCurriculumOverview } from "@/app/actions/curriculum";
import { NewSubjectForm } from "@/components/admin/NewSubjectForm";

export const dynamic = "force-dynamic";

export default async function AdminCurriculumPage() {
  const subjects = await getCurriculumOverview();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider">Curriculum Manager</span>
          <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Subjects & Lessons</h1>
          <p className="text-slate-500 text-sm">
            The 8 default subjects are shared with every school. Add your own subjects, set XP per lesson, and customise quizzes.
          </p>
        </div>
        <Link href="/admin/screening" className="min-h-11 inline-flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 text-sm font-semibold hover:bg-muted">
          <ClipboardList className="h-4 w-4" aria-hidden="true" /> Screening questions
        </Link>
      </div>

      <NewSubjectForm />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {subjects.map((s) => {
          const ready = s.lessons > 0 && s.quizQuestions > 0 && s.screeningQuestions > 0;
          return (
            <Link
              key={s.id}
              href={`/admin/curriculum/${s.id}`}
              className="bg-card rounded-3xl p-5 border-2 border-border hover:border-primary/50 transition-colors space-y-3 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              <div className="flex items-center gap-3">
                <span className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-2xl shrink-0" aria-hidden="true">
                  {s.icon_emoji}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="font-bold text-foreground">{s.name}</h2>
                  <span
                    className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-lg mt-0.5 ${
                      s.isOwn ? "bg-teacher-soft text-teacher" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {s.isOwn ? "Your school's subject" : "Default · shared"}
                  </span>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" aria-hidden="true" />
              </div>
              <dl className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                {[
                  ["Lessons", s.lessons],
                  ["Total XP", s.totalXp],
                  ["Activities", s.activities],
                  [s.quizIsCustom ? "Quiz (custom)" : "Quiz", s.quizQuestions],
                ].map(([k, v]) => (
                  <div key={k as string} className="rounded-xl bg-muted/60 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-bold text-foreground text-base">{v}</dd>
                  </div>
                ))}
              </dl>
              {s.isOwn && (
                <p className={`text-xs font-semibold flex items-center gap-1.5 ${ready ? "text-success" : "text-warning"}`}>
                  {ready ? <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> : <AlertCircle className="h-4 w-4" aria-hidden="true" />}
                  {ready
                    ? "Ready for students"
                    : s.lessons === 0
                    ? "Hidden from students until it has at least one lesson"
                    : "Add a quiz and a screening question to complete it"}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
