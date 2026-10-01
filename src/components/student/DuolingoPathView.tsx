"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Check,
  Lock,
  Star,
  ArrowLeft,
  Trophy,
  X,
  CheckCircle2,
  Loader2,
  Flame,
  Zap,
  Sprout,
} from "lucide-react";
import { completeVideoModule } from "@/app/actions/modules";

interface ModuleItem {
  id: string;
  domain_id: string;
  title: string;
  description: string;
  video_url: string;
  order_index: number;
  xp_reward?: number | null;
  status: "completed" | "current" | "locked";
}

interface Props {
  domain: { id: string; name: string; icon_emoji: string };
  initialModules: ModuleItem[];
  studentId: string;
  initialAllCompleted: boolean;
  streak?: number;
  totalXp?: number;
}

// Winding path: a fixed, predictable side-to-side pattern (px from centre)
const OFFSETS = [0, 56, 84, 56, 0, -56, -84, -56];
const offsetAt = (i: number) => OFFSETS[i % OFFSETS.length];

// YouTube links play in an embedded player; anything else in <video>
function youTubeEmbed(url: string): string | null {
  const m =
    url.match(/youtube\.com\/watch\?v=([\w-]{6,})/) ||
    url.match(/youtu\.be\/([\w-]{6,})/) ||
    url.match(/youtube\.com\/(?:embed|shorts)\/([\w-]{6,})/);
  return m ? `https://www.youtube-nocookie.com/embed/${m[1]}` : null;
}

export function DuolingoPathView({
  domain,
  initialModules,
  studentId,
  initialAllCompleted,
  streak = 0,
  totalXp,
}: Props) {
  const [modules, setModules] = useState<ModuleItem[]>(initialModules);
  const [allCompleted, setAllCompleted] = useState(initialAllCompleted);
  const [activeModule, setActiveModule] = useState<ModuleItem | null>(null);
  const [completing, setCompleting] = useState(false);

  const doneCount = modules.filter((m) => m.status === "completed").length;
  const unitXp = modules.reduce((n, m) => n + (m.status === "completed" ? Number(m.xp_reward) || 0 : 0), 0);
  const currentIndex = modules.findIndex((m) => m.status === "current");

  const handleFinishLesson = async () => {
    if (!activeModule) return;
    setCompleting(true);
    await completeVideoModule(activeModule.id, studentId, domain.id);

    const updated = modules.map((m) => {
      if (m.id === activeModule.id) return { ...m, status: "completed" as const };
      if (m.order_index === activeModule.order_index + 1 && m.status === "locked")
        return { ...m, status: "current" as const };
      return m;
    });

    setModules(updated);
    setAllCompleted(updated.every((m) => m.status === "completed"));
    setActiveModule(null);
    setCompleting(false);
  };

  const embed = activeModule ? youTubeEmbed(activeModule.video_url) : null;

  return (
    <div className="max-w-md mx-auto space-y-6 pb-20">
      {/* Top bar: back, streak, XP */}
      <div className="flex items-center justify-between gap-2 bg-card px-4 py-2.5 rounded-2xl border-2 border-border shadow-sm">
        <Link
          href="/student/learning"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground min-h-11 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring rounded-lg px-1"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> All units
        </Link>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-warning-soft text-foreground px-3 py-1.5 rounded-full border border-warning/40">
            <Flame className="w-4 h-4 text-warning" aria-hidden="true" />
            {streak}
            <span className="sr-only">day streak</span>
          </span>
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold bg-teacher-soft text-foreground px-3 py-1.5 rounded-full border border-teacher/30">
            <Zap className="w-4 h-4 text-teacher" aria-hidden="true" />
            {/* totalXp is refreshed by the server after each completed lesson */}
            {totalXp ?? 0} XP
          </span>
        </div>
      </div>

      {/* Unit banner */}
      <div className="bg-parent text-parent-foreground rounded-3xl p-5 shadow-[0_6px_0_0_rgb(0_0_0/0.18)] flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-90">Unit · {doneCount} of {modules.length} lessons</p>
          <h1 className="text-2xl font-bold font-heading mt-0.5">
            <span aria-hidden="true">{domain.icon_emoji}</span> {domain.name}
          </h1>
          <p className="text-sm opacity-90 mt-1">Finish every lesson to unlock the trophy check.</p>
        </div>
        <div className="shrink-0 h-14 w-14 rounded-2xl bg-black/15 flex flex-col items-center justify-center text-xs font-bold">
          <Zap className="h-5 w-5" aria-hidden="true" />
          {unitXp}
        </div>
      </div>

      {/* The path */}
      <ol className="relative flex flex-col items-center gap-16 pt-12" aria-label={`${domain.name} lessons`}>
        {modules.map((mod, i) => {
          const isCompleted = mod.status === "completed";
          const isCurrent = mod.status === "current";
          const isLocked = mod.status === "locked";
          const xp = Number(mod.xp_reward) || 0;

          return (
            <li key={mod.id} className="nb-path-step relative flex flex-col items-center" style={{ "--x": offsetAt(i) } as React.CSSProperties}>
              {isCurrent && (
                <span
                  className="nb-bob absolute -top-12 left-1/2 z-10 whitespace-nowrap bg-card border-2 border-border text-primary font-bold text-sm tracking-wide px-3 py-1.5 rounded-xl shadow-sm after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:top-full after:border-8 after:border-transparent after:border-t-border"
                  aria-hidden="true"
                >
                  START
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  if (!isLocked) setActiveModule(mod);
                }}
                disabled={isLocked}
                aria-label={`Lesson ${mod.order_index}: ${mod.title}${isCompleted ? " — completed, tap to watch again" : isCurrent ? " — start this lesson" : " — locked"}`}
                className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-transform active:translate-y-1 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring ${
                  isCompleted
                    ? "bg-warning text-white shadow-[0_7px_0_0_rgb(0_0_0/0.22)]"
                    : isCurrent
                    ? "bg-primary text-primary-foreground shadow-[0_7px_0_0_rgb(0_0_0/0.25)] ring-8 ring-primary/20"
                    : "bg-muted text-muted-foreground shadow-[0_7px_0_0_rgb(0_0_0/0.10)] cursor-not-allowed"
                }`}
              >
                {isCompleted ? (
                  <Check className="w-9 h-9 stroke-[3.5]" aria-hidden="true" />
                ) : isCurrent ? (
                  <Star className="w-9 h-9 fill-current" aria-hidden="true" />
                ) : (
                  <Lock className="w-7 h-7" aria-hidden="true" />
                )}
              </button>
              <div className="mt-3 w-36 sm:w-44 text-center">
                <p className={`text-sm font-semibold leading-snug ${isLocked ? "text-muted-foreground" : "text-foreground"} text-center`}>
                  {mod.title}
                </p>
                <p className="text-xs text-muted-foreground text-center">
                  {isCompleted ? "Done" : `+${xp} XP`}
                </p>
              </div>

              {/* Friendly sprout buddy beside the current lesson (decorative) */}
              {isCurrent && i === currentIndex && (
                <span
                  className={`absolute top-2 ${offsetAt(i) >= 0 ? "-left-28" : "-right-28"} hidden sm:flex flex-col items-center gap-1`}
                  aria-hidden="true"
                >
                  <span className="h-14 w-14 rounded-full bg-parent-soft border-2 border-parent/30 text-parent flex items-center justify-center">
                    <Sprout className="h-8 w-8" />
                  </span>
                  <span className="text-xs font-semibold text-parent bg-card border border-border rounded-lg px-2 py-0.5">You can do it!</span>
                </span>
              )}
            </li>
          );
        })}

        {/* Trophy gate: the unit mastery check */}
        <li className="nb-path-step relative flex flex-col items-center" style={{ "--x": offsetAt(modules.length) } as React.CSSProperties}>
          <Link
            href={allCompleted ? `/student/mastery/${domain.id}` : "#"}
            aria-disabled={!allCompleted}
            tabIndex={allCompleted ? 0 : -1}
            aria-label={allCompleted ? "Start the unit mastery check" : "Unit mastery check — locked until all lessons are done"}
            className={`h-24 w-24 rounded-3xl flex items-center justify-center focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-ring ${
              allCompleted
                ? "bg-teacher text-teacher-foreground shadow-[0_8px_0_0_rgb(0_0_0/0.25)] ring-8 ring-teacher/20"
                : "bg-muted text-muted-foreground shadow-[0_8px_0_0_rgb(0_0_0/0.10)] pointer-events-none"
            }`}
          >
            {allCompleted ? <Trophy className="h-11 w-11" aria-hidden="true" /> : <Lock className="h-9 w-9" aria-hidden="true" />}
          </Link>
          <p className={`mt-3 text-sm font-semibold text-center ${allCompleted ? "text-teacher" : "text-muted-foreground"}`}>
            {allCompleted ? "Trophy check — tap to start!" : "Trophy check (locked)"}
          </p>
        </li>
      </ol>

      {activeModule && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="lesson-modal-title"
          className="fixed inset-0 bg-foreground/60 z-50 flex items-center justify-center p-4"
        >
          <div className="bg-card rounded-3xl max-w-lg w-full overflow-hidden shadow-xl space-y-4 p-6 border-2 border-border">
            <div className="flex items-center justify-between border-b-2 border-border pb-3">
              <div>
                <span className="text-xs font-semibold text-parent uppercase tracking-wide">
                  Lesson {activeModule.order_index} of {modules.length} · +{Number(activeModule.xp_reward) || 0} XP
                </span>
                <h3 id="lesson-modal-title" className="text-lg font-bold text-foreground font-heading">
                  {activeModule.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveModule(null)}
                aria-label="Close lesson"
                className="min-h-11 min-w-11 flex items-center justify-center hover:bg-muted rounded-full text-muted-foreground focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden bg-foreground aspect-video flex items-center justify-center">
              {embed ? (
                <iframe
                  src={embed}
                  title={activeModule.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <video src={activeModule.video_url} controls className="w-full h-full object-contain" />
              )}
            </div>

            <p className="text-sm text-muted-foreground text-measure">{activeModule.description}</p>

            <button
              type="button"
              onClick={handleFinishLesson}
              disabled={completing}
              className="w-full bg-primary text-primary-foreground font-semibold min-h-14 rounded-2xl shadow-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {completing ? (
                <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> Mark lesson complete & continue
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
