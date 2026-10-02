"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Lightbulb, 
  ArrowRight, 
  CheckCircle2, 
  RotateCcw, 
  Loader2,
  Sparkles,
  ArrowLeft
} from "lucide-react";
import { getActivityById, submitActivityAttempt } from "@/app/actions/learning";
import { SpeakButton, questionWithChoices } from "@/components/student/SpeakButton";

interface ActivityData {
  id: string;
  skill_id: string;
  domain_id: string;
  title: string;
  description: string;
  prompt: string;
  helper_audio_text: string;
  visual_cue: string;
  options: { id: string; text: string; emoji: string }[];
  hint: string;
  domains?: { name: string };
}

export default function ActivityPlayerPage() {
  const params = useParams();
  const activityId = params.id as string;

  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [promptingLevel, setPromptingLevel] = useState(0);
  const [attemptsCount, setAttemptsCount] = useState(1);
  const [feedback, setFeedback] = useState<"idle" | "correct" | "incorrect">("idle");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    async function load() {
      if (!activityId) return;
      const data = await getActivityById(activityId);
      setActivity(data as unknown as ActivityData | null);
      setLoading(false);
      startTimeRef.current = Date.now();
    }
    load();
  }, [activityId]);

  const handleUseHint = () => {
    setShowHint(true);
    setPromptingLevel(1);
  };

    const handleCheckAnswer = async () => {
    if (!selectedOption || !activity) return;
    setIsSubmitting(true);
    const elapsedSeconds = (Date.now() - startTimeRef.current) / 1000;
    const res = await submitActivityAttempt({
      activityId: activity.id,
      selectedOption,
      attemptsCount,
      promptingLevel,
      responseTimeSeconds: Number(elapsedSeconds.toFixed(2)),
    });
    setIsSubmitting(false);

    if (res.success && res.isCorrect) {
      setFeedback("correct");
    } else {
      setFeedback("incorrect");
      setAttemptsCount((prev) => prev + 1);
    }
  };

  const handleRetry = () => {
    setSelectedOption(null);
    setFeedback("idle");
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-500">Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-md mx-auto text-center p-8 bg-white rounded-3xl border-2 border-slate-100 space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Activity Not Found</h2>
        <p className="text-sm text-slate-500">The requested learning task could not be loaded.</p>
        <Link href="/student/dashboard" className="inline-block bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl">
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/student/dashboard"
          className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Exit to Dashboard
        </Link>
        <span className="text-xs font-extrabold uppercase tracking-widest bg-blue-100 text-blue-800 px-3 py-1 rounded-xl">
          {activity.domains?.name || "Learning Task"}
        </span>
      </div>

      <div className="bg-white rounded-3xl p-8 border-2 border-slate-100 shadow-sm space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Practice Task</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-snug mt-1">
              {activity.prompt}
            </h1>
          </div>
          <SpeakButton
            label="Listen to prompt"
            text={questionWithChoices(
              activity.prompt,
              activity.options.map((o) => o.text),
              activity.helper_audio_text && activity.helper_audio_text !== activity.prompt
                ? activity.helper_audio_text
                : undefined
            )}
            className="p-3 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl shrink-0 transition-colors"
          />
        </div>

        <div className="p-8 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-center text-5xl">
          {activity.visual_cue}
        </div>

        {showHint ? (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <Lightbulb className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 text-sm">Helpful Hint:</span>
              <p className="text-amber-800 text-sm mt-0.5">{activity.hint}</p>
            </div>
          </div>
        ) : (
          <button
            onClick={handleUseHint}
            className="inline-flex items-center gap-2 text-sm font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-4 py-2 rounded-xl transition-all"
          >
            <Lightbulb className="w-4 h-4 text-amber-600" />
            Need a hint?
          </button>
        )}

        <div className="grid grid-cols-1 gap-3">
          {activity.options.map((option) => {
            const isSelected = selectedOption === option.id;
            return (
              <button
                key={option.id}
                onClick={() => {
                  if (feedback !== "correct") setSelectedOption(option.id);
                }}
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

        {feedback === "correct" ? (
          <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-6 text-center space-y-4">
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-emerald-900">🎉 Great Job!</h2>
              <p className="text-sm font-semibold text-emerald-700 mt-1">
                You completed this task. Progress has been saved.
              </p>
            </div>
            <Link
              href="/student/dashboard"
              className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-8 py-3.5 rounded-2xl shadow-md transition-all w-full sm:w-auto"
            >
              Continue Learning <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        ) : feedback === "incorrect" ? (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-amber-900 text-base">Let's try again! 💡</h3>
              <p className="text-sm text-amber-700">Take your time and look closely at the hint.</p>
            </div>
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded-xl transition-all"
            >
              <RotateCcw className="w-4 h-4" /> Try Again
            </button>
          </div>
        ) : (
          <button
            onClick={handleCheckAnswer}
            disabled={!selectedOption || isSubmitting}
            className={`w-full py-4 rounded-2xl font-extrabold text-lg flex items-center justify-center gap-2 transition-all ${
              selectedOption && !isSubmitting
                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md cursor-pointer active:scale-98"
                : "bg-slate-200 text-slate-400 cursor-not-allowed"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" /> Checking...
              </>
            ) : (
              <>
                Check Answer <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
