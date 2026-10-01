"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getCurrentStudent } from "@/lib/auth-session";
import { canSeeDomain } from "@/lib/curriculum";

export async function getDomainModules(domainId: string, studentId: string) {
  const supabase = await createClient();

  const { data: domain } = await supabase
    .from("domains")
    .select("*")
    .eq("id", domainId)
    .single();

  // Another school's subject is not visible to this student
  const me = await getCurrentStudent();
  if (!canSeeDomain(domain, me.type === "institutional" ? me.schoolId : null)) {
    return { domain: null, modules: [], allCompleted: false };
  }

  const { data: modules } = await supabase
    .from("domain_modules")
    .select("*")
    .eq("domain_id", domainId)
    .order("order_index", { ascending: true });

  const { data: progress } = await supabase
    .from("student_module_progress")
    .select("module_id, is_completed")
    .eq("student_id", studentId);

  const completedSet = new Set(
    (progress || []).filter((p) => p.is_completed).map((p) => p.module_id)
  );

  let reachedIncomplete = false;
  const processedModules = (modules || []).map((mod, index) => {
    const isCompleted = completedSet.has(mod.id);
    let status: "completed" | "current" | "locked" = "locked";

    if (isCompleted) {
      status = "completed";
    } else if (!reachedIncomplete) {
      status = "current";
      reachedIncomplete = true;
    }

    if (index === 0 && !isCompleted && !reachedIncomplete) {
      status = "current";
    }

    return {
      ...mod,
      status,
    };
  });

  return {
    domain,
    modules: processedModules,
    allCompleted: processedModules.length > 0 && processedModules.every((m) => m.status === "completed"),
  };
}

export async function completeVideoModule(moduleId: string, _studentId: string, domainId: string) {
  const supabase = await createClient();
  // Always the logged-in student (never an ID sent from the browser)
  const studentId = (await getCurrentStudent()).id;

  await supabase.from("student_module_progress").upsert(
    {
      student_id: studentId,
      module_id: moduleId,
      is_completed: true,
      completed_at: new Date().toISOString(),
    },
    { onConflict: "student_id,module_id" }
  );

  revalidatePath(`/student/learning/${domainId}`);
  revalidatePath("/student/dashboard");
  return { success: true };
}
