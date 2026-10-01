/**
 * Which curriculum a learner sees.
 *  - Default content has school_id = NULL and is shared by everyone.
 *  - A school can add its own subjects/activities (school_id = that school).
 *  - A school can replace the default screening set or a subject's mastery
 *    quiz with its own questions; if it hasn't, the defaults are used.
 *  - Individual learners (no school) always get the defaults only.
 */
import { createClient } from "@/lib/supabase/server";

export interface DomainRow {
  id: string;
  name: string;
  description: string | null;
  icon_emoji: string | null;
  order_index: number;
  school_id: string | null;
}

export interface ScreeningQuestion {
  id: string;
  school_id: string | null;
  domain_id: string;
  prompt: string;
  visual_cue: string | null;
  options: { id: string; text: string; emoji: string; isCorrect: boolean }[];
  order_index: number;
  domains?: { name: string } | null;
}

export interface MasteryQuestionRow {
  id: string;
  school_id: string | null;
  domain_id: string;
  prompt: string;
  image_src: string | null;
  visual_emoji: string | null;
  sub_text: string | null;
  options: { id: string; text: string; emoji: string }[];
  correct_answer: string;
  order_index: number;
}

/** Subjects a learner of this school (or an individual learner) can see. */
export async function getVisibleDomains(
  schoolId: string | null | undefined,
  opts: { onlyWithLessons?: boolean } = {}
): Promise<DomainRow[]> {
  const supabase = await createClient();
  let q = supabase.from("domains").select("*, domain_modules(id)").order("order_index", { ascending: true });
  q = schoolId ? q.or(`school_id.is.null,school_id.eq.${schoolId}`) : q.is("school_id", null);
  const { data } = await q;
  const rows = (data || []) as (DomainRow & { domain_modules?: { id: string }[] })[];
  return rows
    .filter((d) => !opts.onlyWithLessons || d.school_id === null || (d.domain_modules?.length ?? 0) > 0)
    .map(({ domain_modules: _m, ...d }) => {
      void _m;
      return d;
    });
}

export function canSeeDomain(domain: { school_id: string | null } | null | undefined, schoolId: string | null | undefined) {
  if (!domain) return false;
  return domain.school_id === null || (!!schoolId && domain.school_id === schoolId);
}

/** Does this school have its own screening set? */
export async function schoolHasOwnScreening(schoolId: string): Promise<boolean> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("screening_questions")
    .select("id", { count: "exact", head: true })
    .eq("school_id", schoolId);
  return (count ?? 0) > 0;
}

/** Screening questions for a learner: the school's own set if it has one, else the default 8. */
export async function getScreeningQuestions(schoolId: string | null | undefined): Promise<ScreeningQuestion[]> {
  const supabase = await createClient();
  const useSchool = schoolId ? await schoolHasOwnScreening(schoolId) : false;
  let q = supabase
    .from("screening_questions")
    .select("*, domains(name)")
    .order("order_index", { ascending: true });
  q = useSchool ? q.eq("school_id", schoolId!) : q.is("school_id", null);
  const { data } = await q;
  return (data || []) as ScreeningQuestion[];
}

/** Mastery quiz for a subject: the school's own questions if any, else the defaults. */
export async function getMasteryQuestions(
  domainId: string,
  schoolId: string | null | undefined
): Promise<{ questions: MasteryQuestionRow[]; isCustom: boolean }> {
  const supabase = await createClient();
  if (schoolId) {
    const { data: own } = await supabase
      .from("mastery_questions")
      .select("*")
      .eq("domain_id", domainId)
      .eq("school_id", schoolId)
      .order("order_index", { ascending: true });
    if (own && own.length > 0) return { questions: own as MasteryQuestionRow[], isCustom: true };
  }
  const { data } = await supabase
    .from("mastery_questions")
    .select("*")
    .eq("domain_id", domainId)
    .is("school_id", null)
    .order("order_index", { ascending: true });
  return { questions: (data || []) as MasteryQuestionRow[], isCustom: false };
}
