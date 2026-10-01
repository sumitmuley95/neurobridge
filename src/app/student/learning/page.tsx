import Link from "next/link";
import { getCurrentStudent } from "@/lib/auth-session";
import { createClient } from "@/lib/supabase/server";
import { getVisibleDomains } from "@/lib/curriculum";
import { ArrowLeft, Play, Sparkles, BookOpen, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LearningHubPage() {
  const currentStudent = await getCurrentStudent();
  const supabase = await createClient();

  const domains = await getVisibleDomains(
    currentStudent.type === "institutional" ? currentStudent.schoolId : null,
    { onlyWithLessons: true }
  );

  const { data: progress } = await supabase
    .from("student_module_progress")
    .select("module_id, is_completed")
    .eq("student_id", currentStudent.id)
    .eq("is_completed", true);

  const completedCount = progress?.length || 0;
  const { count: lessonCount } = await supabase
    .from("domain_modules")
    .select("id", { count: "exact", head: true })
    .in("domain_id", domains.map((d) => d.id));
  const totalLessons = lessonCount ?? 0;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <span className="text-xs font-extrabold bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full">
          {completedCount} / {totalLessons} Lessons Completed
        </span>
      </div>

      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-3xl p-8 shadow-lg space-y-2">
        <span className="text-xs font-black uppercase tracking-widest bg-black/20 px-3 py-1 rounded-full inline-block">
          Interactive Video Curriculum
        </span>
        <h1 className="text-3xl font-black">Choose a Skill Unit to Practice</h1>
        <p className="text-emerald-100 text-sm font-medium">
          Select any domain below to follow its 5-video lesson path and earn unit mastery.
        </p>
      </div>

      {/* 8-Domain Units Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {(domains || []).map((domain, index) => (
          <Link
            key={domain.id}
            href={`/student/learning/${domain.id}`}
            className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all group flex flex-col justify-between space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl group-hover:scale-105 transition-transform">
                {domain.icon_emoji}
              </div>
              <span className="text-xs font-extrabold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-xl">
                Unit {index + 1}
              </span>
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg group-hover:text-emerald-600 transition-colors">
                {domain.name}
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-1">
                {domain.description || "5 sequential video lessons + Unit Check"}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
              <span>Start 5 Lessons</span>
              <div className="w-8 h-8 rounded-full bg-emerald-50 group-hover:bg-emerald-600 group-hover:text-white flex items-center justify-center transition-colors">
                <Play className="w-4 h-4 fill-current ml-0.5" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
