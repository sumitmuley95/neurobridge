import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { decodeSession, SESSION_COOKIES, type SessionRole } from "@/lib/session";

export interface StudentSession {
  id: string;
  name: string;
  type: "individual" | "institutional";
  schoolId?: string | null;
}

export interface ParentSession {
  studentId: string;
  studentName: string;
  parentId: string;
  parentName: string;
  schoolId?: string | null;
}

export interface TeacherSession {
  id: string;
  full_name: string;
  email: string | null;
  role: "teacher";
  schoolId: string | null;
}

export interface AdminSession {
  id: string;
  name: string;
  email: string | null;
  role: "admin";
  schoolId: string | null;
}

async function read<T>(role: SessionRole): Promise<T | null> {
  const cookieStore = await cookies();
  return decodeSession<T>(cookieStore.get(SESSION_COOKIES[role])?.value);
}

// Every portal page is already protected by src/proxy.ts; these redirects are
// a second line of defence (e.g. for server actions called directly).
export async function getCurrentStudent(): Promise<StudentSession> {
  const s = await read<StudentSession>("student");
  if (!s) redirect("/login?role=student");
  return s;
}

export async function getCurrentParent(): Promise<ParentSession> {
  const s = await read<ParentSession>("parent");
  if (!s) redirect("/login?role=parent");
  return s;
}

export async function getCurrentTeacher(): Promise<TeacherSession> {
  const s = await read<TeacherSession>("teacher");
  if (!s) redirect("/login?role=teacher");
  return s;
}

export async function getCurrentAdmin(): Promise<AdminSession> {
  const s = await read<AdminSession>("admin");
  if (!s) redirect("/login?role=admin");
  return s;
}

/** Which role (if any) is logged in right now — used by the landing page. */
export async function getActiveRole(): Promise<SessionRole | null> {
  for (const role of Object.keys(SESSION_COOKIES) as SessionRole[]) {
    if (await read(role)) return role;
  }
  return null;
}
