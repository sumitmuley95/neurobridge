"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import {
  cookieOptions,
  encodeSession,
  SESSION_COOKIES,
  DASHBOARD_FOR,
  type SessionRole,
} from "@/lib/session";

// Only one person is logged in per browser: signing in clears other roles.
async function startSession(role: SessionRole, data: unknown) {
  const cookieStore = await cookies();
  for (const [r, name] of Object.entries(SESSION_COOKIES)) {
    if (r !== role) cookieStore.delete(name);
  }
  cookieStore.set(SESSION_COOKIES[role], encodeSession(data), cookieOptions);
}

// Characters that would break the PostgREST `or(...)` filter below.
function cleanIdentifier(s: string) {
  return s.replace(/[,()]/g, "").trim();
}

// 1. Individual Student Signup (Creates Student + Linked Parent Profile)
export async function registerIndividualStudent(formData: {
  fullName: string;
  phone: string;
  accessPin: string;
}) {
  const supabase = await createClient();
  const enrollmentCode = `IND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const parentId = crypto.randomUUID();

  // Create linked parent profile first
  await supabase.from("profiles").insert({
    id: parentId,
    full_name: `${formData.fullName}'s Caregiver`,
    role: "parent",
  });

  // Create individual student linked to parent
  const { data: student, error } = await supabase
    .from("students")
    .insert({
      full_name: formData.fullName,
      phone: formData.phone,
      access_pin: formData.accessPin,
      student_type: "individual",
      enrollment_code: enrollmentCode,
      parent_id: parentId,
    })
    .select("id, full_name, enrollment_code")
    .single();

  if (error) return { success: false, error: error.message };

  await startSession("student", {
    id: student.id,
    name: student.full_name,
    type: "individual",
    schoolId: null,
  });

  return { success: true, student, redirectTo: "/student/screening" };
}

// 2. Student Login with Track Restriction (Individual vs Institutional)
export async function loginStudent(
  identifier: string,
  pin: string,
  expectedType: "individual" | "institutional"
) {
  const supabase = await createClient();
  const id = cleanIdentifier(identifier);

  const { data: student, error } = await supabase
    .from("students")
    .select("id, full_name, student_type, school_id")
    .or(`enrollment_code.eq.${id},phone.eq.${id},full_name.ilike.${id}`)
    .eq("access_pin", pin)
    .single();

  if (error || !student) {
    return { success: false, error: "Invalid Student credentials or PIN" };
  }

  // Cross-track boundary validation
  if (student.student_type !== expectedType) {
    if (expectedType === "institutional") {
      return {
        success: false,
        error: "This account is registered as an Individual. Please log in under Individual Student.",
      };
    } else {
      return {
        success: false,
        error: "This account is enrolled with a School. Please switch to the School / Institute tab.",
      };
    }
  }

  await startSession("student", {
    id: student.id,
    name: student.full_name,
    type: student.student_type,
    schoolId: student.school_id ?? null,
  });

  return { success: true, redirectTo: DASHBOARD_FOR.student };
}

// 3. Parent Login (Using Student's Phone or Enrollment Code + Student's PIN)
export async function loginParent(identifier: string, pin: string) {
  const supabase = await createClient();
  const id = cleanIdentifier(identifier);

  const { data: student, error } = await supabase
    .from("students")
    .select("id, full_name, parent_id, school_id, profiles:parent_id(id, full_name)")
    .or(`enrollment_code.eq.${id},phone.eq.${id},full_name.ilike.${id}`)
    .eq("access_pin", pin)
    .single();

  if (error || !student) {
    return { success: false, error: "No student matching these credentials was found." };
  }

  // School-enrolled students added by an admin may not have a parent profile
  // yet. Create one now and link it, so messages have a real sender.
  let parentProfile = student.profiles as unknown as { id: string; full_name: string } | null;
  if (!parentProfile) {
    const newId = crypto.randomUUID();
    const fullName = `${student.full_name}'s Parent`;
    const { error: pErr } = await supabase
      .from("profiles")
      .insert({ id: newId, full_name: fullName, role: "parent" });
    if (!pErr) {
      await supabase.from("students").update({ parent_id: newId }).eq("id", student.id);
      parentProfile = { id: newId, full_name: fullName };
    } else {
      return { success: false, error: "Could not set up the parent account. Please try again." };
    }
  }

  await startSession("parent", {
    studentId: student.id,
    studentName: student.full_name,
    parentId: parentProfile.id,
    parentName: parentProfile.full_name,
    schoolId: student.school_id ?? null,
  });

  return { success: true, redirectTo: DASHBOARD_FOR.parent };
}

// 4. Teacher / School Admin Login (email + PIN, both stored in profiles)
export async function loginStaff(
  identifier: string,
  passwordOrPin: string,
  role: "teacher" | "admin"
) {
  const supabase = await createClient();

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, school_id, access_pin")
    .eq("email", identifier.trim())
    .eq("role", role)
    .maybeSingle();

  if (error || !profile || !profile.access_pin || profile.access_pin !== passwordOrPin) {
    return {
      success: false,
      error: role === "teacher" ? "Incorrect teacher email or PIN." : "Incorrect admin email or PIN.",
    };
  }

  if (role === "admin") {
    await startSession("admin", {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      role: "admin",
      schoolId: profile.school_id ?? null,
    });
  } else {
    await startSession("teacher", {
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      role: "teacher",
      schoolId: profile.school_id ?? null,
    });
  }

  return {
    success: true,
    profile: { role: profile.role, full_name: profile.full_name },
    redirectTo: DASHBOARD_FOR[role],
  };
}

// 5. Logout — clears every session cookie. The client then does a full page
// replace to "/", so Back/Forward can't show a cached portal page.
export async function logout() {
  const cookieStore = await cookies();
  for (const name of Object.values(SESSION_COOKIES)) cookieStore.delete(name);
  return { success: true };
}
