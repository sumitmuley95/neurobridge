"use client";

import { useEffect, useState } from "react";
import { School, Info } from "lucide-react";
import { getSchools } from "@/app/actions/admin";

type SchoolRow = { id: string; name: string };

// A school admin manages exactly one school. New schools are onboarded by the
// NeuroBridge team (supabase/02_setup_school.sql).
export default function AdminSchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);

  useEffect(() => {
    getSchools().then(setSchools);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Your School</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {schools.map((s) => (
          <div key={s.id} className="bg-white p-5 rounded-2xl border-2 border-slate-100 shadow-sm flex items-center gap-3">
            <School className="w-6 h-6 text-blue-600 shrink-0" aria-hidden="true" />
            <div>
              <h2 className="font-bold text-slate-900">{s.name}</h2>
              <span className="text-xs text-slate-400">ID: {s.id}</span>
            </div>
          </div>
        ))}
      </div>

      <p className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-sm text-slate-600 flex items-start gap-2">
        <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
        You manage the teachers, students and curriculum of this school. To add another school or centre, please contact
        the NeuroBridge team.
      </p>
    </div>
  );
}
