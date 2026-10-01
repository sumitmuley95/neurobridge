"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentStudent } from "@/lib/auth-session";
import { revalidatePath } from "next/cache";

export async function submitUnitMasteryCheck(
  domainId: string,
  totalQuestions: number,
  correctCount: number
) {
  const supabase = await createClient();
  const student = await getCurrentStudent();
  const scorePercentage = Math.round((correctCount / totalQuestions) * 100);
  const passed = scorePercentage >= 70; // 70% threshold

  if (passed) {
    // 1. Mark all skills in this domain as Mastered (100%)
    const { data: domainSkills } = await supabase
      .from("skills")
      .select("id")
      .eq("domain_id", domainId);

    if (domainSkills && domainSkills.length > 0) {
      for (const skill of domainSkills) {
        await supabase.from("skill_progress").upsert(
          {
            student_id: student.id,
            skill_id: skill.id,
            current_stage: "Mastered",
            mastery_percentage: 100,
            last_activity_at: new Date().toISOString(),
          },
          { onConflict: "student_id,skill_id" }
        );
      }
    }

    // 2. Update screening status to 'screened_adequate'
    await supabase
      .from("screening_domain_results")
      .update({
        status: "screened_adequate",
        combined_score: 100,
      })
      .eq("student_id", student.id)
      .eq("domain_id", domainId);
  } else {
    // 3. FAILED: RESET ALL 5 VIDEO LESSONS BACK TO ZERO
    const { data: modules } = await supabase
      .from("domain_modules")
      .select("id")
      .eq("domain_id", domainId);

    const moduleIds = (modules || []).map((m) => m.id);

    if (moduleIds.length > 0) {
      await supabase
        .from("student_module_progress")
        .delete()
        .eq("student_id", student.id)
        .in("module_id", moduleIds);
    }

    // Reset skill progress to Foundation / 0%
    const { data: domainSkills } = await supabase
      .from("skills")
      .select("id")
      .eq("domain_id", domainId);

    if (domainSkills) {
      for (const skill of domainSkills) {
        await supabase
          .from("skill_progress")
          .update({
            current_stage: "Foundation",
            mastery_percentage: 0,
          })
          .eq("student_id", student.id)
          .eq("skill_id", skill.id);
      }
    }
  }

  revalidatePath(`/student/learning/${domainId}`);
  revalidatePath("/student/dashboard");
  revalidatePath("/parent/dashboard");
  revalidatePath("/teacher/dashboard");

  return {
    passed,
    scorePercentage,
    correctCount,
    totalQuestions,
  };
}
