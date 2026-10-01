import { LoginForm } from "@/components/auth/LoginForm";

type Role = "student" | "parent" | "teacher" | "admin";
const ROLES: Role[] = ["student", "parent", "teacher", "admin"];

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; mode?: string }>;
}) {
  const { role, mode } = await searchParams;
  const initialRole = ROLES.includes(role as Role) ? (role as Role) : "student";
  return <LoginForm initialRole={initialRole} initialMode={mode === "signup" ? "signup" : "login"} />;
}
