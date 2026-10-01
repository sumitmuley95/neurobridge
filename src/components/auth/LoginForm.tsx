"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  GraduationCap, 
  Heart, 
  UserCheck, 
  School, 
  ArrowRight, 
  Phone, 
  User, 
  KeyRound,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import { 
  registerIndividualStudent, 
  loginStudent, 
  loginParent, 
  loginStaff 
} from "@/app/actions/auth";

type Role = "student" | "parent" | "teacher" | "admin";

// Full page replace (not an in-app push): the login page leaves history, and
// no client-side cache from a previous session survives.
function go(url: string) {
  window.location.replace(url);
}

export function LoginForm({ initialRole = "student", initialMode = "login" }: { initialRole?: Role; initialMode?: "login" | "signup" }) {
  const [selectedRole, setSelectedRole] = useState<Role>(initialRole);
  const [studentMode, setStudentMode] = useState<"login" | "signup">(initialMode);
  const [studentCategory, setStudentCategory] = useState<"individual" | "institutional">("individual");

  // Form State
  const [fullName, setFullName] = useState("");
  const [phoneOrCode, setPhoneOrCode] = useState("");
  const [pin, setPin] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    if (studentCategory === "individual" && studentMode === "signup") {
      const res = await registerIndividualStudent({ fullName, phone: phoneOrCode, accessPin: pin });
      if (res.success) {
        go(res.redirectTo || "/student/screening");
        return;
      } else {
        setErrorMsg(res.error || "Failed to create account");
      }
    } else {
      const res = await loginStudent(phoneOrCode, pin, studentCategory);
      if (res.success) {
        go(res.redirectTo || "/student/dashboard");
        return;
      } else {
        setErrorMsg(res.error || "Invalid student login");
      }
    }
    setLoading(false);
  };

  const handleParentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await loginParent(phoneOrCode, pin);
    if (res.success) {
      go(res.redirectTo || "/parent/dashboard");
      return;
    } else {
      setErrorMsg(res.error || "Parent login failed");
    }
    setLoading(false);
  };

  const handleStaffSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const res = await loginStaff(email, pin, selectedRole as "teacher" | "admin");
    if (res.success) {
      go(res.redirectTo || `/${selectedRole}/dashboard`);
      return;
    } else {
      setErrorMsg(res.error || "Login failed");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-indigo-50/40 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-900 min-h-11">
          <ArrowLeft className="w-4 h-4" aria-hidden="true" /> Back to home
        </Link>
        <div className="text-center space-y-2">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 bg-indigo-100 px-3 py-1 rounded-full inline-block">
            NeuroBridge Platform V2
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Adaptive Learning Portal
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Select your role to access your personalized dashboard.
          </p>
        </div>

        {/* 4-Role Navigation Tabs */}
        <div className="grid grid-cols-4 gap-1 p-1 bg-slate-200/90 rounded-2xl text-xs font-black">
          {[
            { id: "student", label: "Student", icon: GraduationCap },
            { id: "parent", label: "Parent", icon: Heart },
            { id: "teacher", label: "Teacher", icon: UserCheck },
            { id: "admin", label: "Admin", icon: School },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = selectedRole === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  setSelectedRole(tab.id as Role);
                  setErrorMsg("");
                }}
                className={`py-2.5 rounded-xl flex flex-col sm:flex-row items-center justify-center gap-1 transition-all ${
                  active ? "bg-white text-indigo-600 shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-slate-100 shadow-xl space-y-5">
          {errorMsg && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-2xl">
              ⚠️ {errorMsg}
            </div>
          )}

          {/* STUDENT FORM */}
          {selectedRole === "student" && (
            <form onSubmit={handleStudentSubmit} className="space-y-4">
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setStudentCategory("individual"); setStudentMode("login"); setErrorMsg(""); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    studentCategory === "individual" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  Individual Student
                </button>
                <button
                  type="button"
                  onClick={() => { setStudentCategory("institutional"); setStudentMode("login"); setErrorMsg(""); }}
                  className={`flex-1 py-1.5 rounded-lg transition-all ${
                    studentCategory === "institutional" ? "bg-white text-indigo-600 shadow-sm" : "text-slate-500"
                  }`}
                >
                  School / Institute
                </button>
              </div>

              {studentCategory === "individual" && (
                <div className="flex justify-center gap-4 text-xs font-bold pt-1">
                  <button
                    type="button"
                    onClick={() => { setStudentMode("login"); setErrorMsg(""); }}
                    className={studentMode === "login" ? "text-indigo-600 underline font-black" : "text-slate-400"}
                  >
                    Log In
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    type="button"
                    onClick={() => { setStudentMode("signup"); setErrorMsg(""); }}
                    className={studentMode === "signup" ? "text-indigo-600 underline font-black" : "text-slate-400"}
                  >
                    New Sign Up
                  </button>
                </div>
              )}

              {studentMode === "signup" && studentCategory === "individual" && (
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Student Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Yash Patel"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {studentCategory === "institutional" ? "School Enrollment Code or Name" : "Phone Number or Code"}
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder={studentCategory === "institutional" ? "e.g. Rahul Sharma or SCH-9021" : "e.g. 9876543210"}
                    value={phoneOrCode}
                    onChange={(e) => setPhoneOrCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Access PIN</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="4-digit PIN (e.g. 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : studentMode === "signup" ? "Create Account & Start Screening" : "Enter Student Mode"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* PARENT FORM (Uses Child's Phone/Code + PIN) */}
          {selectedRole === "parent" && (
            <form onSubmit={handleParentSubmit} className="space-y-4">
              <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-100 text-xs font-semibold text-emerald-800">
                Log in with your child&apos;s Phone Number or Enrollment Code and Access PIN.
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Child&apos;s Phone / Enrollment Code / Name</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. 9876543210 or Rahul Sharma"
                    value={phoneOrCode}
                    onChange={(e) => setPhoneOrCode(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">Child&apos;s Access PIN</label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    maxLength={6}
                    placeholder="4-digit PIN (e.g. 1234)"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-emerald-600 focus:outline-none tracking-widest"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Access Parent Dashboard"}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* TEACHER / ADMIN FORM */}
          {(selectedRole === "teacher" || selectedRole === "admin") && (
            <form onSubmit={handleStaffSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {selectedRole === "teacher" ? "Teacher Email" : "Admin Email"}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder={selectedRole === "teacher" ? "priya@neurobridge.demo" : "admin@yourschool.com"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">
                  {selectedRole === "teacher" ? "Teacher PIN" : "Admin PIN"}
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="password"
                    required
                    placeholder="Your PIN"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:border-indigo-600 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-3.5 rounded-2xl transition-all shadow-md flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Access ${selectedRole === "teacher" ? "Teacher" : "Admin"} Portal`}
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
