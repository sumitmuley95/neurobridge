"use server";

import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  cookieOptions,
  encodeSession,
  SESSION_COOKIES,
  DASHBOARD_FOR,
  type SessionRole,
} from "@/lib/session";

type DB = Awaited<ReturnType<typeof createClient>>;
const PIN_RULE = /^\d{4,6}$/;

// Only one person is logged in per browser: signing in clears other roles.
async function startSession(role: SessionRole, data: unknown) {
  const cookieStore = await cookies();
  for (const [r, name] of Object.entries(SESSION_COOKIES)) {
    if (r !== role) cookieStore.delete(name);
  }
  cookieStore.set(SESSION_COOKIES[role], encodeSession(data), cookieOptions);
}

// Trim and remove characters that could break a query filter.
function cleanIdentifier(s: string) {
  return (s || "").replace(/[,()"'\\]/g, "").trim();
}

// ilike treats % and _ as wildcards; escape them so the match is exact.
function escapeLike(s: string) {
  return s.replace(/[%_]/g, (c) => `\\${c}`);
}

/**
 * Checks a PIN against either a bcrypt hash or an old plaintext PIN.
 * Old plaintext PINs are upgraded to a bcrypt hash after a successful login.
 */
async function verifyAndUpgradePin(
  supabase: DB,
  table: "students" | "profiles",
  id: string,
  storedPin: string | null,
  providedPin: string
): Promise<boolean> {
  if (!storedPin || !providedPin) return false;
  const stored = String(storedPin);

  if (stored.startsWith("$2")) {
    try {
      return await bcrypt.compare(providedPin, stored);
    } catch {
      return false;
    }
  }

  // Legacy plaintext PIN
  if (stored !== providedPin) return false;
  const newHash = await bcrypt.hash(providedPin, 10);
  await supabase.from(table).update({ access_pin: newHash }).eq("id", id);
  return true;
}

/** All students matching an enrollment code, phone number or exact name (case-insensitive). */
async function findStudentCandidates<T extends { id: string }>(supabase: DB, id: string, select: string): Promise<T[]> {
  if (!id) return [];
  const [byCode, byPhone, byName] = await Promise.all([
    supabase.from("students").select(select).eq("enrollment_code", id).limit(10),
    supabase.from("students").select(select).eq("phone", id).limit(10),
    supabase.from("students").select(select).ilike("full_name", escapeLike(id)).limit(10),
  ]);
  const all = [
    ...((byCode.data ?? []) as unknown as T[]),
    ...((byPhone.data ?? []) as unknown as T[]),
    ...((byName.data ?? []) as unknown as T[]),
  ];
  return all.filter((s, i) => all.findIndex((t) => t.id === s.id) === i);
}

/* ======================= 1. Individual student signup ======================= */

export async function registerIndividualStudent(formData: { fullName: string; phone: string; accessPin: string }) {
  const supabase = await createClient();
  const fullName = (formData.fullName || "").trim();
  const phone = cleanIdentifier(formData.phone);
  const pin = (formData.accessPin || "").trim();

  if (!fullName) return { success: false, error: "Please enter the student's name." };
  if (!/^\d{10}$/.test(phone)) return { success: false, error: "Please enter a 10-digit phone number." };
  if (!PIN_RULE.test(pin)) return { success: false, error: "PIN must be 4–6 digits." };

  const { data: phoneTaken } = await supabase.from("students").select("id").eq("phone", phone).limit(1);
  if (phoneTaken && phoneTaken.length > 0) {
    return { success: false, error: "This phone number is already registered. Please log in instead." };
  }

  const enrollmentCode = `IND-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  const parentId = crypto.randomUUID();

  const { error: parentErr } = await supabase.from("profiles").insert({
    id: parentId,
    full_name: `${fullName}'s Caregiver`,
    role: "parent",
  });
  if (parentErr) return { success: false, error: "Could not create the account. Please try again." };

  const { data: student, error } = await supabase
    .from("students")
    .insert({
      full_name: fullName,
      phone,
      access_pin: await bcrypt.hash(pin, 10),
      student_type: "individual",
      enrollment_code: enrollmentCode,
      parent_id: parentId,
    })
    .select("id, full_name, enrollment_code")
    .single();

  if (error || !student) {
    await supabase.from("profiles").delete().eq("id", parentId); // don't leave an orphan parent
    return { success: false, error: "Could not create the account. Please try again." };
  }

  await startSession("student", {
    id: student.id,
    name: student.full_name,
    type: "individual",
    schoolId: null,
  });

  return { success: true, student, redirectTo: "/student/screening" };
}

/* ============================ 2. Student login ============================ */

type StudentLoginRow = {
  id: string;
  full_name: string;
  student_type: "individual" | "institutional";
  school_id: string | null;
  access_pin: string | null;
};

export async function loginStudent(identifier: string, pin: string, expectedType: "individual" | "institutional") {
  const supabase = await createClient();
  const id = cleanIdentifier(identifier);
  const candidates = await findStudentCandidates<StudentLoginRow>(
    supabase,
    id,
    "id, full_name, student_type, school_id, access_pin"
  );

  let student: StudentLoginRow | null = null;
  for (const c of candidates) {
    if (await verifyAndUpgradePin(supabase, "students", c.id, c.access_pin, (pin || "").trim())) {
      student = c;
      break;
    }
  }

  if (!student) return { success: false, error: "Invalid Student credentials or PIN" };

  if (student.student_type !== expectedType) {
    return {
      success: false,
      error:
        expectedType === "institutional"
          ? "This account is registered as an Individual. Please log in under Individual Student."
          : "This account is enrolled with a School. Please switch to the School / Institute tab.",
    };
  }

  await startSession("student", {
    id: student.id,
    name: student.full_name,
    type: student.student_type,
    schoolId: student.school_id ?? null,
  });

  return { success: true, redirectTo: DASHBOARD_FOR.student };
}

/* ============================ 3. Parent login ============================ */

type ParentLoginRow = {
  id: string;
  full_name: string;
  parent_id: string | null;
  school_id: string | null;
  access_pin: string | null;
  profiles: { id: string; full_name: string } | null;
};

export async function loginParent(identifier: string, pin: string) {
  const supabase = await createClient();
  const id = cleanIdentifier(identifier);
  const candidates = await findStudentCandidates<ParentLoginRow>(
    supabase,
    id,
    "id, full_name, parent_id, school_id, access_pin, profiles:parent_id(id, full_name)"
  );

  let student: ParentLoginRow | null = null;
  for (const c of candidates) {
    if (await verifyAndUpgradePin(supabase, "students", c.id, c.access_pin, (pin || "").trim())) {
      student = c;
      break;
    }
  }

  if (!student) return { success: false, error: "No student matching these credentials was found." };

  // School-enrolled students added by an admin may not have a parent profile
  // yet. Create one now and link it, so messages have a real sender.
  let parentProfile = student.profiles;
  if (!parentProfile) {
    const newId = crypto.randomUUID();
    const fullName = `${student.full_name}'s Parent`;
    const { error: pErr } = await supabase.from("profiles").insert({ id: newId, full_name: fullName, role: "parent" });
    if (pErr) return { success: false, error: "Could not set up the parent account. Please try again." };
    await supabase.from("students").update({ parent_id: newId }).eq("id", student.id);
    parentProfile = { id: newId, full_name: fullName };
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

/* ======================= 4. Teacher / admin login ======================= */

export async function loginStaff(identifier: string, passwordOrPin: string, role: "teacher" | "admin") {
  const supabase = await createClient();
  const email = cleanIdentifier(identifier);
  const failMsg = role === "teacher" ? "Incorrect teacher email or PIN." : "Incorrect admin email or PIN.";
  if (!email) return { success: false, error: failMsg };

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role, school_id, access_pin")
    .ilike("email", escapeLike(email))
    .eq("role", role)
    .limit(5);

  let profile: NonNullable<typeof profiles>[number] | null = null;
  for (const p of profiles ?? []) {
    if (await verifyAndUpgradePin(supabase, "profiles", p.id, p.access_pin, (passwordOrPin || "").trim())) {
      profile = p;
      break;
    }
  }

  if (!profile) return { success: false, error: failMsg };

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

/* ================================ 5. Logout ================================ */

// Clears every session cookie. The client then does a full page replace to "/",
// so Back/Forward can't show a cached portal page.
export async function logout() {
  const cookieStore = await cookies();
  for (const name of Object.values(SESSION_COOKIES)) cookieStore.delete(name);
  return { success: true };
}