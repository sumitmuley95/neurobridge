import { getCurrentStudent } from "@/lib/auth-session";
import { getScreeningQuestions } from "@/lib/curriculum";
import { ScreeningClient, type ScreeningTask } from "@/components/student/ScreeningClient";

// Screening questions now come from the database:
// individual learners get the default 8; school learners get their school's set.
export default async function ScreeningPage() {
  const student = await getCurrentStudent();
  const rows = await getScreeningQuestions(student.type === "institutional" ? student.schoolId : null);

  const tasks: ScreeningTask[] = rows.map((q) => ({
    id: q.id,
    domainId: q.domain_id,
    domainName: q.domains?.name ?? q.domain_id,
    prompt: q.prompt,
    visualCue: q.visual_cue ?? "",
    options: q.options,
  }));

  if (tasks.length === 0) {
    return (
      <div className="max-w-md mx-auto bg-card border-2 border-border rounded-3xl p-8 space-y-2">
        <h1 className="text-xl font-bold font-heading">No screening questions yet</h1>
        <p className="text-sm text-muted-foreground">Please ask your school admin to set up the screening.</p>
      </div>
    );
  }
  return <ScreeningClient tasks={tasks} />;
}
