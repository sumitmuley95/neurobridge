/**
 * Signed session cookies.
 * Each cookie value is `base64url(json).signature` (HMAC-SHA256 with
 * SESSION_SECRET), so nobody can create or edit a session in the browser
 * to become another student, a teacher or an admin.
 * Used by server actions, server components and src/proxy.ts (Node runtime).
 */
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIES = {
  student: "student_session",
  parent: "parent_session",
  teacher: "staff_session",
  admin: "admin_session",
} as const;

export type SessionRole = keyof typeof SESSION_COOKIES;

export const SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret(): string {
  const s = process.env.SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET (16+ characters) must be set in production");
  }
  return "dev-only-insecure-session-secret-change-me";
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function encodeSession(data: unknown): string {
  const payload = Buffer.from(JSON.stringify(data)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

export function decodeSession<T>(value: string | undefined | null): T | null {
  if (!value) return null;
  const dot = value.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = value.slice(0, dot);
  const given = Buffer.from(value.slice(dot + 1));
  const expected = Buffer.from(sign(payload));
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

export const cookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  maxAge: SESSION_MAX_AGE,
};

export const DASHBOARD_FOR: Record<SessionRole, string> = {
  student: "/student/dashboard",
  parent: "/parent/dashboard",
  teacher: "/teacher/dashboard",
  admin: "/admin/dashboard",
};
