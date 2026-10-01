"use server";

/**
 * Parent ↔ teacher messaging.
 *  - Only parents of school-enrolled students can message, and only teachers
 *    of their child's school.
 *  - Each conversation is (student, parent, one teacher).
 *  - The sender is always taken from the login session, never from the browser.
 */
import { createClient } from "@/lib/supabase/server";
import { getCurrentParent, getCurrentTeacher } from "@/lib/auth-session";

export interface ChatMessage {
  id: string;
  content: string;
  created_at: string;
  mine: boolean;
  senderName: string;
}

const MAX_LEN = 2000;

function toChat(rows: { id: string; content: string; created_at: string; sender_id: string }[], me: string, names: Record<string, string>): ChatMessage[] {
  return rows.map((m) => ({
    id: m.id,
    content: m.content,
    created_at: m.created_at,
    mine: m.sender_id === me,
    senderName: names[m.sender_id] ?? "",
  }));
}

async function thread(studentId: string, a: string, b: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("messages")
    .select("id, content, created_at, sender_id, receiver_id")
    .eq("student_id", studentId)
    .or(`and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`)
    .order("created_at", { ascending: true });
  return data || [];
}

async function markRead(studentId: string, receiver: string, sender: string) {
  const supabase = await createClient();
  await supabase
    .from("messages")
    .update({ is_read: true })
    .eq("student_id", studentId)
    .eq("receiver_id", receiver)
    .eq("sender_id", sender)
    .eq("is_read", false);
}

/* ------------------------------ Parent ------------------------------ */

export async function getParentMessaging() {
  const parent = await getCurrentParent();
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, full_name, student_type, school_id, schools(name)")
    .eq("id", parent.studentId)
    .single();

  if (!student || student.student_type !== "institutional" || !student.school_id) {
    return { allowed: false as const, studentName: parent.studentName, teachers: [] };
  }

  const { data: teachers } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("role", "teacher")
    .eq("school_id", student.school_id)
    .order("full_name");

  // unread count per teacher
  const { data: unread } = await supabase
    .from("messages")
    .select("sender_id")
    .eq("student_id", parent.studentId)
    .eq("receiver_id", parent.parentId)
    .eq("is_read", false);
  const unreadBy: Record<string, number> = {};
  for (const u of unread || []) unreadBy[u.sender_id] = (unreadBy[u.sender_id] || 0) + 1;

  return {
    allowed: true as const,
    studentName: student.full_name as string,
    schoolName: (student.schools as unknown as { name: string } | null)?.name ?? "",
    parentName: parent.parentName,
    teachers: (teachers || []).map((t) => ({ id: t.id as string, name: t.full_name as string, unread: unreadBy[t.id] || 0 })),
  };
}

async function parentTeacherCheck(teacherId: string) {
  const parent = await getCurrentParent();
  const supabase = await createClient();
  const { data: student } = await supabase.from("students").select("school_id, student_type").eq("id", parent.studentId).single();
  const { data: teacher } = await supabase.from("profiles").select("id, full_name, school_id, role").eq("id", teacherId).maybeSingle();
  const ok =
    !!student && student.student_type === "institutional" && !!teacher && teacher.role === "teacher" && teacher.school_id === student.school_id;
  return { ok, parent, teacher };
}

export async function getParentThread(teacherId: string): Promise<ChatMessage[]> {
  const { ok, parent, teacher } = await parentTeacherCheck(teacherId);
  if (!ok || !teacher) return [];
  await markRead(parent.studentId, parent.parentId, teacherId);
  const rows = await thread(parent.studentId, parent.parentId, teacherId);
  return toChat(rows, parent.parentId, { [parent.parentId]: parent.parentName, [teacherId]: teacher.full_name });
}

export async function parentSendMessage(teacherId: string, content: string) {
  const text = content.trim().slice(0, MAX_LEN);
  if (!text) return { success: false, error: "Please type a message." };
  const { ok, parent } = await parentTeacherCheck(teacherId);
  if (!ok) return { success: false, error: "You can only message teachers of your child's school." };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    sender_id: parent.parentId,
    receiver_id: teacherId,
    student_id: parent.studentId,
    content: text,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}

/* ------------------------------ Teacher ----------------------------- */

export async function getTeacherInbox() {
  const teacher = await getCurrentTeacher();
  const supabase = await createClient();
  const { data: students } = await supabase
    .from("students")
    .select("id, full_name, parent_id, profiles:parent_id(full_name)")
    .eq("student_type", "institutional")
    .eq("school_id", teacher.schoolId ?? "00000000-0000-0000-0000-000000000000")
    .order("full_name");

  const { data: mine } = await supabase
    .from("messages")
    .select("student_id, sender_id, receiver_id, content, created_at, is_read")
    .or(`sender_id.eq.${teacher.id},receiver_id.eq.${teacher.id}`)
    .order("created_at", { ascending: false });

  return {
    teacherName: teacher.full_name,
    conversations: (students || []).map((s) => {
      const msgs = (mine || []).filter(
        (m) => m.student_id === s.id && (m.sender_id === s.parent_id || m.receiver_id === s.parent_id)
      );
      return {
        studentId: s.id as string,
        studentName: s.full_name as string,
        parentName: (s.profiles as unknown as { full_name: string } | null)?.full_name ?? null,
        hasParent: !!s.parent_id,
        lastMessage: msgs[0]?.content ?? null,
        lastAt: msgs[0]?.created_at ?? null,
        unread: msgs.filter((m) => m.receiver_id === teacher.id && !m.is_read).length,
      };
    }),
  };
}

async function teacherStudentCheck(studentId: string) {
  const teacher = await getCurrentTeacher();
  const supabase = await createClient();
  const { data: student } = await supabase
    .from("students")
    .select("id, parent_id, school_id, student_type, profiles:parent_id(full_name)")
    .eq("id", studentId)
    .maybeSingle();
  const ok = !!student && student.student_type === "institutional" && student.school_id === teacher.schoolId && !!student.parent_id;
  return { ok, teacher, student };
}

export async function getTeacherThread(studentId: string): Promise<ChatMessage[]> {
  const { ok, teacher, student } = await teacherStudentCheck(studentId);
  if (!ok || !student) return [];
  await markRead(studentId, teacher.id, student.parent_id);
  const rows = await thread(studentId, teacher.id, student.parent_id);
  const parentName = (student.profiles as unknown as { full_name: string } | null)?.full_name ?? "Parent";
  return toChat(rows, teacher.id, { [teacher.id]: teacher.full_name, [student.parent_id]: parentName });
}

export async function teacherSendMessage(studentId: string, content: string) {
  const text = content.trim().slice(0, MAX_LEN);
  if (!text) return { success: false, error: "Please type a message." };
  const { ok, teacher, student } = await teacherStudentCheck(studentId);
  if (!ok || !student) return { success: false, error: "This student's parent can't be messaged yet." };
  const supabase = await createClient();
  const { error } = await supabase.from("messages").insert({
    sender_id: teacher.id,
    receiver_id: student.parent_id,
    student_id: studentId,
    content: text,
  });
  if (error) return { success: false, error: error.message };
  return { success: true };
}
