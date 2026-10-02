"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher, getCurrentParent } from "@/lib/auth-session";
import { canSeeDomain, getVisibleDomains } from "@/lib/curriculum";
const NO_SCHOOL = "00000000-0000-0000-0000-000000000000";
const MAX_NOTE_LEN = 2000;

// Columns that are safe to send to the browser (never access_pin)
const STUDENT_PUBLIC_FIELDS =
  "id, full_name, student_type, school_id, parent_id, enrollment_code, created_at, profiles:parent_id(full_name, email)";

// 1. Fetch ONLY institutional students of the teacher's own school
export async function getTeacherDashboardData() {
  const supabase = await createClient();
  const teacher = await getCurrentTeacher();

  const { data: students } = await supabase
    .from("students")
    .select(STUDENT_PUBLIC_FIELDS)
    .eq("student_type", "institutional")
    .eq("school_id", teacher.schoolId ?? NO_SCHOOL)
    .order("created_at", { ascending: false });

  const studentIds = (students || []).map((s) => s.id);
  const { data: recentAttempts } = studentIds.length
    ? await supabase
        .from("activity_attempts")
        .select("*, activities(title, domain_id), students(full_name)")
        .in("student_id", studentIds)
        .order("completed_at", { ascending: false })
        .limit(5)
    : { data: [] };

  return {
    students: students || [],
    recentAttempts: recentAttempts || [],
  };
}

// 2. A teacher can only open students enrolled at their own school
// 2. A teacher can only open students enrolled at their own school
export async function getStudentDetailForTeacher(studentId: string) {
  const supabase = await createClient();
  const teacher = await getCurrentTeacher();

  const { data: student } = await supabase
    .from("students")
    .select(STUDENT_PUBLIC_FIELDS)
    .eq("id", studentId)
    .eq("student_type", "institutional")
    .eq("school_id", teacher.schoolId ?? NO_SCHOOL)
    .maybeSingle();

  if (!student) {
    return {
      student: null,
      domains: [],
      domainResults: [],
      skillProgress: [],
      observations: [],
      error: "Access Denied: This student is not enrolled at your school.",
    };
  }

  const [{ data: domainResults }, { data: skillProgress }, { data: observations }, domains] = await Promise.all([
    supabase
      .from("screening_domain_results")
      .select("*, domains(name, icon_emoji)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("skill_progress")
      .select("*, skills(name, domain_id)")
      .eq("student_id", studentId),
    supabase
      .from("teacher_observations")
      .select("*, profiles:teacher_id(full_name)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    getVisibleDomains(teacher.schoolId),
  ]);

  return {
    student,
    domains: domains.map((d) => ({ id: d.id, name: d.name, icon_emoji: d.icon_emoji })),
    domainResults: domainResults || [],
    skillProgress: skillProgress || [],
    observations: observations || [],
  };
}


// 3. Teachers can only add notes for students at their own school
export async function addTeacherObservation(payload: {
  studentId: string;
  teacherId?: string; // ignored: always the logged-in teacher
  domainId: string;
  observationText: string;
}) {
  const supabase = await createClient();
  const teacher = await getCurrentTeacher();

  const text = (payload.observationText || "").trim().slice(0, MAX_NOTE_LEN);
  if (!text) return { success: false, error: "Please write an observation." };
  if (!payload.domainId) return { success: false, error: "Please choose a subject." };

  const { data: student } = await supabase
    .from("students")
    .select("id")
    .eq("id", payload.studentId)
    .eq("student_type", "institutional")
    .eq("school_id", teacher.schoolId ?? NO_SCHOOL)
    .maybeSingle();

  if (!student) return { success: false, error: "This student is not enrolled at your school." };
    const { data: domain } = await supabase
      .from("domains")
      .select("id, school_id")
      .eq("id", payload.domainId)
      .maybeSingle();
    if (!canSeeDomain(domain, teacher.schoolId)) {
      return { success: false, error: "Please choose a valid subject." };
    }
  const { error } = await supabase.from("teacher_observations").insert({
    student_id: student.id,
    teacher_id: teacher.id,
    domain_id: payload.domainId,
    observation_text: text,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/teacher/student/${student.id}`);
  revalidatePath("/parent/dashboard");
  return { success: true };
}

// 4. Parent dashboard: always the parent's own child (from the session)
export async function getParentDashboardData() {
  const supabase = await createClient();
  const currentParent = await getCurrentParent();
  const studentId = currentParent.studentId;

  const [{ data: student }, { data: domainResults }, { data: observations }] = await Promise.all([
    supabase
      .from("students")
      .select("id, full_name, student_type, school_id")
      .eq("id", studentId)
      .maybeSingle(),
    supabase
      .from("screening_domain_results")
      .select("*, domains(name, icon_emoji)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
    supabase
      .from("teacher_observations")
      .select("*, profiles:teacher_id(full_name)")
      .eq("student_id", studentId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    student,
    domainResults: domainResults || [],
    observations: observations || [],
  };
}

// Parent-teacher messaging lives in src/app/actions/messages.ts (the sender is
// always taken from the login session, never sent by the browser).