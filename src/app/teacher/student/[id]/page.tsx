"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Plus, Award, CheckCircle2, AlertCircle } from "lucide-react";
import { getStudentDetailForTeacher, addTeacherObservation } from "@/app/actions/portal";

const TEACHER_ID = "33333333-3333-3333-3333-333333333333";

export default function TeacherStudentProfilePage() {
  const params = useParams();
  const studentId = params.id as string;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [observationText, setObservationText] = useState("");
  const [selectedDomain, setSelectedDomain] = useState("money_shopping");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      if (!studentId) return;
      const res = await getStudentDetailForTeacher(studentId);
      setData(res);
      setLoading(false);
    }
    load();
  }, [studentId]);

  const handleAddObservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!observationText.trim()) return;

    setSaving(true);
    await addTeacherObservation({
      studentId,
      teacherId: TEACHER_ID,
      domainId: selectedDomain,
      observationText,
    });
    setObservationText("");
    const refreshed = await getStudentDetailForTeacher(studentId);
    setData(refreshed);
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-semibold">Loading student profile...</div>;

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

  return (
    <div className="space-y-8">
      {/* Top breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/teacher/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </Link>
        <Link
          href="/teacher/messages"
          className="inline-flex items-center gap-2 bg-purple-50 border border-purple-200 text-purple-700 font-bold px-4 py-2 rounded-xl text-sm hover:bg-purple-100"
        >
          <MessageSquare className="w-4 h-4" /> Message Parent
        </Link>
      </div>

      {/* Student Banner */}
      <div className="bg-white rounded-3xl p-6 border-2 border-slate-100 shadow-sm">
        <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Student Profile</span>
        <h1 className="text-3xl font-extrabold text-slate-900 mt-1">{data.student?.full_name}</h1>
        <p className="text-slate-500 text-sm font-medium mt-1">
          Parent: {data.student?.profiles?.full_name || "Not linked yet"}
          {data.student?.profiles?.email ? ` (${data.student.profiles.email})` : ""}
        </p>
      </div>

      {/* 8-Domain Screening Results */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Initial 8-Domain Screening Profile</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          {data.domainResults.map((item: any) => (
            <div key={item.id} className="bg-white p-4 rounded-2xl border-2 border-slate-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xl">{item.domains?.icon_emoji || "📚"}</span>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border ${
                  item.status === "screened_adequate"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : "bg-amber-50 text-amber-700 border-amber-200"
                }`}>
                  {item.status === "screened_adequate" ? "Adequate" : "Needs Practice"}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-sm">{item.domains?.name}</h3>
              <p className="text-xs text-slate-500">Score: {item.combined_score}% • {item.response_time_seconds}s</p>
            </div>
          ))}
        </div>
      </section>

      {/* Teacher Observations */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Teacher Observations & Notes</h2>
        
        {/* Add Observation Form */}
        <form onSubmit={handleAddObservation} className="bg-white p-5 rounded-2xl border-2 border-purple-100 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedDomain}
              onChange={(e) => setSelectedDomain(e.target.value)}
              className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-semibold text-slate-700 bg-white"
            >
              <option value="money_shopping">Money & Shopping</option>
              <option value="communication">Communication</option>
              <option value="daily_living">Daily Living</option>
              <option value="safety_emergency">Safety & Emergency</option>
              <option value="literacy_numeracy">Literacy & Numeracy</option>
            </select>
            <input
              type="text"
              placeholder="Add observation for parent and record (e.g. Practiced ₹20 notes successfully)..."
              value={observationText}
              onChange={(e) => setObservationText(e.target.value)}
              className="flex-1 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-purple-600"
            />
            <button
              type="submit"
              disabled={saving || !observationText.trim()}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold px-5 py-2 rounded-xl text-sm flex items-center justify-center gap-1 shrink-0"
            >
              <Plus className="w-4 h-4" /> {saving ? "Saving..." : "Add Note"}
            </button>
          </div>
        </form>

        {/* Existing Observations List */}
        <div className="space-y-3">
          {data.observations.map((obs: any) => (
            <div key={obs.id} className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-400 mb-1">
                <span className="text-purple-600 uppercase">{obs.domain_id?.replace("_", " ")}</span>
                <span>{new Date(obs.created_at).toLocaleDateString()}</span>
              </div>
              <p className="text-sm font-medium text-slate-800">{obs.observation_text}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
