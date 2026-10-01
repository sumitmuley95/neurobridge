import Link from "next/link";
import { MessageSquare, Heart, Sparkles, UserCheck, ShieldCheck } from "lucide-react";
import { getParentDashboardData } from "@/app/actions/portal";
import { getCurrentParent } from "@/lib/auth-session";
import { getStudentStats } from "@/lib/gamification";
import { StatsTiles, BadgeGallery } from "@/components/progress/Badges";

export const dynamic = "force-dynamic";

export default async function ParentDashboardPage() {
  const currentParent = await getCurrentParent();
  const [{ student, domainResults, observations }, stats] = await Promise.all([
    getParentDashboardData(currentParent.studentId),
    getStudentStats(currentParent.studentId),
  ]);
  const childName = student?.full_name || currentParent.studentName;

  const isIndividual = student?.student_type === "individual";
  const strengths = domainResults.filter((d: any) => d.status === "screened_adequate");
  const practiceAreas = domainResults.filter((d: any) => d.status === "needs_practice");

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Parent Portal</span>
            <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
              isIndividual ? "bg-amber-50 text-amber-800 border-amber-200" : "bg-blue-50 text-blue-800 border-blue-200"
            }`}>
              {isIndividual ? "Individual Track" : "School Enrolled"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            {student?.full_name || currentParent.studentName}'s Progress
          </h1>
          <p className="text-slate-500 text-sm font-medium mt-1">
            {isIndividual 
              ? "Direct home-learning tracking managed by parent/guardian." 
              : "Integrated school learning with teacher coordination."}
          </p>
        </div>

        {!isIndividual && (
          <Link
            href="/parent/messages"
            className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-2xl shadow-sm transition-all"
          >
            <MessageSquare className="w-5 h-5" />
            Message Teacher
          </Link>
        )}
      </div>

      {/* Child's streak, XP and badges */}
      <section className="space-y-4" aria-label={`${childName}'s progress rewards`}>
        <StatsTiles stats={stats} who={childName} />
        <BadgeGallery stats={stats} title={`${childName}'s badges`} />
      </section>

      {/* Strengths & Practice Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/60 border-2 border-emerald-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-900 font-extrabold text-lg">
            <Heart className="w-5 h-5 text-emerald-600 fill-emerald-500" />
            Current Strengths
          </div>
          <p className="text-xs text-emerald-800 font-medium">
            Skills where {student?.full_name || currentParent.studentName} demonstrated independent confidence.
          </p>
          <div className="space-y-2">
            {strengths.length === 0 ? (
              <p className="text-xs text-slate-500">No screening strengths recorded yet.</p>
            ) : (
              strengths.map((s: any) => (
                <div key={s.id} className="bg-white p-3.5 rounded-2xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    {s.domains?.icon_emoji} {s.domains?.name}
                  </span>
                  <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl">
                    Confident
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-amber-50/60 border-2 border-amber-200 rounded-3xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-900 font-extrabold text-lg">
            <Sparkles className="w-5 h-5 text-amber-600 fill-amber-500" />
            Active Learning Areas
          </div>
          <p className="text-xs text-amber-800 font-medium">
            Everyday skills currently being practiced with guided support.
          </p>
          <div className="space-y-2">
            {practiceAreas.length === 0 ? (
              <p className="text-xs text-slate-500">All domains currently screened adequate.</p>
            ) : (
              practiceAreas.map((p: any) => (
                <div key={p.id} className="bg-white p-3.5 rounded-2xl border border-amber-200 flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800">
                    {p.domains?.icon_emoji} {p.domains?.name}
                  </span>
                  <span className="text-xs font-extrabold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
                    In Learning Path
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Teacher Observations - Displayed ONLY for Institutional Students */}
      {!isIndividual ? (
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900">Teacher Notes & Observations</h2>
          <div className="space-y-3">
            {observations.length === 0 ? (
              <p className="text-sm text-slate-500">No teacher notes posted yet.</p>
            ) : (
              observations.map((obs: any) => (
                <div key={obs.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm space-y-1">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                    <span className="text-emerald-700 uppercase">{obs.domain_id?.replace("_", " ")}</span>
                    <span>{new Date(obs.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm font-medium text-slate-800">{obs.observation_text}</p>
                </div>
              ))
            )}
          </div>
        </section>
      ) : (
        <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-xs font-semibold text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-slate-500" />
          <span>Independent Learning Account: Student data is strictly private to student and caregiver.</span>
        </div>
      )}
    </div>
  );
}
