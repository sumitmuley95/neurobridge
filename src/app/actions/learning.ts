"use server";

import { createClient } from "@/lib/supabase/server";
import { getPersonalizedRecommendation } from "@/lib/ai/recommendation";
import { getCurrentStudent } from "@/lib/auth-session";
import { canSeeDomain, getVisibleDomains } from "@/lib/curriculum";
import { revalidatePath } from "next/cache";

type Stage = "Foundation" | "Functional" | "Generalization" | "Mastered";

function stageFor(mastery: number): Stage {
  if (mastery >= 100) return "Mastered";
  if (mastery >= 75) return "Generalization";
  if (mastery >= 50) return "Functional";
  return "Foundation";
}

function clamp(n: unknown, min: number, max: number, fallback: number) {
  const v = Number(n);
  return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
}

/** Activities a student can see: defaults (school_id NULL) + their own school's. */
function canSeeActivity(activity: { school_id: string | null } | null, schoolId: string | null | undefined) {
  if (!activity) return false;
  return activity.school_id === null || (!!schoolId && activity.school_id === schoolId);
}

/* ======================= Dashboard learning path ======================= */

export async function getStudentLearningPath() {
  const supabase = await createClient();
  const me = await getCurrentStudent();
  const studentId = me.id; // always from the session
  const schoolId = me.type === "institutional" ? me.schoolId : null;

  const [{ data: screeningResults }, { data: skillProgressList }, allDomains] = await Promise.all([
    supabase
      .from("screening_domain_results")
      .select("domain_id, status, combined_score")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase.from("skill_progress").select("*, skills(domain_id)").eq("student_id", studentId),
    getVisibleDomains(schoolId, { onlyWithLessons: true }),
  ]);

  // Latest screening result per subject
  const screeningMap = new Map<string, string>();
  for (const res of screeningResults || []) {
    if (!screeningMap.has(res.domain_id)) {
      screeningMap.set(res.domain_id, res.status === "screened_adequate" ? "Screened Adequate" : "Needs Practice");
    }
  }

  const domainProgressMap = new Map<string, { stage: Stage; mastery: number }>();
  for (const sp of skillProgressList || []) {
    const domainId = sp.skills?.domain_id;
    if (domainId) {
      domainProgressMap.set(domainId, {
        stage: (sp.current_stage as Stage) || "Foundation",
        mastery: Number(sp.mastery_percentage) || 0,
      });
    }
  }

  const aiRec = (await getPersonalizedRecommendation(studentId, schoolId)) ?? {
    activityId: "",
    studentExplanation: "",
    pedagogicalReason: "",
    isAiGenerated: false,
  };

  const { data: activity } = aiRec.activityId
    ? await supabase
        .from("activities")
        .select("id, domain_id, title, description, stage")
        .eq("id", aiRec.activityId)
        .maybeSingle()
    : { data: null };

  const formattedDomains = allDomains.map((d) => {
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

/* ============================ Practice activity ============================ */

/** Activity for the player page. Never includes the correct answer. */
export async function getActivityById(activityId: string) {
  const supabase = await createClient();
  const me = await getCurrentStudent();
  const schoolId = me.type === "institutional" ? me.schoolId : null;

  const { data } = await supabase
    .from("activities")
    .select("id, skill_id, domain_id, school_id, title, description, prompt, helper_audio_text, visual_cue, options, hint, domains(name, school_id)")
    .eq("id", activityId)
    .maybeSingle();

  if (!data || !canSeeActivity(data, schoolId)) return null;
  const domain = data.domains as unknown as { name: string; school_id: string | null } | null;
  if (domain && !canSeeDomain(domain, schoolId)) return null;

  return data;
}

/**
 * Grades one answer on the server and records the attempt.
 * Mastery goes up by 25% only the first time a student solves a given activity,
 * so repeating the same activity can't fake mastery.
 */
export async function submitActivityAttempt(payload: {
  activityId: string;
  selectedOption: string;
  attemptsCount: number;
  promptingLevel: number;
  responseTimeSeconds: number;
}) {
  const supabase = await createClient();
  const me = await getCurrentStudent();
  const schoolId = me.type === "institutional" ? me.schoolId : null;

  const { data: activity } = await supabase
    .from("activities")
    .select("id, skill_id, school_id, correct_answer")
    .eq("id", payload.activityId)
    .maybeSingle();

  if (!activity || !canSeeActivity(activity, schoolId)) {
    return { success: false, isCorrect: false, error: "Activity not found." };
  }

  const isCorrect = String(payload.selectedOption || "") === String(activity.correct_answer);

  // Was this activity already solved before? (checked before inserting this attempt)
  const { count: priorCorrect } = await supabase
    .from("activity_attempts")
    .select("id", { count: "exact", head: true })
    .eq("student_id", me.id)
    .eq("activity_id", activity.id)
    .eq("is_correct", true);

  await supabase.from("activity_attempts").insert({
    student_id: me.id,
    activity_id: activity.id,
    is_correct: isCorrect,
    attempts_count: clamp(payload.attemptsCount, 1, 50, 1),
    prompting_level: clamp(payload.promptingLevel, 0, 3, 0),
    response_time_seconds: clamp(payload.responseTimeSeconds, 0, 3600, 0),
  });

  if (activity.skill_id) {
    const gain = isCorrect && (priorCorrect ?? 0) === 0 ? 25 : 0;

    const { data: existing } = await supabase
      .from("skill_progress")
      .select("id, attempts_count, mastery_percentage")
      .eq("student_id", me.id)
      .eq("skill_id", activity.skill_id)
      .maybeSingle();

    if (existing) {
      const mastery = Math.min(100, (Number(existing.mastery_percentage) || 0) + gain);
      await supabase
        .from("skill_progress")
        .update({
          attempts_count: (existing.attempts_count || 0) + 1,
          mastery_percentage: mastery,
          current_stage: stageFor(mastery),
          last_activity_at: new Date().toISOString(),
        })
        .eq("id", existing.id);
    } else {
      await supabase.from("skill_progress").insert({
        student_id: me.id,
        skill_id: activity.skill_id,
        current_stage: stageFor(gain),
        mastery_percentage: gain,
        average_prompting_level: clamp(payload.promptingLevel, 0, 3, 0),
        attempts_count: 1,
        last_activity_at: new Date().toISOString(),
      });
    }
  }

  revalidatePath("/student/dashboard");
  revalidatePath("/teacher/dashboard");
  revalidatePath("/parent/dashboard");

  return { success: true, isCorrect };
}