import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";

interface ActivityCardProps {
  id: string;
  domain: string;
  title: string;
  description: string;
  stage: "Foundation" | "Functional" | "Generalization" | "Mastered";
  icon?: React.ReactNode;
}

// Muted, AA-contrast badge colors — no saturated gradients.
const stageStyles = {
  Foundation: "bg-student-soft text-student border-student/30",
  Functional: "bg-warning-soft text-warning border-warning/40",
  Generalization: "bg-teacher-soft text-teacher border-teacher/30",
  Mastered: "bg-success-soft text-success border-success/40",
};

export function ActivityCard({
  id,
  domain,
  title,
  description,
  stage,
}: ActivityCardProps) {
  return (
    <div className="bg-card border-2 border-border rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide bg-muted text-muted-foreground px-3 py-1.5 rounded-lg">
            {domain}
          </span>
          <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${stageStyles[stage]}`}>
            {stage}
          </span>
        </div>

        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading">{title}</h2>
          <p className="text-muted-foreground text-base mt-2 max-w-md text-measure">{description}</p>
        </div>
      </div>

      {/* Single, unmistakable primary action */}
      <Link
        href={`/student/activity/${id}`}
        className="inline-flex items-center justify-center gap-3 bg-primary text-primary-foreground font-semibold text-lg min-h-14 px-8 rounded-2xl shadow-sm hover:opacity-90 transition-opacity w-full sm:w-auto focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <Play className="w-5 h-5" aria-hidden="true" />
        Start activity
        <ArrowRight className="w-5 h-5" aria-hidden="true" />
      </Link>
    </div>
  );
}
