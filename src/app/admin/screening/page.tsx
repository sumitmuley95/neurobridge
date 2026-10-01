import { getScreeningAdmin } from "@/app/actions/curriculum";
import { ScreeningManager } from "@/components/admin/ScreeningManager";

export const dynamic = "force-dynamic";

export default async function AdminScreeningPage() {
  const data = await getScreeningAdmin();
  return <ScreeningManager {...(data as unknown as Parameters<typeof ScreeningManager>[0])} />;
}
