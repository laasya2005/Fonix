"use client";

import { Band } from "@/lib/types";
import { getProgress, getStruggledWords } from "@/lib/progress";

interface ProgressDashboardProps {
  onClose: () => void;
}

const TAG_LABELS: Record<string, string> = {
  FLAP_T: "Soft T sounds",
  VOWEL_SHIFT: "Vowel sounds",
  TH_SOUND: "TH sounds",
  STRESS_PATTERN: "Word stress",
  FINAL_CONSONANT: "Ending sounds",
  R_L_DISTINCTION: "R vs L",
  V_W_DISTINCTION: "V vs W",
  VOWEL_REDUCTION: "Reduced vowels",
};

export function ProgressDashboard({ onClose }: ProgressDashboardProps) {
  const progress = getProgress();
  const struggled = getStruggledWords();

  const tagCounts: Record<string, number> = {};
  for (const word of struggled) {
    for (const tag of word.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="bg-white p-5 min-h-[calc(100vh-72px)]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-slate-800">Your Progress</h2>
        <button
          onClick={onClose}
          className="text-sm text-slate-400 hover:text-slate-600"
        >
          Close
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">
            {progress.sentencesCompleted.length}
          </p>
          <p className="text-xs text-indigo-500">Sentences</p>
        </div>
        <div className="bg-indigo-50 rounded-xl p-3 text-center">
          <p className="text-2xl font-bold text-indigo-700">
            {Object.keys(progress.wordsAttempted).length}
          </p>
          <p className="text-xs text-indigo-500">Words practiced</p>
        </div>
      </div>

      {topTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            Areas to improve
          </h3>
          <div className="flex flex-wrap gap-2">
            {topTags.map(([tag, count]) => (
              <span
                key={tag}
                className="text-xs bg-amber-50 text-amber-700 px-2 py-1 rounded-full"
              >
                {TAG_LABELS[tag] || tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {struggled.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-slate-600 mb-2">
            Words to practice
          </h3>
          <div className="space-y-2">
            {struggled.slice(0, 8).map((w) => (
              <div
                key={w.word}
                className="flex items-center justify-between py-1"
              >
                <span className="text-sm font-medium text-slate-700">
                  {w.word}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">
                    {w.attempts} attempts
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      w.band === Band.NEEDS_PRACTICE
                        ? "bg-rose-100 text-rose-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {w.band === Band.NEEDS_PRACTICE
                      ? "Needs practice"
                      : "Improving"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {struggled.length === 0 && (
        <p className="text-sm text-slate-400 text-center py-4">
          No data yet. Complete some sentences to see your progress!
        </p>
      )}
    </div>
  );
}
