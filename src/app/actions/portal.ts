"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentTeacher } from "@/lib/auth-session";

// 1. Fetch ONLY institutional students for teachers
export async function getTeacherDashboardData() {
  const supabase = await createClient();
  const teacher = await getCurrentTeacher();

  // Only students of the teacher's own school
  const { data: students } = await supabase
    .from("students")
    .select("*, profiles:parent_id(full_name, email)")
    .eq("student_type", "institutional") // STRICT PRIVACY ISOLATION
    .eq("school_id", teacher.schoolId ?? "00000000-0000-0000-0000-000000000000")
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

// 2. Prevent teachers from viewing individual students
export async function getStudentDetailForTeacher(studentId: string) {
  const supabase = await createClient();

  const teacher = await getCurrentTeacher();
  const { data: student } = await supabase
    .from("students")
    .select("*, profiles:parent_id(full_name, email)")
    .eq("id", studentId)
    .eq("student_type", "institutional") // BLOCKS ACCESS TO INDIVIDUAL STUDENTS
    .eq("school_id", teacher.schoolId ?? "00000000-0000-0000-0000-000000000000") // and other schools
    .single();

  if (!student) {
    return {
      student: null,
      domainResults: [],
      skillProgress: [],
      observations: [],
      error: "Access Denied: This student is not enrolled at your school.",
    };
  }

  const { data: domainResults } = await supabase
    .from("screening_domain_results")
    .select("*, domains(name, icon_emoji)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const { data: skillProgress } = await supabase
    .from("skill_progress")
    .select("*, skills(name, domain_id)")
    .eq("student_id", studentId);

  const { data: observations } = await supabase
    .from("teacher_observations")
    .select("*, profiles:teacher_id(full_name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return {
    student,
    domainResults: domainResults || [],
    skillProgress: skillProgress || [],
    observations: observations || [],
  };
}

export async function addTeacherObservation(payload: {
  studentId: string;
  teacherId: string;
  domainId: string;
  observationText: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("teacher_observations").insert({
    student_id: payload.studentId,
    teacher_id: (await getCurrentTeacher()).id, // the logged-in teacher, not a fixed ID
    domain_id: payload.domainId,
    observation_text: payload.observationText,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath(`/teacher/student/${payload.studentId}`);
  revalidatePath("/parent/dashboard");
  return { success: true };
}

export async function getParentDashboardData(studentId: string) {
  const supabase = await createClient();

  const { data: student } = await supabase
    .from("students")
    .select("*")
    .eq("id", studentId)
    .single();

  const { data: domainResults } = await supabase
    .from("screening_domain_results")
    .select("*, domains(name, icon_emoji)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  const { data: observations } = await supabase
    .from("teacher_observations")
    .select("*, profiles:teacher_id(full_name)")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  return {
    student,
    domainResults: domainResults || [],
    observations: observations || [],
  };
}

// Parent-teacher messaging lives in src/app/actions/messages.ts (the sender is
// always taken from the login session, never sent by the browser).
