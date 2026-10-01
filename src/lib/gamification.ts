/**
 * Streaks, XP and badges — worked out from data the app already records
 * (lessons completed, practice attempts, screenings, mastery). No extra tables.
 * Days are counted in Indian Standard Time.
 */
import { createClient } from "@/lib/supabase/server";

export const CORE_DOMAIN_COUNT = 8;

export type BadgeId =
  | "first_lesson"
  | "five_lessons"
  | "unit_mastered"
  | "all_core_mastered"
  | "streak_3"
  | "streak_7"
  | "screening_done"
  | "xp_100"
  | "xp_500";

export interface BadgeDef {
  id: BadgeId;
  name: string;
  description: string;
  icon: "play" | "books" | "trophy" | "crown" | "flame" | "rocket" | "clipboard" | "star" | "gem";
  tone: "student" | "parent" | "teacher" | "warning" | "success";
}

export const BADGES: BadgeDef[] = [
  { id: "screening_done", name: "Screening Done", description: "Finished the screening check", icon: "clipboard", tone: "student" },
  { id: "first_lesson", name: "First Lesson", description: "Completed your first video lesson", icon: "play", tone: "parent" },
  { id: "five_lessons", name: "5 Lessons", description: "Completed 5 video lessons", icon: "books", tone: "parent" },
  { id: "streak_3", name: "3-Day Streak", description: "Learned 3 days in a row", icon: "flame", tone: "warning" },
  { id: "streak_7", name: "7-Day Streak", description: "Learned 7 days in a row", icon: "rocket", tone: "warning" },
  { id: "xp_100", name: "100 XP", description: "Earned 100 XP from lessons", icon: "star", tone: "teacher" },
  { id: "xp_500", name: "500 XP", description: "Earned 500 XP from lessons", icon: "gem", tone: "teacher" },
  { id: "unit_mastered", name: "Unit Mastered", description: "Passed a unit mastery check", icon: "trophy", tone: "success" },
  { id: "all_core_mastered", name: "All 8 Mastered", description: "Mastered all 8 core subjects", icon: "crown", tone: "success" },
];

export interface StudentStats {
  xp: number;
  lessonsCompleted: number;
  currentStreak: number;
  longestStreak: number;
  learnedToday: boolean;
  unitsMastered: number;
  coreUnitsMastered: number;
  screeningDone: boolean;
  badges: { def: BadgeDef; unlocked: boolean }[];
  unlockedCount: number;
}

// "YYYY-MM-DD" in India time
function istDay(ts: string | null | undefined): string | null {
  if (!ts) return null;
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getTime() + 330 * 60 * 1000).toISOString().slice(0, 10);
}

function dayShift(day: string, delta: number): string {
  const d = new Date(day + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + delta);
  return d.toISOString().slice(0, 10);
}

/** Current streak: consecutive active days ending today (or yesterday, so a
 *  streak isn't shown as broken before the child has had a chance today). */
export function computeStreaks(days: Set<string>, now = new Date()) {
  const today = istDay(now.toISOString())!;
  let start = days.has(today) ? today : dayShift(today, -1);
  let current = 0;
  while (days.has(start)) {
    current++;
    start = dayShift(start, -1);
  }
  let longest = 0;
  for (const d of days) {
    if (days.has(dayShift(d, -1))) continue; // not the start of a run
    let len = 0;
    let x = d;
    while (days.has(x)) {
      len++;
      x = dayShift(x, 1);
    }
    longest = Math.max(longest, len);
  }
  return { current, longest, learnedToday: days.has(today) };
}

type ModuleRow = { student_id: string; completed_at: string | null; domain_modules: { xp_reward: number | null } | null };
type TsRow = { student_id: string; completed_at: string | null };
type SkillRow = { student_id: string; mastery_percentage: number | string | null; skills: { domain_id: string | null } | null };

/** Stats for several students at once (one query per table). */
export async function getStatsForStudents(studentIds: string[]): Promise<Record<string, StudentStats>> {
  const out: Record<string, StudentStats> = {};
  if (studentIds.length === 0) return out;
  const supabase = await createClient();

  const [mods, attempts, screenings, skills, coreDomains] = await Promise.all([
    supabase
      .from("student_module_progress")
      .select("student_id, completed_at, domain_modules(xp_reward)")
      .in("student_id", studentIds)
      .eq("is_completed", true),
    supabase.from("activity_attempts").select("student_id, completed_at").in("student_id", studentIds),
    supabase.from("screenings").select("student_id, completed_at").in("student_id", studentIds),
    supabase
      .from("skill_progress")
      .select("student_id, mastery_percentage, skills(domain_id)")
      .in("student_id", studentIds),
    supabase.from("domains").select("id").is("school_id", null),
  ]);

  const coreIds = new Set((coreDomains.data || []).map((d) => d.id as string));

  for (const id of studentIds) {
    const myMods = ((mods.data || []) as unknown as ModuleRow[]).filter((m) => m.student_id === id);
    const myAttempts = ((attempts.data || []) as TsRow[]).filter((a) => a.student_id === id);
    const myScreens = ((screenings.data || []) as TsRow[]).filter((s) => s.student_id === id);
    const mySkills = ((skills.data || []) as unknown as SkillRow[]).filter((s) => s.student_id === id);

    const xp = myMods.reduce((sum, m) => sum + (Number(m.domain_modules?.xp_reward) || 0), 0);
    const days = new Set<string>();
    for (const r of [...myMods, ...myAttempts, ...myScreens]) {
      const d = istDay(r.completed_at);
      if (d) days.add(d);
    }
    const streak = computeStreaks(days);

    const masteredDomains = new Set(
      mySkills
        .filter((s) => Number(s.mastery_percentage) >= 100 && s.skills?.domain_id)
        .map((s) => s.skills!.domain_id as string)
    );
    const coreMastered = [...masteredDomains].filter((d) => coreIds.has(d)).length;

    const unlocked: Record<BadgeId, boolean> = {
      screening_done: myScreens.length > 0,
      first_lesson: myMods.length >= 1,
      five_lessons: myMods.length >= 5,
      streak_3: streak.longest >= 3,
      streak_7: streak.longest >= 7,
      xp_100: xp >= 100,
      xp_500: xp >= 500,
      unit_mastered: masteredDomains.size >= 1,
      all_core_mastered: coreIds.size > 0 && coreMastered >= Math.min(CORE_DOMAIN_COUNT, coreIds.size),
    };
    const badges = BADGES.map((def) => ({ def, unlocked: unlocked[def.id] }));

    out[id] = {
      xp,
      lessonsCompleted: myMods.length,
      currentStreak: streak.current,
      longestStreak: streak.longest,
      learnedToday: streak.learnedToday,
      unitsMastered: masteredDomains.size,
      coreUnitsMastered: coreMastered,
      screeningDone: myScreens.length > 0,
      badges,
      unlockedCount: badges.filter((b) => b.unlocked).length,
    };
  }
  return out;
}

export async function getStudentStats(studentId: string): Promise<StudentStats> {
  return (await getStatsForStudents([studentId]))[studentId];
}
