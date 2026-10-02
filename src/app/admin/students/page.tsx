"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, KeyRound, Check, Info } from "lucide-react";
import { getAdminStudents, createInstitutionalStudent, updateStudentPin } from "@/app/actions/admin";

type StudentRow = {
  id: string;
  full_name: string;
  enrollment_code: string | null;
  student_type: string;
  schools?: { name: string } | null;
};

const digitsOnly = (v: string) => v.replace(/\D/g, "").slice(0, 6);

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [fullName, setFullName] = useState("");
  const [accessPin, setAccessPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<{ name: string; code: string; pin: string } | null>(null);
  const [pinEdit, setPinEdit] = useState<Record<string, string>>({});
  const [pinMsg, setPinMsg] = useState<Record<string, string>>({});

  const reload = async () => setStudents((await getAdminStudents()) as unknown as StudentRow[]);

  useEffect(() => {
    reload();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || accessPin.length < 4) return;
    setLoading(true);
    setError("");
    setCreated(null);
    const res = await createInstitutionalStudent({ fullName, accessPin });
    if (res.success && "enrollmentCode" in res && res.enrollmentCode) {
      setCreated({ name: fullName.trim(), code: res.enrollmentCode, pin: accessPin });
      setFullName("");
      setAccessPin("");
      await reload();
    } else {
      setError(res.error || "Could not enroll the student.");
    }
    setLoading(false);
  };

  const savePin = async (id: string) => {
    const res = await updateStudentPin(id, pinEdit[id] || "");
    setPinMsg((m) => ({ ...m, [id]: res.success ? "PIN updated" : res.error || "Failed" }));
    if (res.success) setPinEdit((p) => ({ ...p, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Manage Students (School Enrolled)</h1>
        <p className="text-sm text-slate-500">
          Students log in with their enrollment code and PIN. Parents use the same details for the parent portal.
        </p>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <input
          type="text"
          aria-label="Student full name"
          placeholder="Student Full Name..."
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-h-11 focus:outline-none focus:border-slate-900"
        />
        <input
          type="text"
          inputMode="numeric"
          aria-label="Student login PIN"
          placeholder="Login PIN (4–6 digits)"
          value={accessPin}
          onChange={(e) => setAccessPin(digitsOnly(e.target.value))}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm min-h-11 tracking-widest focus:outline-none focus:border-slate-900"
        />
        <button
          type="submit"
          disabled={loading || !fullName.trim() || accessPin.length < 4}
          className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm flex items-center justify-center gap-2 min-h-11"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Enroll Student
        </button>
        {error && (
          <p className="sm:col-span-3 text-sm font-semibold text-rose-700" role="alert">
            {error}
          </p>
        )}
      </form>

      {created && (
        <div role="status" className="p-4 rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-sm text-emerald-900 flex items-start gap-2">
          <Info className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-bold">{created.name} has been enrolled.</p>
            <p>
              Enrollment code: <span className="font-mono font-bold">{created.code}</span> · PIN:{" "}
              <span className="font-mono font-bold">{created.pin}</span>
            </p>
            <p className="text-xs mt-1">Share these with the family now. The PIN will not be shown again.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
        {students.length === 0 && <p className="p-4 text-sm text-slate-500">No students enrolled yet.</p>}
        {students.map((st) => (
          <div key={st.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{st.full_name}</h3>
              <p className="text-xs text-slate-500">
                Code: <span className="font-bold text-slate-700">{st.enrollment_code || "N/A"}</span> • School:{" "}
                {st.schools?.name || "—"}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                inputMode="numeric"
                aria-label={`New PIN for ${st.full_name}`}
                placeholder="New PIN"
                value={pinEdit[st.id] || ""}
                onChange={(e) => setPinEdit((p) => ({ ...p, [st.id]: digitsOnly(e.target.value) }))}
                className="w-28 border border-slate-200 rounded-xl px-3 py-1.5 text-sm min-h-11 tracking-widest"
              />
              <button
                type="button"
                onClick={() => savePin(st.id)}
                disabled={(pinEdit[st.id] || "").length < 4}
                className="min-h-11 px-3 rounded-xl border-2 border-slate-200 text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Change PIN
              </button>
              {pinMsg[st.id] && <span className="text-xs font-semibold text-slate-600">{pinMsg[st.id]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}