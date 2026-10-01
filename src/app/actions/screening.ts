"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth-session";

export interface TaskSubmission {
  domainId: string;
  isCorrect: boolean;
  responseTimeSeconds: number;
}

export async function submitScreeningAttempt(
  submissions: TaskSubmission[],
  explicitStudentId?: string
) {
  const supabase = await createClient();
  const currentStudent = await getCurrentStudent();
  void explicitStudentId; // ignored: always the logged-in student
  const targetStudentId = currentStudent.id;

  const totalQuestions = submissions.length;
  const correctCount = submissions.filter((s) => s.isCorrect).length;
  const totalAccuracyScore = (correctCount / totalQuestions) * 100;
  const totalResponseTime = submissions.reduce(
    (acc, curr) => acc + curr.responseTimeSeconds,
    0
  );

  // 1. Record screening session
  const { data: screening, error: screeningError } = await supabase
    .from("screenings")
    .insert({
      student_id: targetStudentId,
      total_accuracy_score: totalAccuracyScore,
      total_response_time_seconds: totalResponseTime,
    })
    .select()
    .single();

  if (screeningError) {
    console.error("Error saving screening:", screeningError);
    return { success: false, error: screeningError.message };
  }

  // 2. Score each domain. A school's screening set may ask more than one
  // question per subject, so answers are combined per subject. With one
  // question per subject this gives exactly the same scores as before.
  const byDomain = new Map<string, TaskSubmission[]>();
  for (const sub of submissions) {
    byDomain.set(sub.domainId, [...(byDomain.get(sub.domainId) || []), sub]);
  }

  const domainResults = [...byDomain.entries()].map(([domainId, subs]) => {
    const correctShare = subs.filter((s) => s.isCorrect).length / subs.length;
    const isCorrect = correctShare >= 0.5;
    const responseTime = subs.reduce((n, s) => n + s.responseTimeSeconds, 0) / subs.length;
    const accuracyScore = Number((80 * correctShare).toFixed(2));
    const speedRatio = Math.max(0, 1 - responseTime / 90);
    const responseScore = Number((speedRatio * 20).toFixed(2));
    const combinedScore = accuracyScore + responseScore;

    const status =
      isCorrect && combinedScore >= 70
        ? "screened_adequate"
        : "needs_practice";

    return {
      screening_id: screening.id,
      student_id: targetStudentId,
      domain_id: domainId,
      is_correct: isCorrect,
      response_time_seconds: Number(responseTime.toFixed(2)),
      accuracy_score: accuracyScore,
      response_score: responseScore,
      combined_score: combinedScore,
      status: status,
    };
  });

  await supabase.from("screening_domain_results").insert(domainResults);

  return {
    success: true,
    screeningId: screening.id,
    domainResults,
  };
}
