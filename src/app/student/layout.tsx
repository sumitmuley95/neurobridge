import { GraduationCap } from "lucide-react";
import { PortalShell } from "@/components/layout/PortalShell";

// Portal pages are always rendered per request and never stored by the
// browser (no-store), so Back/Forward after logout cannot show them.
export const dynamic = "force-dynamic";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <PortalShell portal="student" dashboardHref="/student/dashboard">
      {children}
    </PortalShell>
  );
}
