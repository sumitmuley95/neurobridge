"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth-session";
import bcrypt from "bcryptjs";

// Every admin action is limited to the logged-in admin's own school.
const NO_SCHOOL = "00000000-0000-0000-0000-000000000000";
const PIN_RULE = /^\d{4,6}$/;

async function mySchoolId() {
  const admin = await getCurrentAdmin();
  return admin.schoolId ?? NO_SCHOOL;
}

export async function getAdminDashboardStats() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();

  const [{ count: teachersCount }, { count: studentsCount }, { count: domainsCount }] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("role", "teacher").eq("school_id", schoolId),
    supabase
      .from("students")
      .select("id", { count: "exact", head: true })
      .eq("student_type", "institutional")
      .eq("school_id", schoolId),
    supabase
      .from("domains")
      .select("id", { count: "exact", head: true })
      .or(`school_id.is.null,school_id.eq.${schoolId}`),
  ]);

  return {
    schools: schoolId === NO_SCHOOL ? 0 : 1,
    teachers: teachersCount || 0,
    students: studentsCount || 0,
    domains: domainsCount || 0,
  };
}

/** Only the admin's own school. */
export async function getSchools() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const { data } = await supabase.from("schools").select("id, name").eq("id", schoolId);
  return data || [];
}

/** New schools are onboarded by the NeuroBridge team. */
export async function createSchool(name: string) {
  void name;
  return {
    success: false,
    error: "New schools are set up by the NeuroBridge team. Please contact us to add a school.",
  };
}

/* ----------------------------- Teachers ----------------------------- */

export async function getTeachers() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, created_at")
    .eq("role", "teacher")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createTeacher(fullName: string, email: string, accessPin?: string) {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const name = (fullName || "").trim();
  const mail = (email || "").trim().toLowerCase();
  const pin = (accessPin || "").trim();

  if (!name) return { success: false, error: "Please enter the teacher's name." };
  if (!/^\S+@\S+\.\S+$/.test(mail)) return { success: false, error: "Please enter a valid email." };
  if (!PIN_RULE.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };

  const { data: existing } = await supabase.from("profiles").select("id").ilike("email", mail).maybeSingle();
  if (existing) return { success: false, error: "A user with this email already exists." };

  const { error } = await supabase.from("profiles").insert({
    id: crypto.randomUUID(),
    full_name: name,
    email: mail,
    role: "teacher",
    school_id: schoolId,
    access_pin: await bcrypt.hash(pin, 10),
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function updateTeacherPin(teacherId: string, accessPin: string) {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const pin = (accessPin || "").trim();
  if (!PIN_RULE.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };

  const { error, count } = await supabase
    .from("profiles")
    .update({ access_pin: await bcrypt.hash(pin, 10) }, { count: "exact" })
    .eq("id", teacherId)
    .eq("role", "teacher")
    .eq("school_id", schoolId);
  if (error) return { success: false, error: error.message };
  if (!count) return { success: false, error: "Teacher not found at your school." };
  return { success: true };
}

/* ----------------------------- Students ----------------------------- */

/** Never returns access_pin. */
export async function getAdminStudents() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const { data } = await supabase
    .from("students")
    .select("id, full_name, enrollment_code, student_type, created_at, schools(name)")
    .eq("student_type", "institutional")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data || [];
}

/** Returns the enrollment code so the admin can share it with the family once. */
export async function createInstitutionalStudent(payload: { fullName: string; accessPin: string }) {
  const supabase = await createClient();
  const schoolId = await mySchoolId(); // always the admin's own school
  if (schoolId === NO_SCHOOL) return { success: false, error: "Your admin account is not linked to a school." };

  const name = (payload.fullName || "").trim();
  const pin = (payload.accessPin || "").trim();
  if (!name) return { success: false, error: "Please enter the student's name." };
  if (!PIN_RULE.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };

  // Make sure the enrollment code is unique
  let enrollmentCode = "";
  for (let i = 0; i < 5; i++) {
    const candidate = `SCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
    const { data: taken } = await supabase.from("students").select("id").eq("enrollment_code", candidate).maybeSingle();
    if (!taken) {
      enrollmentCode = candidate;
      break;
    }
  }
  if (!enrollmentCode) return { success: false, error: "Could not create an enrollment code. Please try again." };

  const { error } = await supabase.from("students").insert({
    full_name: name,
    school_id: schoolId,
    access_pin: await bcrypt.hash(pin, 10),
    student_type: "institutional",
    enrollment_code: enrollmentCode,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/students");
  return { success: true, enrollmentCode };
}

/** Admin can set a new PIN for a student at their school (PINs are never shown). */
export async function updateStudentPin(studentId: string, accessPin: string) {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const pin = (accessPin || "").trim();
  if (!PIN_RULE.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };

  const { error, count } = await supabase
    .from("students")
    .update({ access_pin: await bcrypt.hash(pin, 10) }, { count: "exact" })
    .eq("id", studentId)
    .eq("student_type", "institutional")
    .eq("school_id", schoolId);
  if (error) return { success: false, error: error.message };
  if (!count) return { success: false, error: "Student not found at your school." };
  return { success: true };
}