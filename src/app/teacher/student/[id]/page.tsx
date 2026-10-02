"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Plus, Loader2 } from "lucide-react";
import { getStudentDetailForTeacher, addTeacherObservation } from "@/app/actions/portal";

type Domain = { id: string; name: string; icon_emoji: string | null };
type Detail = Awaited<ReturnType<typeof getStudentDetailForTeacher>>;

const MAX_NOTE_LEN = 2000;

export default function TeacherStudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;

  const [data, setData] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [observationText, setObservationText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await getStudentDetailForTeacher(studentId);
    setData(res);
    // Default to the first subject that needs practice, otherwise the first subject
    const needs = (res.domainResults as { domain_id: string; status: string }[]).find(
      (r) => r.status === "needs_practice"
    );
    setSelectedDomain((cur) => cur || needs?.domain_id || res.domains[0]?.id || "");
    setLoading(false);
  }, [studentId]);

  useEffect(() => {
    if (studentId) load();
  }, [studentId, load]);

  const domainName = (id: string) => {
    const d = (data?.domains as Domain[] | undefined)?.find((x) => x.id === id);
    return d ? `${d.icon_emoji ?? ""} ${d.name}`.trim() : id.replace(/_/g, " ");
  };

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationText.trim() || !selectedDomain) return;

    setSaving(true);
    setMsg(null);
    const res = await addTeacherObservation({
      studentId,
      domainId: selectedDomain,
      observationText,
    });
    if (res.success) {
      setObservationText("");
      setMsg({ ok: true, text: "Note saved. The parent can see it on their dashboard." });
      await load();
    } else {
      setMsg({ ok: false, text: res.error || "Could not save the note. Please try again." });
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-semibold">Loading student profile...</div>;
  }

  if (!data?.student) {
    return (
      <div className="max-w-md mx-auto bg-white rounded-3xl p-8 border-2 border-slate-100 space-y-3">
        <h1 className="text-xl font-bold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-500">{data?.error || "This student could not be found."}</p>
        <Link href="/teacher/dashboard" className="inline-flex min-h-11 items-center font-bold text-purple-700">
          Back to your students
        </Link>
      </div>
    );
  }

  const student = data.student as unknown as {
    full_name: string;
    profiles?: { full_name: string; email: string | null } | null;
  };
  const domains = data.domains as Domain[];
  const domainResults = data.domainResults as {
    id: string;
    domain_id: string;
    status: string;
    combined_score: number;
    response_time_seconds: number;
    domains?: { name: string; icon_emoji: string | null } | null;
  }[];
  const observations = data.observations as {
    id: string;
    domain_id: string;
    observation_text: string;
    created_at: string;
    profiles?: { full_name: string } | null;
  }[];

  return (
    <div className="space-y-8">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800 min-h-11"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to Students
        </Link>
        <Link
          href="/teacher/messages"
          className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 font-bold px-4 min-h-11 rounded-xl text-sm hover:bg-purple-100"
        >
          <MessageSquare className="w-4 h-4" aria-hidden="true" /> Message Parent
        </Link>
      </div>

      {/* Student banner */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm">
        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Student Profile</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{student.full_name}</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Parent: {student.profiles?.full_name || "Not linked yet"}
          {student.profiles?.email ? ` (${student.profiles.email})` : ""}
        </p>
      </div>

      {/* Screening results */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Screening & Progress Profile</h2>
        {domainResults.length === 0 ? (
          <p className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm text-slate-600">
            This student hasn&apos;t taken the screening yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {domainResults.map((item) => (
              <div key={item.id} className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xl" aria-hidden="true">{item.domains?.icon_emoji || "📚"}</span>
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                      item.status === "screened_adequate"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {item.status === "screened_adequate" ? "Adequate" : "Needs Practice"}
                  </span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{item.domains?.name}</h3>
                <p className="text-xs text-slate-500">
                  Score: {item.combined_score}% • {item.response_time_seconds}s
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Observations */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Teacher Observations & Notes</h2>

        <form
          onSubmit={handleAddObservation}
          className="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-sm space-y-3"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="sr-only" htmlFor="obs-domain">Subject</label>
            <select
              id="obs-domain"
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 min-h-11 text-sm font-semibold text-slate-700 bg-white"
            >
              {domains.length === 0 && <option value="">No subjects available</option>}
              {domains.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.icon_emoji} {d.name}
                </option>
              ))}
            </select>
            <label className="sr-only" htmlFor="obs-text">Observation</label>
            <input
              id="obs-text"
              type="text"
              maxLength={MAX_NOTE_LEN}
              placeholder="e.g. Practiced paying with ₹20 notes independently today"
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 min-h-11 text-sm focus:outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              disabled={saving || !observationText.trim() || !selectedDomain}
              className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-bold px-5 min-h-11 rounded-xl text-sm flex items-center justify-center gap-1 shrink-0"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Plus className="w-4 h-4" aria-hidden="true" />}
              {saving ? "Saving..." : "Add Note"}
            </button>
          </div>
          {msg && (
            <p role="status" className={`text-sm font-semibold ${msg.ok ? "text-emerald-700" : "text-rose-700"}`}>
              {msg.text}
            </p>
          )}
        </form>

        <div className="space-y-3">
          {observations.length === 0 && <p className="text-sm text-slate-500">No notes yet.</p>}
          {observations.map((obs) => (
            <div key={obs.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-slate-400 mb-1">
                <span className="text-purple-600">{domainName(obs.domain_id)}</span>
                <span>
                  {obs.profiles?.full_name ? `${obs.profiles.full_name} · ` : ""}
                  {new Date(obs.created_at).toLocaleDateString("en-IN")}
                </span>
              </div>
              <p className="text-sm font-medium text-slate-800">{obs.observation_text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}