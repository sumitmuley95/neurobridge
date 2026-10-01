import Link from "next/link";
import { StudentHeader } from "@/components/student/StudentHeader";
import { ActivityCard } from "@/components/student/ActivityCard";
import { Sparkles, Bot, ClipboardCheck, PlayCircle, ArrowRight, Video, Lightbulb, MessageCircle } from "lucide-react";
import { getStudentLearningPath } from "@/app/actions/learning";
import { getCurrentStudent } from "@/lib/auth-session";
import { getStudentStats } from "@/lib/gamification";
import { StatsTiles, BadgeGallery } from "@/components/progress/Badges";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const currentStudent = await getCurrentStudent();
  const [{ allDomains, recommendedActivity, aiMeta }, stats] = await Promise.all([
    getStudentLearningPath(currentStudent.id),
    getStudentStats(currentStudent.id),
  ]);

  // Find prioritized domain needing practice
  const priorityDomain = allDomains.find(
    (d) => d.status === "Needs Practice" || d.status.startsWith("In Progress")
  ) || allDomains[0];

  return (
    <div className="space-y-8 pb-12">
      <StudentHeader studentName={currentStudent.name} streakCount={stats.currentStreak} />

      {/* Real streak, XP and badge counts */}
      <StatsTiles stats={stats} />

      {/* Featured learning path — one clear primary action */}
      <div className="bg-parent text-parent-foreground rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center sm:text-left">
          <span className="text-xs font-semibold uppercase tracking-wide bg-black/15 px-3 py-1 rounded-full inline-block">
            Featured learning path
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold font-heading">
            {priorityDomain?.iconEmoji} {priorityDomain?.name}
          </h2>
          <p className="text-sm sm:text-base opacity-90 max-w-md text-measure">
            Follow the 5-video interactive path to master this unit.
          </p>
        </div>

        <Link
          href={`/student/learning/${priorityDomain?.id}`}
          className="bg-card text-parent hover:opacity-90 font-semibold min-h-14 px-8 rounded-2xl shadow-sm transition-opacity flex items-center gap-2 whitespace-nowrap text-base shrink-0 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <PlayCircle className="w-6 h-6" aria-hidden="true" />
          Start video lessons
        </Link>
      </div>

      {/* AAC Talk Board — picture cards → spoken sentence */}
      <div className="bg-student-soft border-2 border-student/30 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-student text-student-foreground rounded-2xl shrink-0" aria-hidden="true">
            <MessageCircle className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-heading">Talk with pictures</h2>
            <p className="text-sm text-muted-foreground mt-0.5 text-measure">
              Tap picture cards to make a sentence, then hear it spoken aloud.
            </p>
          </div>
        </div>
        <Link
          href="/student/aac"
          className="bg-student text-student-foreground font-semibold min-h-12 px-6 rounded-2xl shadow-sm transition-opacity hover:opacity-90 whitespace-nowrap inline-flex items-center gap-2 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Open Talk Board
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Screening status banner */}
      <div className="bg-warning-soft border-2 border-warning/40 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-warning text-white rounded-2xl shrink-0" aria-hidden="true">
            <ClipboardCheck className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-foreground font-heading">8-domain learning profile</h2>
            <p className="text-sm text-muted-foreground mt-0.5 text-measure">
              Profile updated from your latest screening and activity records.
            </p>
          </div>
        </div>
        <Link
          href="/student/screening"
          className="bg-card border-2 border-warning/50 text-foreground font-semibold min-h-12 px-6 rounded-2xl shadow-sm transition-colors hover:bg-warning-soft whitespace-nowrap focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Retake screening
        </Link>
      </div>

      {/* AI recommendation */}
      {recommendedActivity && (
        <section className="space-y-3" aria-labelledby="recommendation-heading">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-teacher" aria-hidden="true" />
              <h2 id="recommendation-heading" className="text-lg font-bold text-foreground font-heading">
                {aiMeta.isAiGenerated ? "AI adaptive recommendation" : "Personalized recommendation"}
              </h2>
            </div>
            {aiMeta.isAiGenerated && (
              <span className="text-xs font-semibold bg-teacher-soft border border-teacher/30 text-teacher px-3 py-1.5 rounded-full flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> Powered by Gemini
              </span>
            )}
          </div>

          <div className="p-4 bg-card border-2 border-border rounded-2xl text-sm font-medium text-foreground flex items-start gap-3">
            <Lightbulb className="w-5 h-5 text-warning shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-measure">{aiMeta.studentExplanation}</span>
          </div>

          <ActivityCard
            id={recommendedActivity.id}
            domain={recommendedActivity.domain_id.replace("_", " ").toUpperCase()}
            stage={recommendedActivity.stage}
            title={recommendedActivity.title}
            description={recommendedActivity.description}
          />
        </section>
      )}

      {/* 8-domain progress grid */}
      <section className="space-y-4" aria-labelledby="domains-heading">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="domains-heading" className="text-lg font-bold text-foreground font-heading">
            Your domain learning path
          </h2>
          <Link
            href="/student/learning"
            className="text-sm font-semibold text-student hover:underline underline-offset-2 inline-flex items-center gap-1 min-h-11"
          >
            <Video className="w-4 h-4" aria-hidden="true" /> View all video units
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allDomains.map((item) => (
            <div
              key={item.id}
              className="bg-card rounded-3xl p-5 border-2 border-border shadow-sm flex flex-col justify-between gap-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-12 h-12 rounded-2xl bg-muted border-2 border-border flex items-center justify-center text-2xl shrink-0"
                    aria-hidden="true"
                  >
                    {item.iconEmoji}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground text-base">{item.name}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      Stage: <span className="font-medium text-foreground">{item.stage}</span>
                      {item.mastery > 0 && ` • ${item.mastery}% mastery`}
                    </p>
                  </div>
                </div>

                <span
                  className={`shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg border ${
                    item.status === "Mastered"
                      ? "bg-teacher-soft text-teacher border-teacher/30"
                      : item.status === "Screened Adequate"
                      ? "bg-success-soft text-success border-success/40"
                      : item.status.startsWith("In Progress")
                      ? "bg-student-soft text-student border-student/30"
                      : "bg-warning-soft text-warning border-warning/40"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <Link
                href={`/student/learning/${item.id}`}
                className="w-full min-h-12 px-4 rounded-xl bg-muted hover:bg-student-soft border-2 border-border hover:border-student/40 text-foreground hover:text-student text-sm font-semibold flex items-center justify-between transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <span className="flex items-center gap-2">
                  <PlayCircle className="w-4 h-4" aria-hidden="true" />
                  Open 5-video lessons
                </span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            </div>
          ))}
        </div>
      </section>
      <BadgeGallery stats={stats} />
    </div>
  );
}
