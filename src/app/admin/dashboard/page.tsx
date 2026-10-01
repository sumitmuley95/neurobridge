import Link from "next/link";
import { School, Users, GraduationCap, BookOpen, ArrowRight, ClipboardList } from "lucide-react";
import { getAdminDashboardStats, getSchools } from "@/app/actions/admin";
import { getCurrentAdmin } from "@/lib/auth-session";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [stats, schools, admin] = await Promise.all([getAdminDashboardStats(), getSchools(), getCurrentAdmin()]);
  const schoolName = schools[0]?.name ?? "No school linked";

  const cards = [
    { title: "Your School", value: stats.schools, href: "/admin/schools", icon: School, color: "text-blue-600 bg-blue-50" },
    { title: "Teachers", value: stats.teachers, href: "/admin/teachers", icon: Users, color: "text-purple-600 bg-purple-50" },
    { title: "Enrolled Students", value: stats.students, href: "/admin/students", icon: GraduationCap, color: "text-emerald-600 bg-emerald-50" },
    { title: "Subjects & Lessons", value: stats.domains, href: "/admin/curriculum", icon: BookOpen, color: "text-amber-600 bg-amber-50" },
    { title: "Screening Questions", value: "Edit", href: "/admin/screening", icon: ClipboardList, color: "text-rose-600 bg-rose-50" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <span className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Institution Control Center</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">{schoolName} · signed in as {admin.name}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.title}
              href={c.href}
              className="bg-white p-6 rounded-3xl border-2 border-slate-100 shadow-sm hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${c.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-2xl font-black text-slate-900">{c.value}</span>
              </div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{c.title}</h3>
                <span className="text-xs font-semibold text-slate-400 inline-flex items-center gap-1 mt-1">
                  Manage records <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
