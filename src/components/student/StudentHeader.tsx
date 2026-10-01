import { Flame } from "lucide-react";
import { SpeakButton } from "@/components/student/SpeakButton";

interface StudentHeaderProps {
  studentName: string;
  streakCount?: number;
}

export function StudentHeader({ studentName, streakCount = 0 }: StudentHeaderProps) {
  return (
    <div className="bg-card rounded-3xl p-6 border-2 border-border shadow-sm flex flex-wrap items-center justify-between gap-4">
      <div>
        <span className="text-sm font-semibold text-student uppercase tracking-wide">
          Student Portal
        </span>
        <h1 className="text-3xl font-bold text-foreground mt-1 font-heading">
          Welcome, {studentName}
        </h1>
        <p className="text-muted-foreground text-base mt-1">
          Ready for today&apos;s learning journey?
        </p>
      </div>

      <div className="flex items-center gap-3">
        <SpeakButton
          readPage
          label="Read this page aloud"
          className="min-h-12 min-w-12 flex items-center justify-center bg-student-soft hover:opacity-90 text-student rounded-2xl transition-opacity border-2 border-transparent focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        />
        <div className="flex items-center gap-2 bg-warning-soft border-2 border-warning/40 px-4 py-2.5 rounded-2xl">
          <Flame className="w-5 h-5 text-warning" aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground">
            {streakCount} day{streakCount === 1 ? "" : "s"} streak
          </span>
        </div>
      </div>
    </div>
  );
}
