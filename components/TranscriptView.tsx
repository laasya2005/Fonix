"use client";

import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface TranscriptViewProps {
  interimText: string;
  isRecording: boolean;
  tokens: string[];
  analyzedWords: AnalyzedWord[];
  isAnalyzing: boolean;
  onWordClick: (word: AnalyzedWord) => void;
}

export function TranscriptView({
  interimText,
  isRecording,
  tokens,
  analyzedWords,
  isAnalyzing,
  onWordClick,
}: TranscriptViewProps) {
  if (isRecording) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400 mb-2">You&apos;re saying:</p>
        <p className="text-base text-slate-600 italic min-h-[2rem]">
          {interimText || "..."}
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div className="border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400 mb-2">Analyzing...</p>
        <div className="flex gap-1">
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.1s]" />
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]" />
        </div>
      </div>
    );
  }

  if (analyzedWords.length === 0 && tokens.length === 0) {
    return null;
  }

  const wordMap = new Map<number, AnalyzedWord>();
  for (const w of analyzedWords) {
    wordMap.set(w.index, w);
  }

  return (
    <div className="border-t border-slate-100 pt-4">
      <p className="text-xs text-slate-400 mb-2">Your attempt:</p>
      <p className="text-base leading-loose">
        {tokens.map((token, i) => {
          const analyzed = wordMap.get(i);
          if (!analyzed) {
            return (
              <span key={i} className="text-slate-800">
                {token}{" "}
              </span>
            );
          }

          const isNeedsPractice = analyzed.status === Band.NEEDS_PRACTICE;
          const colorClass = isNeedsPractice
            ? "bg-rose-100 text-rose-700 hover:bg-rose-200"
            : "bg-amber-50 text-amber-700 hover:bg-amber-100";

          return (
            <button
              key={i}
              onClick={() => onWordClick(analyzed)}
              className={`${colorClass} px-1.5 py-0.5 rounded-md cursor-pointer transition-colors text-base font-medium inline-flex items-center gap-1`}
            >
              {token}
              <span className="text-[10px] opacity-60">
                {isNeedsPractice ? "Practice" : "Review"}
              </span>
            </button>
          );
        })}
      </p>
    </div>
  );
}
