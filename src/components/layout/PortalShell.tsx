"use client";

/**
 * Shared shell for the four portals (student/parent/teacher/admin).
 * Keeps header height, nav placement, and wayfinding identical across
 * every screen — predictable structure is itself an accessibility
 * feature for ADHD and autistic users. Each portal keeps a distinct,
 * muted accent color so people always know which area they're in.
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import {
  ChevronRight,
  Home,
  GraduationCap,
  Users,
  BookOpen,
  Shield,
  LogOut,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type PortalKey = "student" | "parent" | "teacher" | "admin";

const PORTAL_ICONS: Record<PortalKey, LucideIcon> = {
  student: GraduationCap,
  parent: Users,
  teacher: BookOpen,
  admin: Shield,
};

const PORTAL_LABEL: Record<PortalKey, string> = {
  student: "Student Portal",
  parent: "Parent Portal",
  teacher: "Teacher Portal",
  admin: "Admin Portal",
};

interface PortalShellProps {
  portal: PortalKey;
  dashboardHref: string;
  children: React.ReactNode;
}

function humanize(segment: string) {
  return segment
    .replace(/[-_]/g, " ")
    .replace(/\[(.+)\]/, "$1")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function PortalShell({
  portal,
  dashboardHref,
  children,
}: PortalShellProps) {
  const pathname = usePathname() || "/";
  const segments = pathname.split("/").filter(Boolean).slice(1); // drop portal segment
  const Icon = PORTAL_ICONS[portal];
  const [loggingOut, setLoggingOut] = useState(false);

  // If the browser restores this page from its back/forward cache (e.g. Back
  // after logging out), reload it so the server re-checks the login.
  // Also ask the server whether this portal's login is still valid whenever
  // the page is shown — covers pages the browser re-shows from its cache.
  useEffect(() => {
    let cancelled = false;
    const verify = async () => {
      try {
        const res = await fetch("/api/session", { cache: "no-store" });
        const { role } = (await res.json()) as { role: string | null };
        if (!cancelled && role !== portal) {
          window.location.replace(role ? `/${role}/dashboard` : `/login?role=${portal}`);
        }
      } catch {
        // offline: leave the page as is
      }
    };
    const onShow = (e: PageTransitionEvent) => {
      if (e.persisted) window.location.reload();
      else verify();
    };
    verify();
    window.addEventListener("pageshow", onShow);
    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", onShow);
    };
  }, [portal]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    // Full replace: drops this page from history and clears in-app caches
    window.location.replace("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header
        className={cn(
          "border-b-2 border-border bg-card px-4 sm:px-6 py-4",
          "flex flex-wrap items-center justify-between gap-3"
        )}
      >
        <div className="flex items-center gap-3">
          <Link
            href="/"
            aria-label="Go to NeuroBridge home"
            className="flex items-center justify-center h-11 w-11 rounded-xl border-2 border-border text-muted-foreground hover:bg-muted transition-colors"
          >
            <Home className="h-5 w-5" />
          </Link>
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3 py-2 border-2",
              "bg-[var(--portal-soft)] border-[var(--portal)] text-[var(--portal)]"
            )}
            style={
              {
                "--portal": `var(--${portal})`,
                "--portal-soft": `var(--${portal}-soft)`,
              } as React.CSSProperties
            }
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            <span className="font-heading font-semibold text-sm sm:text-base">
              {PORTAL_LABEL[portal]}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={dashboardHref}
            className="min-h-11 inline-flex items-center rounded-xl border-2 border-border px-4 text-sm font-medium hover:bg-muted transition-colors focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Dashboard
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="min-h-11 inline-flex items-center gap-2 rounded-xl border-2 border-border px-4 text-sm font-medium hover:bg-destructive/10 hover:text-destructive hover:border-destructive/40 transition-colors disabled:opacity-60 focus-visible:outline focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            {loggingOut ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <LogOut className="h-4 w-4" aria-hidden="true" />}
            Logout
          </button>
        </div>
      </header>

      {/* Wayfinding breadcrumb — same position on every page in this portal */}
      <nav
        aria-label="Breadcrumb"
        className="px-4 sm:px-6 py-2.5 border-b border-border bg-muted/40 text-sm text-muted-foreground overflow-x-auto"
      >
        <ol className="flex items-center gap-1.5 whitespace-nowrap">
          <li className="flex items-center gap-1.5">
            <Link href={dashboardHref} className="hover:text-foreground hover:underline underline-offset-2">
              {PORTAL_LABEL[portal]}
            </Link>
          </li>
          {segments.map((seg, i) => (
            <li key={i} className="flex items-center gap-1.5">
              <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
              <span className={i === segments.length - 1 ? "text-foreground font-medium" : ""}>
                {humanize(seg)}
              </span>
            </li>
          ))}
        </ol>
      </nav>

      <main id="main-content" className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
    </div>
  );
}
