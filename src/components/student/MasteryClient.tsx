"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  CheckCircle2, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  AlertTriangle,
  Loader2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import type { MasteryQuestion } from "@/lib/data/mastery-questions";
import { submitUnitMasteryCheck } from "@/app/actions/mastery";
import { SpeakButton, questionWithChoices } from "@/components/student/SpeakButton";

export function MasteryClient({ questions }: { questions: MasteryQuestion[] }) {
  const params = useParams();
  const router = useRouter();
  const domainId = params.domain as string;


  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [answers, setAnswers] = useState<{ isCorrect: boolean }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{
    passed: boolean;
    scorePercentage: number;
    correctCount: number;
    totalQuestions: number;
  } | null>(null);

  const currentQ = questions[currentIndex];
  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  const handleNext = async () => {
    if (!selectedOption) return;
    const isCorrect = selectedOption === currentQ.correctAnswer;
    const updatedAnswers = [...answers, { isCorrect }];

    setAnswers(updatedAnswers);
    setSelectedOption(null);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // Quiz complete -> submit score
      setIsSubmitting(true);
      const correctCount = updatedAnswers.filter((a) => a.isCorrect).length;
      const res = await submitUnitMasteryCheck(domainId, questions.length, correctCount);
      setResult(res);
      setIsSubmitting(false);
    }
  };

  // PASS SCREEN
  if (result && result.passed) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border-2 border-emerald-100 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <Award className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 inline-block">
            Mastery Verified 🏆
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900">
            Unit Passed! 🎉
          </h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            You scored <span className="font-extrabold text-emerald-600">{result.scorePercentage}%</span> ({result.correctCount}/{result.totalQuestions} correct). This unit has been marked as <span className="font-extrabold text-purple-700">Mastered</span>!
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/student/dashboard"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-8 py-4 rounded-2xl shadow-md transition-all text-base active:scale-95"
          >
            Go to Dashboard →
          </Link>
          <Link
            href="/student/learning"
            className="border-2 border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-4 rounded-2xl transition-all text-sm"
          >
            Choose Next Unit
          </Link>
        </div>
      </div>
    );
  }

  // FAIL SCREEN (Reset Path Enforced)
  if (result && !result.passed) {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 sm:p-10 border-2 border-amber-100 shadow-xl text-center space-y-6">
        <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
          <RotateCcw className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 inline-block">
            Practice Needed
          </span>
          <h1 className="text-3xl font-black text-slate-900">
            Let's Try Again! 💪
          </h1>
          <p className="text-slate-600 text-sm max-w-sm mx-auto">
            You scored <span className="font-bold text-amber-600">{result.scorePercentage}%</span>. A passing score of 70% is required. Your 5 video lessons have been reset so you can review.
          </p>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs font-semibold text-amber-900 text-left flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <span>Don't worry! Watch the 5 video lessons again sequentially to prepare for your next attempt.</span>
        </div>

        <div className="pt-2">
          <Link
            href={`/student/learning/${domainId}`}
            className="inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black px-8 py-4 rounded-2xl shadow-md transition-all text-base w-full active:scale-95"
          >
            <RotateCcw className="w-5 h-5" /> Restart Video Lessons (Lesson 1)
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-16">
      {/* Header Bar */}
      <div className="flex items-center justify-between">
        <Link
          href={`/student/learning/${domainId}`}
          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-4 h-4" /> Exit Test
        </Link>
        <span className="text-xs font-black uppercase tracking-widest bg-purple-100 text-purple-800 px-3 py-1 rounded-xl">
          Unit Mastery Check
        </span>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-slate-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progressPercent)}%</span>
        </div>
        <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
          <div
            className="bg-purple-600 h-full transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Assessment Question</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug mt-1">
              {currentQ.prompt}
            </h1>
          </div>
          <SpeakButton
            label="Listen to question"
            text={questionWithChoices(
              currentQ.prompt,
              currentQ.options.map((o) => o.text),
              currentQ.subText ? `The picture says: ${currentQ.subText}` : undefined
            )}
            className="p-3 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-2xl shrink-0 transition-colors"
          />
        </div>

        {/* Render High Quality PDF Image with Emoji Fallback */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center justify-center text-center space-y-3">
          {currentQ.imageSrc ? (
            <div className="relative w-full max-w-md h-56 sm:h-64 rounded-xl overflow-hidden shadow-sm bg-white border border-slate-200 flex items-center justify-center">
              <img
                src={currentQ.imageSrc}
                alt={currentQ.prompt}
                className="w-full h-full object-contain p-2"
                onError={(e) => {
                  // Fallback to emoji if image file is not yet placed
                  e.currentTarget.style.display = "none";
                  const fallbackEl = e.currentTarget.parentElement?.querySelector(".fallback-emoji");
                  if (fallbackEl) (fallbackEl as HTMLElement).style.display = "block";
                }}
              />
              <div className="fallback-emoji text-6xl hidden">
                {currentQ.visualEmoji || "❓"}
              </div>
            </div>
          ) : (
            <div className="text-6xl">{currentQ.visualEmoji}</div>
          )}

          {currentQ.subText && (
            <span className="text-xs font-extrabold text-slate-700 bg-white px-3.5 py-1.5 rounded-xl border border-slate-200 shadow-xs">
              {currentQ.subText}
            </span>
          )}
        </div>

        {/* Multiple Choice Options */}
        <div className="grid grid-cols-1 gap-3">
          {currentQ.options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`w-full p-4 rounded-2xl border-2 text-left font-bold text-lg flex items-center justify-between transition-all ${
                  isSelected
                    ? "border-purple-600 bg-purple-50 text-purple-950 shadow-sm"
                    : "border-slate-200 hover:border-slate-300 bg-white text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{option.emoji}</span>
                  <span>{option.text}</span>
                </div>
                {isSelected && <CheckCircle2 className="w-6 h-6 text-purple-600" />}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={!selectedOption || isSubmitting}
          className={`w-full py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 transition-all ${
            selectedOption && !isSubmitting
              ? "bg-purple-600 hover:bg-purple-700 text-white shadow-md cursor-pointer active:scale-98"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" /> Evaluating Score...
            </>
          ) : (
            <>
              {currentIndex + 1 === questions.length ? "Submit Mastery Check" : "Next Question"}
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
