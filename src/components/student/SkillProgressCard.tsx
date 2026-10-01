interface SkillProgressCardProps {
  domain: string;
  status: "Screened Adequate" | "Needs Practice" | "In Progress" | "Mastered";
  stage: "Foundation" | "Functional" | "Generalization" | "Mastered";
  iconEmoji: string;
}

const statusStyles = {
  "Screened Adequate": "bg-success-soft text-success border-success/40",
  "Needs Practice": "bg-warning-soft text-warning border-warning/40",
  "In Progress": "bg-student-soft text-student border-student/30",
  Mastered: "bg-teacher-soft text-teacher border-teacher/30",
};

export function SkillProgressCard({ domain, status, stage, iconEmoji }: SkillProgressCardProps) {
  return (
    <div className="bg-card rounded-2xl p-5 border-2 border-border shadow-sm flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-2xl bg-muted border-2 border-border flex items-center justify-center text-2xl shrink-0"
          aria-hidden="true"
        >
          {iconEmoji}
        </div>
        <div>
          <h3 className="font-semibold text-foreground text-base">{domain}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Stage: {stage}</p>
        </div>
      </div>
      <span className={`text-xs font-semibold px-3 py-1.5 rounded-lg border ${statusStyles[status]}`}>
        {status}
      </span>
    </div>
  );
}
