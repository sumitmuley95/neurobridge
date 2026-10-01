import {
  PlayCircle,
  BookOpen,
  Trophy,
  Crown,
  Flame,
  Rocket,
  ClipboardCheck,
  Star,
  Gem,
  Lock,
  Zap,
  Medal,
} from "lucide-react";
import type { BadgeDef, StudentStats } from "@/lib/gamification";

const ICONS = {
  play: PlayCircle,
  books: BookOpen,
  trophy: Trophy,
  crown: Crown,
  flame: Flame,
  rocket: Rocket,
  clipboard: ClipboardCheck,
  star: Star,
  gem: Gem,
} as const;

// Uses the app's own calm accent colours (tokens from globals.css)
const TONE: Record<BadgeDef["tone"], { disc: string; ring: string; text: string }> = {
  student: { disc: "bg-student text-student-foreground", ring: "ring-student/30", text: "text-student" },
  parent: { disc: "bg-parent text-parent-foreground", ring: "ring-parent/30", text: "text-parent" },
  teacher: { disc: "bg-teacher text-teacher-foreground", ring: "ring-teacher/30", text: "text-teacher" },
  warning: { disc: "bg-warning text-white", ring: "ring-warning/30", text: "text-warning" },
  success: { disc: "bg-success text-white", ring: "ring-success/30", text: "text-success" },
};

function Medallion({ def, unlocked, size = "lg" }: { def: BadgeDef; unlocked: boolean; size?: "lg" | "sm" }) {
  const Icon = ICONS[def.icon];
  const t = TONE[def.tone];
  const box = size === "lg" ? "h-16 w-16" : "h-9 w-9";
  const icon = size === "lg" ? "h-8 w-8" : "h-4.5 w-4.5";
  return (
    <span
      className={`relative ${box} shrink-0 rounded-full flex items-center justify-center ring-4 ${
        unlocked ? `${t.disc} ${t.ring} shadow-sm` : "bg-muted text-muted-foreground ring-border"
      }`}
      aria-hidden="true"
    >
      <Icon className={`${icon} ${unlocked ? "" : "opacity-40"}`} />
      {!unlocked && size === "lg" && (
        <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border-2 border-border flex items-center justify-center">
          <Lock className="h-3 w-3" />
        </span>
      )}
    </span>
  );
}

/** Streak / XP / badges summary tiles */
export function StatsTiles({ stats, who = "You" }: { stats: StudentStats; who?: string }) {
  const tiles = [
    {
      icon: Flame,
      label: "Day streak",
      value: stats.currentStreak,
      note: stats.learnedToday
        ? "Learned today — great!"
        : stats.currentStreak > 0
        ? "Learn today to keep it going"
        : `Best: ${stats.longestStreak} day${stats.longestStreak === 1 ? "" : "s"}`,
      cls: "bg-warning-soft border-warning/40 text-warning",
    },
    {
      icon: Zap,
      label: "Total XP",
      value: stats.xp,
      note: `${stats.lessonsCompleted} lesson${stats.lessonsCompleted === 1 ? "" : "s"} completed`,
      cls: "bg-teacher-soft border-teacher/30 text-teacher",
    },
    {
      icon: Medal,
      label: "Badges",
      value: `${stats.unlockedCount}/${stats.badges.length}`,
      note: `${stats.unitsMastered} unit${stats.unitsMastered === 1 ? "" : "s"} mastered`,
      cls: "bg-success-soft border-success/40 text-success",
    },
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3" aria-label={`${who}: streak, XP and badges`}>
      {tiles.map(({ icon: Icon, label, value, note, cls }) => (
        <div key={label} className={`rounded-3xl border-2 p-5 flex items-center gap-4 ${cls}`}>
          <span className="h-12 w-12 rounded-2xl bg-card flex items-center justify-center shrink-0">
            <Icon className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <p className="text-2xl font-bold text-foreground leading-none">{value}</p>
            <p className="text-sm font-semibold text-foreground mt-1">{label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{note}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Full badge gallery: unlocked badges in colour, locked ones greyed with a lock */
export function BadgeGallery({ stats, title = "Your badges" }: { stats: StudentStats; title?: string }) {
  const pct = Math.round((stats.unlockedCount / stats.badges.length) * 100);
  return (
    <section className="bg-card border-2 border-border rounded-3xl p-6 space-y-5" aria-label={title}>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground font-heading">{title}</h2>
          <p className="text-sm text-muted-foreground">
            {stats.unlockedCount} of {stats.badges.length} unlocked
          </p>
        </div>
        <div className="w-full sm:w-56">
          <div
            className="h-3 rounded-full bg-muted overflow-hidden"
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Badges unlocked"
          >
            <div className="h-full bg-success rounded-full" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.badges.map(({ def, unlocked }) => (
          <li
            key={def.id}
            className={`rounded-2xl border-2 p-4 flex flex-col items-center gap-3 ${
              unlocked ? "border-border bg-background" : "border-dashed border-border bg-muted/40"
            }`}
          >
            <Medallion def={def} unlocked={unlocked} />
            <div className="w-full">
              <p className={`text-sm font-semibold ${unlocked ? "text-foreground" : "text-muted-foreground"}`}>
                {def.name}
              </p>
              <p className="text-xs text-muted-foreground">{def.description}</p>
              <p className={`text-xs font-semibold mt-1 ${unlocked ? TONE[def.tone].text : "text-muted-foreground"}`}>
                {unlocked ? "Unlocked" : "Locked"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Compact row of small medallions (unlocked first) — for teacher lists */
export function BadgeStrip({ stats, max = 9 }: { stats: StudentStats; max?: number }) {
  const sorted = [...stats.badges].sort((a, b) => Number(b.unlocked) - Number(a.unlocked)).slice(0, max);
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label={`${stats.unlockedCount} badges unlocked`}>
      {sorted.map(({ def, unlocked }) => (
        <li key={def.id} title={`${def.name}${unlocked ? "" : " (locked)"}`}>
          <Medallion def={def} unlocked={unlocked} size="sm" />
          <span className="sr-only">
            {def.name}: {unlocked ? "unlocked" : "locked"}
          </span>
        </li>
      ))}
    </ul>
  );
}
