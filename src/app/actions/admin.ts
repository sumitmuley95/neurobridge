"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth-session";

// Every admin action is limited to the logged-in admin's own school.
const NO_SCHOOL = "00000000-0000-0000-0000-000000000000";
async function mySchoolId() {
  const admin = await getCurrentAdmin();
  return admin.schoolId ?? NO_SCHOOL;
}

export async function getAdminDashboardStats() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();

  const [
    { count: teachersCount },
    { count: studentsCount },
    { count: domainsCount },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "teacher").eq("school_id", schoolId),
    supabase
      .from("students")
      .select("*", { count: "exact", head: true })
      .eq("student_type", "institutional")
      .eq("school_id", schoolId),
    supabase
      .from("domains")
      .select("*", { count: "exact", head: true })
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
  const { data } = await supabase.from("schools").select("*").eq("id", schoolId);
  return data || [];
}

/** New schools are onboarded by NeuroBridge (see supabase/02_setup_school.sql). */
export async function createSchool(name: string) {
  void name;
  return {
    success: false,
    error: "New schools are set up by the NeuroBridge team. Please contact us to add a school.",
  };
}

export async function getTeachers() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, school_id, created_at")
    .eq("role", "teacher")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createTeacher(fullName: string, email: string, accessPin?: string) {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const pin = (accessPin || "").trim();
  if (!/^\d{4,6}$/.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };

  const { data: existing } = await supabase.from("profiles").select("id").eq("email", email.trim()).maybeSingle();
  if (existing) return { success: false, error: "A user with this email already exists." };

  const id = crypto.randomUUID();
  const { error } = await supabase.from("profiles").insert({
    id,
    full_name: fullName,
    email: email.trim(),
    role: "teacher",
    school_id: schoolId,
    access_pin: pin,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/teachers");
  return { success: true };
}

export async function updateTeacherPin(teacherId: string, accessPin: string) {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const pin = accessPin.trim();
  if (!/^\d{4,6}$/.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };
  const { error, count } = await supabase
    .from("profiles")
    .update({ access_pin: pin }, { count: "exact" })
    .eq("id", teacherId)
    .eq("role", "teacher")
    .eq("school_id", schoolId);
  if (error) return { success: false, error: error.message };
  if (!count) return { success: false, error: "Teacher not found at your school." };
  return { success: true };
}

export async function getAdminStudents() {
  const supabase = await createClient();
  const schoolId = await mySchoolId();
  const { data } = await supabase
    .from("students")
    .select("*, schools(name)")
    .eq("student_type", "institutional")
    .eq("school_id", schoolId)
    .order("created_at", { ascending: false });
  return data || [];
}

export async function createInstitutionalStudent(payload: {
  fullName: string;
  schoolId: string;
  accessPin: string;
}) {
  const supabase = await createClient();
  const schoolId = await mySchoolId(); // always the admin's own school
  const enrollmentCode = `SCH-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

  const { error } = await supabase.from("students").insert({
    full_name: payload.fullName,
    school_id: schoolId,
    access_pin: payload.accessPin,
    student_type: "institutional",
    enrollment_code: enrollmentCode,
  });

  if (error) return { success: false, error: error.message };
  revalidatePath("/admin/students");
  return { success: true };
}
