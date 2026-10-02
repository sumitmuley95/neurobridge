"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth-session";
import { canSeeDomain, getMasteryQuestions } from "@/lib/curriculum";
import { revalidatePath } from "next/cache";

export interface MasteryResult {
  passed: boolean;
  scorePercentage: number;
  correctCount: number;
  totalQuestions: number;
  error?: string;
}

const PASS_MARK = 70; // percent

/**
 * Grades the unit mastery quiz on the server.
 * The browser only sends the chosen option ids, in question order.
 * Passing marks the subject as Mastered; failing changes nothing, so a
 * student never loses progress for trying.
 */
export async function submitUnitMasteryCheck(domainId: string, answers: string[]): Promise<MasteryResult> {
  const supabase = await createClient();
  const student = await getCurrentStudent();
  const schoolId = student.type === "institutional" ? student.schoolId : null;

  const fail = (error: string, total = 0): MasteryResult => ({
    passed: false,
    scorePercentage: 0,
    correctCount: 0,
    totalQuestions: total,
    error,
  });

  const { data: domain } = await supabase.from("domains").select("id, school_id").eq("id", domainId).maybeSingle();
  if (!canSeeDomain(domain, schoolId)) return fail("This unit was not found.");

  const { questions } = await getMasteryQuestions(domainId, schoolId);
  if (!questions.length) return fail("This unit has no quiz questions yet.");
  if (!Array.isArray(answers) || answers.length !== questions.length) {
    return fail("Please answer every question and try again.", questions.length);
  }

  const correctCount = questions.filter((q, i) => q.correct_answer === String(answers[i])).length;
  const totalQuestions = questions.length;
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= PASS_MARK;

  if (passed) {
    const { data: domainSkills } = await supabase.from("skills").select("id").eq("domain_id", domainId);
    const now = new Date().toISOString();

    if (domainSkills && domainSkills.length > 0) {
      await supabase.from("skill_progress").upsert(
        domainSkills.map((skill) => ({
          student_id: student.id,
          skill_id: skill.id,
          current_stage: "Mastered",
          mastery_percentage: 100,
          last_activity_at: now,
        })),
        { onConflict: "student_id,skill_id" }
      );
    }

    await supabase
      .from("screening_domain_results")
      .update({ status: "screened_adequate", combined_score: 100 })
      .eq("student_id", student.id)
      .eq("domain_id", domainId);
  }

  revalidatePath(`/student/learning/${domainId}`);
  revalidatePath("/student/dashboard");
  revalidatePath("/parent/dashboard");
  revalidatePath("/teacher/dashboard");

  return { passed, scorePercentage, correctCount, totalQuestions };
}