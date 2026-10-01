import Link from "next/link";
import { Users, BookOpen, Clock, ArrowRight, ShieldCheck, Flame, Zap, Medal, MessageSquare } from "lucide-react";
import { getTeacherDashboardData } from "@/app/actions/portal";
import { getCurrentTeacher } from "@/lib/auth-session";
import { getStatsForStudents } from "@/lib/gamification";
import { BadgeStrip } from "@/components/progress/Badges";

export default async function TeacherDashboardPage() {
  const teacher = await getCurrentTeacher();
  const { students, recentAttempts } = await getTeacherDashboardData();
  const stats = await getStatsForStudents(students.map((s: { id: string }) => s.id));
  const classBadges = Object.values(stats).reduce((n, st) => n + st.unlockedCount, 0);
  const activeToday = Object.values(stats).filter((st) => st.learnedToday).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Teacher Workspace</span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">Classroom Overview</h1>
          <p className="text-slate-500 text-sm mt-1">Track student domain progress, observations, and assignments.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/teacher/messages"
            className="inline-flex items-center gap-2 bg-teacher text-teacher-foreground px-4 min-h-11 rounded-2xl font-bold text-sm hover:opacity-90"
          >
            <MessageSquare className="w-5 h-5" aria-hidden="true" />
            Messages
          </Link>
          <div className="hidden sm:flex items-center gap-2 bg-purple-50 border border-purple-200 px-4 py-2 rounded-2xl text-purple-800 font-bold text-sm">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            {teacher.full_name}
          </div>
        </div>
      </div>

      {/* Class rewards summary */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label="Class progress rewards">
        <div className="rounded-3xl border-2 border-success/40 bg-success-soft p-5 flex items-center gap-4">
          <Medal className="h-8 w-8 text-success" aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{classBadges}</p>
            <p className="text-sm font-semibold text-foreground mt-1">Badges earned by your class</p>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-warning/40 bg-warning-soft p-5 flex items-center gap-4">
          <Flame className="h-8 w-8 text-warning" aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">{activeToday}/{students.length}</p>
            <p className="text-sm font-semibold text-foreground mt-1">Students who learned today</p>
          </div>
        </div>
        <div className="rounded-3xl border-2 border-teacher/30 bg-teacher-soft p-5 flex items-center gap-4">
          <Zap className="h-8 w-8 text-teacher" aria-hidden="true" />
          <div>
            <p className="text-2xl font-bold text-foreground leading-none">
              {Object.values(stats).reduce((n, st) => n + st.xp, 0)}
            </p>
            <p className="text-sm font-semibold text-foreground mt-1">Total class XP</p>
          </div>
        </div>
      </section>

      {/* Student List */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-purple-600" />
          Assigned Students ({students.length})
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map((student: any) => (
            <div
              key={student.id}
              className="bg-white rounded-2xl p-6 border-2 border-slate-100 shadow-sm hover:border-purple-200 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xl font-bold text-slate-900">{student.full_name}</h3>
                  <span className="text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 px-3 py-1 rounded-xl">
                    Active Student
                  </span>
                </div>
                <p className="text-sm text-slate-500 font-medium">
                  Parent: <span className="text-slate-800">{student.profiles?.full_name || "Anita Sharma"}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">Access PIN: {student.access_pin}</p>

                {stats[student.id] && (
                  <div className="mt-4 space-y-2">
                    <div className="flex flex-wrap gap-2 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 bg-warning-soft text-foreground border border-warning/40 px-2.5 py-1 rounded-lg">
                        <Flame className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
                        {stats[student.id].currentStreak}-day streak
                      </span>
                      <span className="inline-flex items-center gap-1 bg-teacher-soft text-foreground border border-teacher/30 px-2.5 py-1 rounded-lg">
                        <Zap className="h-3.5 w-3.5 text-teacher" aria-hidden="true" />
                        {stats[student.id].xp} XP
                      </span>
                      <span className="inline-flex items-center gap-1 bg-success-soft text-foreground border border-success/40 px-2.5 py-1 rounded-lg">
                        <Medal className="h-3.5 w-3.5 text-success" aria-hidden="true" />
                        {stats[student.id].unlockedCount}/{stats[student.id].badges.length} badges
                      </span>
                    </div>
                    <BadgeStrip stats={stats[student.id]} />
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
                <Link
                  href={`/teacher/student/${student.id}`}
                  className="inline-flex items-center gap-2 text-sm font-bold text-purple-700 hover:text-purple-900"
                >
                  View Profile & Observations <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Recent Practice Attempts */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-purple-600" />
          Recent Activity Attempts
        </h2>
        <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm">
          {recentAttempts.length === 0 ? (
            <p className="p-6 text-sm text-slate-500">No recent activity attempts recorded yet.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentAttempts.map((attempt: any) => (
                <div key={attempt.id} className="p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">{attempt.activities?.title}</h4>
                    <p className="text-xs text-slate-500">
                      Prompting: {attempt.prompting_level === 0 ? "Independent" : "Visual Hint Used"} • Response: {attempt.response_time_seconds}s
                    </p>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
                    attempt.is_correct
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {attempt.is_correct ? "Completed" : "Retried"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
