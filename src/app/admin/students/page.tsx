"use client";

import { useEffect, useState } from "react";
import { GraduationCap, Plus, Loader2 } from "lucide-react";
import { getAdminStudents, getSchools, createInstitutionalStudent } from "@/app/actions/admin";

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [schools, setSchools] = useState<any[]>([]);
  const [fullName, setFullName] = useState("");
  const [schoolId, setSchoolId] = useState("");
  const [accessPin, setAccessPin] = useState("1234");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getAdminStudents().then(setStudents);
    getSchools().then((sc) => {
      setSchools(sc);
      if (sc.length > 0) setSchoolId(sc[0].id);
    });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) return;
    setLoading(true);
    await createInstitutionalStudent({ fullName, schoolId, accessPin });
    setFullName("");
    const refreshed = await getAdminStudents();
    setStudents(refreshed);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-black text-slate-900">Manage Students (School Enrolled)</h1>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          type="text"
          placeholder="Student Full Name..."
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-slate-900"
        />
        <select
          value={schoolId}
          onChange={(e) => setSchoolId(e.target.value)}
          className="border border-slate-200 rounded-xl px-3 py-2 text-sm bg-white"
        >
          {schools.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Access PIN (e.g. 1234)"
          value={accessPin}
          onChange={(e) => setAccessPin(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          disabled={loading || !fullName.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2 rounded-xl text-sm flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Enroll Student
        </button>
      </form>

      <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
        {students.map((st) => (
          <div key={st.id} className="p-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{st.full_name}</h3>
              <p className="text-xs text-slate-500">
                Code: <span className="font-bold text-slate-700">{st.enrollment_code || "N/A"}</span> • PIN: {st.access_pin} • School: {st.schools?.name || "Independent"}
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-xl border ${
              st.student_type === "institutional"
                ? "bg-blue-50 text-blue-700 border-blue-200"
                : "bg-emerald-50 text-emerald-700 border-emerald-200"
            }`}>
              {st.student_type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
