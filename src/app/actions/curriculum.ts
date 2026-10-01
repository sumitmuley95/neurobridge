"use server";

/**
 * School admin curriculum management.
 * Rules:
 *  - Default subjects (school_id NULL) are shared: their lessons can't be
 *    edited here, but a school can add practice activities to them and use
 *    its own mastery quiz / screening questions instead of the defaults.
 *  - A school's own subjects are fully editable by that school's admin only.
 *  - Anything students have already used (lesson progress, activity attempts,
 *    screening results) is never deleted — the admin is told why instead.
 */
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getCurrentAdmin } from "@/lib/auth-session";
import { canSeeDomain } from "@/lib/curriculum";

type Result<T = object> = ({ success: true } & T) | { success: false; error: string };

export interface OptionInput {
  text: string;
  emoji?: string;
}
export interface QuestionInput {
  prompt: string;
  visual?: string;
  subText?: string;
  imageSrc?: string;
  title?: string;
  helperText?: string;
  hint?: string;
  options: OptionInput[];
  correctIndex: number;
}

const OPTION_IDS = ["a", "b", "c", "d"];

async function ctx() {
  const admin = await getCurrentAdmin();
  if (!admin.schoolId) throw new Error("This admin account is not linked to a school.");
  return { supabase: await createClient(), schoolId: admin.schoolId };
}

function rand() {
  return Math.random().toString(36).slice(2, 8);
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_|_$/g, "")
      .slice(0, 30) || "subject"
  );
}

function cleanOptions(q: QuestionInput): { error?: string; options: { id: string; text: string; emoji: string }[] } {
  const opts = q.options
    .map((o) => ({ text: (o.text || "").trim(), emoji: (o.emoji || "").trim() }))
    .filter((o) => o.text);
  if (!q.prompt?.trim()) return { error: "Please write the question.", options: [] };
  if (opts.length < 2 || opts.length > 4) return { error: "Add between 2 and 4 answer choices.", options: [] };
  if (q.correctIndex < 0 || q.correctIndex >= opts.length) return { error: "Choose which answer is correct.", options: [] };
  return { options: opts.map((o, i) => ({ id: OPTION_IDS[i], text: o.text, emoji: o.emoji || "•" })) };
}

async function loadDomain(domainId: string) {
  const { supabase, schoolId } = await ctx();
  const { data: domain } = await supabase.from("domains").select("*").eq("id", domainId).maybeSingle();
  if (!domain || !canSeeDomain(domain, schoolId)) throw new Error("Subject not found.");
  return { supabase, schoolId, domain, isOwn: domain.school_id === schoolId };
}

function refresh(domainId?: string) {
  revalidatePath("/admin/curriculum");
  if (domainId) revalidatePath(`/admin/curriculum/${domainId}`);
  revalidatePath("/admin/screening");
  revalidatePath("/admin/dashboard");
}

async function guard<T>(fn: () => Promise<Result<T>>): Promise<Result<T>> {
  try {
    return await fn();
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Something went wrong." };
  }
}

/* ============================ Overview ============================ */

export async function getCurriculumOverview() {
  const { supabase, schoolId } = await ctx();
  const { data: domains } = await supabase
    .from("domains")
    .select("*, domain_modules(id, xp_reward)")
    .or(`school_id.is.null,school_id.eq.${schoolId}`)
    .order("order_index", { ascending: true });

  const ids = (domains || []).map((d) => d.id);
  const [acts, mq, sq] = await Promise.all([
    supabase.from("activities").select("domain_id, school_id").in("domain_id", ids).or(`school_id.is.null,school_id.eq.${schoolId}`),
    supabase.from("mastery_questions").select("domain_id, school_id").in("domain_id", ids).or(`school_id.is.null,school_id.eq.${schoolId}`),
    supabase.from("screening_questions").select("domain_id, school_id").or(`school_id.is.null,school_id.eq.${schoolId}`),
  ]);
  const schoolScreening = (sq.data || []).some((q) => q.school_id === schoolId);

  return (domains || []).map((d) => {
    const own = (mq.data || []).filter((q) => q.domain_id === d.id && q.school_id === schoolId).length;
    const def = (mq.data || []).filter((q) => q.domain_id === d.id && q.school_id === null).length;
    const screening = (sq.data || []).filter(
      (q) => q.domain_id === d.id && (schoolScreening ? q.school_id === schoolId : q.school_id === null)
    ).length;
    const modules = (d.domain_modules || []) as { id: string; xp_reward: number | null }[];
    return {
      id: d.id as string,
      name: d.name as string,
      icon_emoji: d.icon_emoji as string | null,
      description: d.description as string | null,
      isOwn: d.school_id === schoolId,
      lessons: modules.length,
      totalXp: modules.reduce((n, m) => n + (Number(m.xp_reward) || 0), 0),
      activities: (acts.data || []).filter((a) => a.domain_id === d.id).length,
      quizQuestions: own > 0 ? own : def,
      quizIsCustom: own > 0,
      screeningQuestions: screening,
    };
  });
}

export async function getSubjectDetail(domainId: string) {
  const { supabase, schoolId, domain, isOwn } = await loadDomain(domainId);
  const [modules, activities, mastery, screeningAll] = await Promise.all([
    supabase.from("domain_modules").select("*").eq("domain_id", domainId).order("order_index", { ascending: true }),
    supabase
      .from("activities")
      .select("*")
      .eq("domain_id", domainId)
      .or(`school_id.is.null,school_id.eq.${schoolId}`)
      .order("created_at", { ascending: true }),
    supabase
      .from("mastery_questions")
      .select("*")
      .eq("domain_id", domainId)
      .or(`school_id.is.null,school_id.eq.${schoolId}`)
      .order("order_index", { ascending: true }),
    supabase.from("screening_questions").select("*").or(`school_id.is.null,school_id.eq.${schoolId}`).order("order_index"),
  ]);
  const ownQuiz = (mastery.data || []).filter((q) => q.school_id === schoolId);
  const defQuiz = (mastery.data || []).filter((q) => q.school_id === null);
  const schoolScreening = (screeningAll.data || []).some((q) => q.school_id === schoolId);
  const screening = (screeningAll.data || []).filter(
    (q) => q.domain_id === domainId && (schoolScreening ? q.school_id === schoolId : q.school_id === null)
  );

  return {
    domain,
    isOwn,
    schoolId,
    modules: modules.data || [],
    activities: activities.data || [],
    quiz: ownQuiz.length > 0 ? ownQuiz : defQuiz,
    quizIsCustom: ownQuiz.length > 0,
    screening,
    screeningIsCustom: schoolScreening,
  };
}

/* ============================ Subjects ============================ */

export async function createSubject(input: { name: string; emoji: string; description: string }): Promise<Result<{ id: string }>> {
  return guard<{ id: string }>(async () => {
    const { supabase, schoolId } = await ctx();
    const name = input.name.trim();
    if (!name) return { success: false, error: "Please give the subject a name." };

    // Readable id (shows in the web address); add a suffix only if taken
    let id = slug(name);
    const { data: taken } = await supabase.from("domains").select("id").eq("id", id).maybeSingle();
    if (taken) id = `${id}_${rand()}`;
    const { data: last } = await supabase
      .from("domains")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { error } = await supabase.from("domains").insert({
      id,
      name,
      description: input.description.trim() || null,
      icon_emoji: input.emoji.trim() || "📚",
      order_index: (last?.order_index ?? 0) + 1,
      school_id: schoolId,
    });
    if (error) return { success: false, error: error.message };

    // Each subject needs a skill: mastery results and activities hang off it
    await supabase.from("skills").insert({
      id: `${id}_core`,
      domain_id: id,
      name: `${name} core skills`,
      order_index: 1,
    });

    refresh(id);
    return { success: true, id };
  });
}

export async function updateSubject(domainId: string, input: { name: string; emoji: string; description: string }): Promise<Result> {
  return guard(async () => {
    const { supabase, isOwn } = await loadDomain(domainId);
    if (!isOwn) return { success: false, error: "Default subjects can't be renamed." };
    if (!input.name.trim()) return { success: false, error: "Please give the subject a name." };
    const { error } = await supabase
      .from("domains")
      .update({ name: input.name.trim(), icon_emoji: input.emoji.trim() || "📚", description: input.description.trim() || null })
      .eq("id", domainId);
    if (error) return { success: false, error: error.message };
    refresh(domainId);
    return { success: true };
  });
}

export async function deleteSubject(domainId: string): Promise<Result> {
  return guard(async () => {
    const { supabase, isOwn } = await loadDomain(domainId);
    if (!isOwn) return { success: false, error: "Default subjects can't be deleted." };

    const { data: mods } = await supabase.from("domain_modules").select("id").eq("domain_id", domainId);
    const { data: acts } = await supabase.from("activities").select("id").eq("domain_id", domainId);
    const { data: skills } = await supabase.from("skills").select("id").eq("domain_id", domainId);
    const modIds = (mods || []).map((m) => m.id);
    const actIds = (acts || []).map((a) => a.id);
    const skillIds = (skills || []).map((s) => s.id);

    const used = await Promise.all([
      modIds.length ? supabase.from("student_module_progress").select("id", { count: "exact", head: true }).in("module_id", modIds) : { count: 0 },
      actIds.length ? supabase.from("activity_attempts").select("id", { count: "exact", head: true }).in("activity_id", actIds) : { count: 0 },
      skillIds.length ? supabase.from("skill_progress").select("id", { count: "exact", head: true }).in("skill_id", skillIds) : { count: 0 },
      supabase.from("screening_domain_results").select("id", { count: "exact", head: true }).eq("domain_id", domainId),
      supabase.from("teacher_observations").select("id", { count: "exact", head: true }).eq("domain_id", domainId),
    ]);
    if (used.some((r) => (r.count ?? 0) > 0)) {
      return { success: false, error: "Students have already used this subject, so it can't be deleted (their progress would be lost)." };
    }

    await supabase.from("domain_modules").delete().eq("domain_id", domainId);
    await supabase.from("activities").delete().eq("domain_id", domainId);
    await supabase.from("skills").delete().eq("domain_id", domainId);
    const { error } = await supabase.from("domains").delete().eq("id", domainId); // quiz & screening rows cascade
    if (error) return { success: false, error: error.message };
    refresh();
    return { success: true };
  });
}

/* ============================ Lessons ============================ */

export interface LessonInput {
  title: string;
  description: string;
  videoUrl: string;
  xp: number;
}

function checkLesson(l: LessonInput): string | null {
  if (!l.title.trim()) return "Please give the lesson a title.";
  if (!/^https?:\/\//i.test(l.videoUrl.trim())) return "Please paste a video link starting with http:// or https://";
  if (!Number.isFinite(l.xp) || l.xp < 0 || l.xp > 1000) return "XP must be a number from 0 to 1000.";
  return null;
}

async function renumberLessons(supabase: Awaited<ReturnType<typeof createClient>>, domainId: string) {
  const { data } = await supabase.from("domain_modules").select("id").eq("domain_id", domainId).order("order_index");
  for (const [i, m] of (data || []).entries()) {
    await supabase.from("domain_modules").update({ order_index: i + 1 }).eq("id", m.id);
  }
}

export async function addLesson(domainId: string, input: LessonInput): Promise<Result> {
  return guard(async () => {
    const { supabase, isOwn } = await loadDomain(domainId);
    if (!isOwn) return { success: false, error: "Lessons of default subjects are managed by NeuroBridge." };
    const problem = checkLesson(input);
    if (problem) return { success: false, error: problem };
    const { data: last } = await supabase
      .from("domain_modules")
      .select("order_index")
      .eq("domain_id", domainId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("domain_modules").insert({
      id: `${domainId}_m_${rand()}`,
      domain_id: domainId,
      title: input.title.trim(),
      description: input.description.trim() || null,
      video_url: input.videoUrl.trim(),
      order_index: (last?.order_index ?? 0) + 1,
      xp_reward: Math.round(input.xp),
    });
    if (error) return { success: false, error: error.message };
    refresh(domainId);
    return { success: true };
  });
}

export async function updateLesson(moduleId: string, input: LessonInput): Promise<Result> {
  return guard(async () => {
    const { supabase } = await ctx();
    const { data: mod } = await supabase.from("domain_modules").select("domain_id").eq("id", moduleId).maybeSingle();
    if (!mod) return { success: false, error: "Lesson not found." };
    const { isOwn } = await loadDomain(mod.domain_id);
    if (!isOwn) return { success: false, error: "Lessons of default subjects are managed by NeuroBridge." };
    const problem = checkLesson(input);
    if (problem) return { success: false, error: problem };
    const { error } = await supabase
      .from("domain_modules")
      .update({
        title: input.title.trim(),
        description: input.description.trim() || null,
        video_url: input.videoUrl.trim(),
        xp_reward: Math.round(input.xp),
      })
      .eq("id", moduleId);
    if (error) return { success: false, error: error.message };
    refresh(mod.domain_id);
    return { success: true };
  });
}

export async function deleteLesson(moduleId: string): Promise<Result> {
  return guard(async () => {
    const { supabase } = await ctx();
    const { data: mod } = await supabase.from("domain_modules").select("domain_id").eq("id", moduleId).maybeSingle();
    if (!mod) return { success: false, error: "Lesson not found." };
    const { isOwn } = await loadDomain(mod.domain_id);
    if (!isOwn) return { success: false, error: "Lessons of default subjects are managed by NeuroBridge." };
    const { count } = await supabase
      .from("student_module_progress")
      .select("id", { count: "exact", head: true })
      .eq("module_id", moduleId);
    if ((count ?? 0) > 0) return { success: false, error: "Students have already completed this lesson, so it can't be deleted. You can edit it instead." };
    const { error } = await supabase.from("domain_modules").delete().eq("id", moduleId);
    if (error) return { success: false, error: error.message };
    await renumberLessons(supabase, mod.domain_id);
    refresh(mod.domain_id);
    return { success: true };
  });
}

/* ======================= Practice activities ======================= */

export async function addActivity(domainId: string, q: QuestionInput): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await loadDomain(domainId);
    const { error: optErr, options } = cleanOptions(q);
    if (optErr) return { success: false, error: optErr };
    if (!q.title?.trim()) return { success: false, error: "Please give the activity a title." };
    const { data: skill } = await supabase
      .from("skills")
      .select("id")
      .eq("domain_id", domainId)
      .order("order_index")
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("activities").insert({
      id: `act_${slug(domainId).slice(0, 20)}_${rand()}`,
      skill_id: skill?.id ?? null,
      domain_id: domainId,
      school_id: schoolId,
      title: q.title.trim(),
      description: q.subText?.trim() || null,
      prompt: q.prompt.trim(),
      helper_audio_text: q.helperText?.trim() || null,
      visual_cue: q.visual?.trim() || null,
      options,
      correct_answer: options[q.correctIndex].id,
      hint: q.hint?.trim() || null,
    });
    if (error) return { success: false, error: error.message };
    refresh(domainId);
    return { success: true };
  });
}

export async function deleteActivity(activityId: string): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await ctx();
    const { data: act } = await supabase.from("activities").select("domain_id, school_id").eq("id", activityId).maybeSingle();
    if (!act || act.school_id !== schoolId) return { success: false, error: "You can only delete your school's own activities." };
    const { count } = await supabase
      .from("activity_attempts")
      .select("id", { count: "exact", head: true })
      .eq("activity_id", activityId);
    if ((count ?? 0) > 0) return { success: false, error: "Students have already attempted this activity, so it can't be deleted." };
    const { error } = await supabase.from("activities").delete().eq("id", activityId);
    if (error) return { success: false, error: error.message };
    refresh(act.domain_id);
    return { success: true };
  });
}

/* ========================== Mastery quiz ========================== */

/** Make a school-owned copy of the default quiz for this subject (if none yet). */
async function ensureOwnQuiz(domainId: string) {
  const { supabase, schoolId } = await ctx();
  const { count } = await supabase
    .from("mastery_questions")
    .select("id", { count: "exact", head: true })
    .eq("domain_id", domainId)
    .eq("school_id", schoolId);
  if ((count ?? 0) > 0) return;
  const { data: defaults } = await supabase.from("mastery_questions").select("*").eq("domain_id", domainId).is("school_id", null);
  if (defaults && defaults.length > 0) {
    await supabase.from("mastery_questions").insert(
      defaults.map((d) => ({
        school_id: schoolId,
        domain_id: domainId,
        prompt: d.prompt,
        image_src: d.image_src,
        visual_emoji: d.visual_emoji,
        sub_text: d.sub_text,
        options: d.options,
        correct_answer: d.correct_answer,
        order_index: d.order_index,
      }))
    );
  }
}

export async function customizeQuiz(domainId: string): Promise<Result> {
  return guard(async () => {
    await loadDomain(domainId);
    await ensureOwnQuiz(domainId);
    refresh(domainId);
    return { success: true };
  });
}

export async function resetQuizToDefault(domainId: string): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId, isOwn } = await loadDomain(domainId);
    if (isOwn) return { success: false, error: "Your own subjects have no default quiz." };
    await supabase.from("mastery_questions").delete().eq("domain_id", domainId).eq("school_id", schoolId);
    refresh(domainId);
    return { success: true };
  });
}

function masteryRow(q: QuestionInput, options: { id: string; text: string; emoji: string }[]) {
  return {
    prompt: q.prompt.trim(),
    visual_emoji: q.visual?.trim() || null,
    sub_text: q.subText?.trim() || null,
    image_src: q.imageSrc?.trim() || null,
    options,
    correct_answer: options[q.correctIndex].id,
  };
}

export async function addQuizQuestion(domainId: string, q: QuestionInput): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await loadDomain(domainId);
    const { error: optErr, options } = cleanOptions(q);
    if (optErr) return { success: false, error: optErr };
    await ensureOwnQuiz(domainId);
    const { data: last } = await supabase
      .from("mastery_questions")
      .select("order_index")
      .eq("domain_id", domainId)
      .eq("school_id", schoolId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("mastery_questions").insert({
      ...masteryRow(q, options),
      school_id: schoolId,
      domain_id: domainId,
      order_index: (last?.order_index ?? 0) + 1,
    });
    if (error) return { success: false, error: error.message };
    refresh(domainId);
    return { success: true };
  });
}

export async function updateQuizQuestion(questionId: string, q: QuestionInput): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await ctx();
    const { error: optErr, options } = cleanOptions(q);
    if (optErr) return { success: false, error: optErr };
    const { data: row } = await supabase.from("mastery_questions").select("domain_id, school_id").eq("id", questionId).maybeSingle();
    if (!row || row.school_id !== schoolId) return { success: false, error: "Customise this quiz first to edit its questions." };
    const { error } = await supabase.from("mastery_questions").update(masteryRow(q, options)).eq("id", questionId);
    if (error) return { success: false, error: error.message };
    refresh(row.domain_id);
    return { success: true };
  });
}

export async function deleteQuizQuestion(questionId: string): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await ctx();
    const { data: row } = await supabase.from("mastery_questions").select("domain_id, school_id").eq("id", questionId).maybeSingle();
    if (!row || row.school_id !== schoolId) return { success: false, error: "Customise this quiz first to edit its questions." };
    const { count } = await supabase
      .from("mastery_questions")
      .select("id", { count: "exact", head: true })
      .eq("domain_id", row.domain_id)
      .eq("school_id", schoolId);
    if ((count ?? 0) <= 1) return { success: false, error: "A quiz needs at least one question." };
    const { error } = await supabase.from("mastery_questions").delete().eq("id", questionId);
    if (error) return { success: false, error: error.message };
    refresh(row.domain_id);
    return { success: true };
  });
}

/* =========================== Screening =========================== */

export async function getScreeningAdmin() {
  const { supabase, schoolId } = await ctx();
  const { data: own } = await supabase
    .from("screening_questions")
    .select("*, domains(name, icon_emoji)")
    .eq("school_id", schoolId)
    .order("order_index");
  const isCustom = (own?.length ?? 0) > 0;
  const questions = isCustom
    ? own!
    : (await supabase.from("screening_questions").select("*, domains(name, icon_emoji)").is("school_id", null).order("order_index")).data || [];
  const { data: domains } = await supabase
    .from("domains")
    .select("id, name, icon_emoji")
    .or(`school_id.is.null,school_id.eq.${schoolId}`)
    .order("order_index");
  return { isCustom, questions, domains: domains || [] };
}

/** Make a school-owned copy of the default 8 screening questions (if none yet). */
async function ensureOwnScreening() {
  const { supabase, schoolId } = await ctx();
  const { count } = await supabase
    .from("screening_questions")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  if ((count ?? 0) > 0) return;
  const { data: defaults } = await supabase.from("screening_questions").select("*").is("school_id", null);
  if (defaults && defaults.length > 0) {
    await supabase.from("screening_questions").insert(
      defaults.map((d) => ({
        school_id: schoolId,
        domain_id: d.domain_id,
        prompt: d.prompt,
        visual_cue: d.visual_cue,
        options: d.options,
        order_index: d.order_index,
      }))
    );
  }
}

export async function customizeScreening(): Promise<Result> {
  return guard(async () => {
    await ensureOwnScreening();
    refresh();
    return { success: true };
  });
}

export async function resetScreeningToDefault(): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await ctx();
    await supabase.from("screening_questions").delete().eq("school_id", schoolId);
    refresh();
    return { success: true };
  });
}

function screeningOptions(q: QuestionInput, options: { id: string; text: string; emoji: string }[]) {
  return options.map((o, i) => ({ ...o, isCorrect: i === q.correctIndex }));
}

export async function addScreeningQuestion(domainId: string, q: QuestionInput): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await loadDomain(domainId);
    const { error: optErr, options } = cleanOptions(q);
    if (optErr) return { success: false, error: optErr };
    await ensureOwnScreening();
    const { data: last } = await supabase
      .from("screening_questions")
      .select("order_index")
      .eq("school_id", schoolId)
      .order("order_index", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { error } = await supabase.from("screening_questions").insert({
      school_id: schoolId,
      domain_id: domainId,
      prompt: q.prompt.trim(),
      visual_cue: q.visual?.trim() || null,
      options: screeningOptions(q, options),
      order_index: (last?.order_index ?? 0) + 1,
    });
    if (error) return { success: false, error: error.message };
    refresh(domainId);
    return { success: true };
  });
}

export async function updateScreeningQuestion(questionId: string, domainId: string, q: QuestionInput): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await ctx();
    await loadDomain(domainId);
    const { error: optErr, options } = cleanOptions(q);
    if (optErr) return { success: false, error: optErr };
    const { data: row } = await supabase.from("screening_questions").select("school_id").eq("id", questionId).maybeSingle();
    if (!row || row.school_id !== schoolId) return { success: false, error: "Customise the screening first to edit it." };
    const { error } = await supabase
      .from("screening_questions")
      .update({ domain_id: domainId, prompt: q.prompt.trim(), visual_cue: q.visual?.trim() || null, options: screeningOptions(q, options) })
      .eq("id", questionId);
    if (error) return { success: false, error: error.message };
    refresh(domainId);
    return { success: true };
  });
}

export async function deleteScreeningQuestion(questionId: string): Promise<Result> {
  return guard(async () => {
    const { supabase, schoolId } = await ctx();
    const { data: row } = await supabase.from("screening_questions").select("school_id, domain_id").eq("id", questionId).maybeSingle();
    if (!row || row.school_id !== schoolId) return { success: false, error: "Customise the screening first to edit it." };
    const { count } = await supabase
      .from("screening_questions")
      .select("id", { count: "exact", head: true })
      .eq("school_id", schoolId);
    if ((count ?? 0) <= 1) return { success: false, error: "The screening needs at least one question." };
    const { error } = await supabase.from("screening_questions").delete().eq("id", questionId);
    if (error) return { success: false, error: error.message };
    refresh(row.domain_id);
    return { success: true };
  });
}
