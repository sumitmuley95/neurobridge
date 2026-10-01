"use server";

import { createClient } from "@/lib/supabase/server";
import { getPersonalizedRecommendation } from "@/lib/ai/recommendation";
import { getCurrentStudent } from "@/lib/auth-session";
import { getVisibleDomains } from "@/lib/curriculum";
import { revalidatePath } from "next/cache";

export async function getStudentLearningPath(studentId: string) {
  const supabase = await createClient();

  const { data: screeningResults } = await supabase
    .from("screening_domain_results")
    .select("domain_id, status, combined_score")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const { data: skillProgressList } = await supabase
    .from("skill_progress")
    .select("*, skills(domain_id)")
    .eq("student_id", studentId);

  // Default subjects + this student's school's own subjects
  const me = await getCurrentStudent();
  const schoolId = me.type === "institutional" ? me.schoolId : null;
  const allDomains = await getVisibleDomains(schoolId, { onlyWithLessons: true });

  const screeningMap = new Map<string, string>();
  if (screeningResults) {
    for (const res of screeningResults) {
      if (!screeningMap.has(res.domain_id)) {
        screeningMap.set(
          res.domain_id,
          res.status === "screened_adequate" ? "Screened Adequate" : "Needs Practice"
        );
      }
    }
  }

  const domainProgressMap = new Map<
    string,
    { stage: "Foundation" | "Functional" | "Generalization" | "Mastered"; mastery: number }
  >();

  if (skillProgressList) {
    for (const sp of skillProgressList) {
      const domainId = sp.skills?.domain_id;
      if (domainId) {
        domainProgressMap.set(domainId, {
          stage: sp.current_stage || "Foundation",
          mastery: Number(sp.mastery_percentage) || 0,
        });
      }
    }
  }

  const aiRec = (await getPersonalizedRecommendation(studentId, schoolId)) ?? {
    activityId: "",
    studentExplanation: "",
    pedagogicalReason: "",
    isAiGenerated: false,
  };

  const { data: activity } = aiRec.activityId
    ? await supabase.from("activities").select("*").eq("id", aiRec.activityId).single()
    : { data: null };

  const formattedDomains = (allDomains || []).map((d) => {
    const screeningStatus = screeningMap.get(d.id) || "Needs Practice";
    const prog = domainProgressMap.get(d.id);

    let displayStatus = screeningStatus;
    if (prog && prog.mastery > 0) {
      displayStatus = prog.mastery >= 100 ? "Mastered" : `In Progress (${prog.mastery}%)`;
    }

    return {
      id: d.id,
      name: d.name,
      iconEmoji: d.icon_emoji,
      status: displayStatus,
      stage: prog?.stage || "Foundation",
      mastery: prog?.mastery || 0,
    };
  });

  return {
    allDomains: formattedDomains,
    recommendedActivity: activity || null,
    aiMeta: aiRec,
  };
}

export async function getActivityById(activityId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("activities")
    .select("*, domains(name)")
    .eq("id", activityId)
    .single();

  if (error || !data) return null;
  return data;
}

export async function submitActivityAttempt(payload: {
  studentId?: string;
  activityId: string;
  skillId: string;
  isCorrect: boolean;
  attemptsCount: number;
  promptingLevel: number;
  responseTimeSeconds: number;
}) {
  const supabase = await createClient();
  const currentStudent = await getCurrentStudent();
  // Always the logged-in student (never an ID sent from the browser)
  const targetStudentId = currentStudent.id;

  await supabase.from("activity_attempts").insert({
    student_id: targetStudentId,
    activity_id: payload.activityId,
    is_correct: payload.isCorrect,
    attempts_count: payload.attemptsCount,
    prompting_level: payload.promptingLevel,
    response_time_seconds: payload.responseTimeSeconds,
  });

  const { data: existingProgress } = await supabase
    .from("skill_progress")
    .select("*")
    .eq("student_id", targetStudentId)
    .eq("skill_id", payload.skillId)
    .single();

  if (existingProgress) {
    const updatedAttempts = (existingProgress.attempts_count || 0) + 1;
    const currentMastery = Number(existingProgress.mastery_percentage) || 0;
    const updatedMastery = payload.isCorrect
      ? Math.min(100, currentMastery + 25)
      : currentMastery;

    const newStage =
      updatedMastery >= 100
        ? "Mastered"
        : updatedMastery >= 75
        ? "Generalization"
        : updatedMastery >= 50
        ? "Functional"
        : "Foundation";

    await supabase
      .from("skill_progress")
      .update({
        attempts_count: updatedAttempts,
        mastery_percentage: updatedMastery,
        current_stage: newStage,
        last_activity_at: new Date().toISOString(),
      })
      .eq("id", existingProgress.id);
  } else {
    await supabase.from("skill_progress").insert({
      student_id: targetStudentId,
      skill_id: payload.skillId,
      current_stage: "Foundation",
      mastery_percentage: payload.isCorrect ? 25 : 0,
      average_prompting_level: payload.promptingLevel,
      attempts_count: 1,
    });
  }

  revalidatePath("/student/dashboard");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/parent/dashboard");

  return { success: true };
}
