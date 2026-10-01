import { getDomainModules } from "@/app/actions/modules";
import { getCurrentStudent } from "@/lib/auth-session";
import { DuolingoPathView } from "@/components/student/DuolingoPathView";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DomainLearningPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain: domainId } = await params;
  const currentStudent = await getCurrentStudent();
  const { domain, modules, allCompleted } = await getDomainModules(domainId, currentStudent.id);

  if (!domain || !modules || modules.length === 0) {
    return (
      <div className="max-w-md mx-auto p-8 bg-white rounded-3xl border-2 border-slate-100 text-center space-y-4 my-12">
        <h2 className="text-xl font-bold text-slate-800">Domain Not Found</h2>
        <p className="text-xs text-slate-500">
          No lessons found for <code>{domainId}</code>. Verify database seeding in Supabase.
        </p>
        <Link
          href="/student/dashboard"
          className="inline-block bg-slate-900 text-white font-bold px-6 py-2.5 rounded-xl text-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <DuolingoPathView
      domain={domain}
      initialModules={modules as any}
      studentId={currentStudent.id}
      initialAllCompleted={allCompleted}
    />
  );
}
