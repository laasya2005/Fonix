"use client";

import type { AnalyzedWord } from "@/lib/types";

interface ResultsSummaryProps {
  analyzedWords: AnalyzedWord[];
  summary: string;
  encouragement: string;
  allCorrect: boolean;
  onNextSentence: () => void;
}

export function ResultsSummary({
  analyzedWords,
  summary,
  encouragement,
  allCorrect,
  onNextSentence,
}: ResultsSummaryProps) {
  if (allCorrect) {
    return (
      <div className="mt-4 p-4 bg-indigo-50 rounded-xl text-center">
        <p className="text-indigo-800 font-semibold mb-1">
          Great job! Every word was clear.
        </p>
        <p className="text-sm text-indigo-600 mb-4">Keep up the great work!</p>
        <button
          onClick={onNextSentence}
          className="w-full py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm"
        >
          Next sentence
        </button>
      </div>
    );
  }

  const practiceWords = analyzedWords
    .filter((w) => w.shouldPractice)
    .map((w) => w.word);

  return (
    <div className="mt-4 space-y-3">
      <div className="p-3 bg-indigo-50 rounded-xl">
        <p className="text-sm text-indigo-700">{encouragement}</p>
      </div>

      {practiceWords.length > 0 && (
        <div className="p-3 bg-amber-50 rounded-xl">
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Focus on: </span>
            {practiceWords.join(", ")}
          </p>
          <p className="text-xs text-amber-600 mt-1">{summary}</p>
        </div>
      )}

      <button
        onClick={onNextSentence}
        className="w-full py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors"
      >
        Next sentence
      </button>
    </div>
  );
}
