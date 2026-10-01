"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, KeyRound, Check } from "lucide-react";
import { getTeachers, createTeacher, updateTeacherPin } from "@/app/actions/admin";

type Teacher = { id: string; full_name: string; email: string | null };

export default function AdminTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pinEdit, setPinEdit] = useState<Record<string, string>>({});
  const [pinMsg, setPinMsg] = useState<Record<string, string>>({});

  useEffect(() => {
    getTeachers().then(setTeachers);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim()) return;
    setLoading(true);
    setError("");
    const res = await createTeacher(fullName, email, pin);
    if (!res.success) {
      setError(res.error || "Could not add teacher");
    } else {
      setFullName("");
      setEmail("");
      setPin("");
      setTeachers(await getTeachers());
    }
    setLoading(false);
  };

  const savePin = async (id: string) => {
    const res = await updateTeacherPin(id, pinEdit[id] || "");
    setPinMsg((m) => ({ ...m, [id]: res.success ? "PIN updated" : res.error || "Failed" }));
    if (res.success) setPinEdit((p) => ({ ...p, [id]: "" }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-900">Manage Teachers</h1>
        <p className="text-sm text-slate-500">Teachers you add here belong to your school and log in with their email and PIN.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-5 rounded-2xl border-2 border-slate-100 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <input
          type="text"
          aria-label="Teacher full name"
          placeholder="Teacher Full Name..."
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-slate-900 min-h-11"
        />
        <input
          type="email"
          aria-label="Teacher email"
          placeholder="Teacher Email..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-slate-900 min-h-11"
        />
        <input
          type="text"
          inputMode="numeric"
          aria-label="Teacher login PIN"
          placeholder="Login PIN (4–6 digits)"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-slate-900 min-h-11 tracking-widest"
        />
        <button
          type="submit"
          disabled={loading || !fullName.trim() || !email.trim() || pin.length < 4}
          className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-6 py-2 rounded-xl text-sm flex items-center justify-center gap-2 min-h-11"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add Teacher
        </button>
        {error && <p className="sm:col-span-4 text-sm font-semibold text-rose-700">{error}</p>}
      </form>

      <div className="bg-white rounded-2xl border-2 border-slate-100 overflow-hidden shadow-sm divide-y divide-slate-100">
        {teachers.length === 0 && <p className="p-4 text-sm text-slate-500">No teachers at your school yet.</p>}
        {teachers.map((t) => (
          <div key={t.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">{t.full_name}</h3>
              <p className="text-xs text-slate-500">{t.email}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <KeyRound className="w-4 h-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                inputMode="numeric"
                aria-label={`New PIN for ${t.full_name}`}
                placeholder="New PIN"
                value={pinEdit[t.id] || ""}
                onChange={(e) => setPinEdit((p) => ({ ...p, [t.id]: e.target.value.replace(/\D/g, "").slice(0, 6) }))}
                className="w-28 border border-slate-200 rounded-xl px-3 py-1.5 text-sm min-h-11 tracking-widest"
              />
              <button
                type="button"
                onClick={() => savePin(t.id)}
                disabled={(pinEdit[t.id] || "").length < 4}
                className="min-h-11 px-3 rounded-xl border-2 border-slate-200 text-sm font-semibold disabled:opacity-50 inline-flex items-center gap-1"
              >
                <Check className="w-4 h-4" /> Change PIN
              </button>
              {pinMsg[t.id] && <span className="text-xs font-semibold text-slate-600">{pinMsg[t.id]}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
