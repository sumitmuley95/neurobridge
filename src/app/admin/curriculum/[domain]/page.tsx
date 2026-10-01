import { notFound } from "next/navigation";
import { getSubjectDetail } from "@/app/actions/curriculum";
import { SubjectManager } from "@/components/admin/SubjectManager";

export const dynamic = "force-dynamic";

export default async function AdminSubjectPage({ params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  let detail: Awaited<ReturnType<typeof getSubjectDetail>>;
  try {
    detail = await getSubjectDetail(domain);
  } catch {
    notFound();
  }
  return <SubjectManager {...detail} />;
}
