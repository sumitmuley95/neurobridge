"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentStudent } from "@/lib/auth-session";
import { canSeeDomain } from "@/lib/curriculum";

type ModuleStatus = "completed" | "current" | "locked";

/**
 * Lessons of one subject with completed / current / locked status.
 * The second argument is kept for existing callers but ignored:
 * progress is always read for the logged-in student.
 */
export async function getDomainModules(domainId: string, _studentId?: string) {
  void _studentId;
  const supabase = await createClient();
  const me = await getCurrentStudent();
  const schoolId = me.type === "institutional" ? me.schoolId : null;

  const { data: domain } = await supabase.from("domains").select("*").eq("id", domainId).maybeSingle();

  // Another school's subject (or a missing one) is not visible to this student
  if (!canSeeDomain(domain, schoolId)) {
    return { domain: null, modules: [], allCompleted: false };
  }

  const [{ data: modules }, { data: progress }] = await Promise.all([
    supabase.from("domain_modules").select("*").eq("domain_id", domainId).order("order_index", { ascending: true }),
    supabase
      .from("student_module_progress")
      .select("module_id, is_completed")
      .eq("student_id", me.id)
      .eq("is_completed", true),
  ]);

  const completedSet = new Set((progress || []).map((p) => p.module_id));

  // Completed lessons stay open; the first unfinished one is "current"; the rest are locked.
  let currentAssigned = false;
  const processedModules = (modules || []).map((mod) => {
    let status: ModuleStatus = "locked";
    if (completedSet.has(mod.id)) {
      status = "completed";
    } else if (!currentAssigned) {
      status = "current";
      currentAssigned = true;
    }
    return { ...mod, status };
  });

  return {
    domain,
    modules: processedModules,
    allCompleted: processedModules.length > 0 && processedModules.every((m) => m.status === "completed"),
  };
}

/**
 * Marks a lesson complete for the logged-in student.
 * Checks that the lesson belongs to a subject the student can see and that
 * all earlier lessons in that subject are already done.
 */
export async function completeVideoModule(moduleId: string, _studentId: string, domainId: string) {
  void _studentId;
  const supabase = await createClient();
  const me = await getCurrentStudent();
  const schoolId = me.type === "institutional" ? me.schoolId : null;

  const { data: mod } = await supabase
    .from("domain_modules")
    .select("id, domain_id, order_index")
    .eq("id", moduleId)
    .maybeSingle();
  if (!mod || mod.domain_id !== domainId) return { success: false, error: "Lesson not found." };

  const { data: domain } = await supabase.from("domains").select("id, school_id").eq("id", mod.domain_id).maybeSingle();
  if (!canSeeDomain(domain, schoolId)) return { success: false, error: "Lesson not found." };

  // All earlier lessons must already be completed
  const { data: earlier } = await supabase
    .from("domain_modules")
    .select("id")
    .eq("domain_id", mod.domain_id)
    .lt("order_index", mod.order_index);
  const earlierIds = (earlier || []).map((m) => m.id);
  if (earlierIds.length > 0) {
    const { count } = await supabase
      .from("student_module_progress")
      .select("id", { count: "exact", head: true })
      .eq("student_id", me.id)
      .eq("is_completed", true)
      .in("module_id", earlierIds);
    if ((count ?? 0) < earlierIds.length) {
      return { success: false, error: "Please finish the earlier lessons first." };
    }
  }

  const { error } = await supabase.from("student_module_progress").upsert(
    {
      student_id: me.id,
      module_id: mod.id,
      is_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,module_id" }
  );
  if (error) return { success: false, error: error.message };

  revalidatePath(`/student/learning/${domainId}`);
  revalidatePath("/student/dashboard");
  return { success: true };
}