"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, RotateCcw, Award, Loader2 } from "lucide-react";
import { submitScreeningAttempt, TaskSubmission } from "@/app/actions/screening";
import { SpeakButton, questionWithChoices } from "@/components/student/SpeakButton";

export interface ScreeningTask {
  id: string | number;
  domainId: string;
  domainName: string;
  prompt: string;
  visualCue: string;
  options: { id: string; text: string; emoji: string; isCorrect: boolean }[];
}


export function ScreeningClient({ tasks }: { tasks: ScreeningTask[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const taskStartTimeRef = useRef<number>(Date.now());
  const currentTask = tasks[currentIndex];
  const progressPercent = ((currentIndex + 1) / tasks.length) * 100;

  const handleNext = async () => {
    if (!selectedOption) return;
    const option = currentTask.options.find((opt) => opt.id === selectedOption);
    const isCorrect = !!option?.isCorrect;
    const elapsedSeconds = (Date.now() - taskStartTimeRef.current) / 1000;

    const newSubmissions = [
      ...submissions,
      {
        domainId: currentTask.domainId,
        isCorrect,
        responseTimeSeconds: Number(elapsedSeconds.toFixed(2)),
      },
    ];

    setSubmissions(newSubmissions);
    setSelectedOption(null);
    taskStartTimeRef.current = Date.now();

    if (currentIndex + 1 < tasks.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsSubmitting(true);
      await submitScreeningAttempt(newSubmissions);
      setIsSubmitting(false);
      setIsCompleted(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmissions([]);
    setIsCompleted(false);
    taskStartTimeRef.current = Date.now();
  };

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm space-y-6 text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
          <Award className="w-9 h-9" />
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Screening Complete! 🎉</h1>
          <p className="text-slate-600 text-base mt-2">
            Results successfully saved. Your personalized learning plan is ready.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 text-left space-y-3">
          <h2 className="font-bold text-slate-800 text-sm uppercase tracking-wider">
            Domain Results Overview
          </h2>
          <div className="divide-y divide-slate-200">
            {[...new Map(tasks.map((t) => [t.domainId, t])).values()].map((task) => {
              // one row per subject; a subject passes if most of its questions were right
              const mine = submissions.filter((s) => s.domainId === task.domainId);
              const passed = mine.length > 0 && mine.filter((s) => s.isCorrect).length * 2 >= mine.length;
              return (
                <div key={task.domainId} className="py-2.5 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-700">{task.domainName}</span>
                  <span
                    className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                      passed
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-amber-50 text-amber-700 border-amber-200"
                    }`}
                  >
                    {passed ? "Screened Adequate" : "Needs Practice"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/student/dashboard"
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-sm transition-all"
          >
            Go to Personalized Learning →
          </Link>
          <button
            onClick={handleReset}
            className="flex items-center justify-center gap-2 border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-3.5 rounded-2xl transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Retake Screening
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>{currentTask.domainName}</span>
          <span>Task {currentIndex + 1} of {tasks.length}</span>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-blue-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug">
            {currentTask.prompt}
          </h1>
          <SpeakButton
            label="Listen to question"
            text={questionWithChoices(currentTask.prompt, currentTask.options.map((o) => o.text))}
            className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl shrink-0"
          />
        </div>

        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-5xl">
          {currentTask.visualCue}
        </div>

        <div className="grid grid-cols-1 gap-3">
          {currentTask.options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-lg flex items-center justify-between transition-all ${
                  isSelected
                    ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span>{option.text}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedOption || isSubmitting}
          className={`w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all ${
            selectedOption && !isSubmitting
              ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer active:scale-98"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Saving Profile...
            </>
          ) : (
            <>
              {currentIndex + 1 === tasks.length ? "Finish Screening" : "Next Task"}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
