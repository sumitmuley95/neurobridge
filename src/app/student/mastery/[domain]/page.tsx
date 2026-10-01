import Link from "next/link";
import { getCurrentStudent } from "@/lib/auth-session";
import { createClient } from "@/lib/supabase/server";
import { canSeeDomain, getMasteryQuestions } from "@/lib/curriculum";
import { MasteryClient } from "@/components/student/MasteryClient";
import type { MasteryQuestion } from "@/lib/data/mastery-questions";

// Mastery questions now come from the database: the school's own questions
// for this subject if it has set them, otherwise the default questions.
export default async function UnitMasteryPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain: domainId } = await params;
  const student = await getCurrentStudent();
  const schoolId = student.type === "institutional" ? student.schoolId : null;

  const supabase = await createClient();
  const { data: domain } = await supabase.from("domains").select("id, school_id").eq("id", domainId).maybeSingle();
  const { questions: rows } = canSeeDomain(domain, schoolId)
    ? await getMasteryQuestions(domainId, schoolId)
    : { questions: [] };

  const questions: MasteryQuestion[] = rows.map((q, i) => ({
    id: i + 1,
    prompt: q.prompt,
    imageSrc: q.image_src ?? undefined,
    visualEmoji: q.visual_emoji ?? undefined,
    subText: q.sub_text ?? undefined,
    options: q.options,
    correctAnswer: q.correct_answer,
  }));

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-card border-2 border-border rounded-3xl p-8 space-y-3">
        <h1 className="text-xl font-bold font-heading">No mastery check yet</h1>
        <p className="text-sm text-muted-foreground">This unit doesn&apos;t have quiz questions yet. Please ask your school admin.</p>
        <Link href={`/student/learning/${domainId}`} className="inline-flex min-h-11 items-center font-semibold text-student">Back to the unit</Link>
      </div>
    );
  }
  return <MasteryClient questions={questions} />;
}
