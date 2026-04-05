"use client";

import { useState } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface WordDetailCardProps {
  word: AnalyzedWord;
  onClose: () => void;
  onPractice: (word: AnalyzedWord) => void;
}

export function WordDetailCard({
  word,
  onClose,
  onPractice,
}: WordDetailCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);

  function playCorrect() {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    utterance.rate = 0.75;
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    speechSynthesis.speak(utterance);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="animate-slide-up bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-slate-800">{word.word}</h3>
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                word.status === Band.NEEDS_PRACTICE
                  ? "bg-rose-100 text-rose-600"
                  : "bg-amber-100 text-amber-600"
              }`}
            >
              {word.status === Band.NEEDS_PRACTICE
                ? "Needs practice"
                : "Improving"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Phonetic comparison — the key visual */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-3 font-semibold">
            Pronunciation comparison
          </p>

          {/* Your pronunciation */}
          <div className="flex items-center gap-3 mb-3">
            <span className="w-16 text-[10px] uppercase tracking-wide text-rose-400 font-semibold shrink-0">
              You said
            </span>
            <div className="flex-1">
              <span className="text-base font-semibold text-rose-700">
                {word.youSaid}
              </span>
              {word.youSaidIpa && (
                <span className="ml-2 text-sm font-mono text-rose-500 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                  {word.youSaidIpa}
                </span>
              )}
            </div>
          </div>

          {/* Divider with arrow */}
          <div className="flex items-center gap-2 ml-16 mb-3">
            <div className="flex-1 border-t border-dashed border-slate-200" />
            <span className="text-slate-300 text-xs">&#x2193;</span>
            <div className="flex-1 border-t border-dashed border-slate-200" />
          </div>

          {/* Correct pronunciation */}
          <div className="flex items-center gap-3">
            <span className="w-16 text-[10px] uppercase tracking-wide text-emerald-400 font-semibold shrink-0">
              Correct
            </span>
            <div className="flex-1">
              <span className="text-base font-semibold text-emerald-700">
                {word.word}
              </span>
              <span className="ml-2 text-sm font-mono text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                {word.ipa}
              </span>
            </div>
          </div>
        </div>

        {/* Syllable breakdown */}
        <div className="mb-4">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            Syllable breakdown
          </p>
          <div className="flex gap-1.5">
            {word.syllables.split("·").map((syl, i, arr) => (
              <span key={i} className="flex items-center gap-1.5">
                <span className="bg-indigo-50 text-indigo-700 font-mono text-base font-semibold px-3 py-1.5 rounded-lg border border-indigo-100">
                  {syl.trim()}
                </span>
                {i < arr.length - 1 && (
                  <span className="text-slate-300 text-xs">·</span>
                )}
              </span>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-100">
          <p className="text-[10px] uppercase tracking-wider text-amber-500 mb-1.5 font-semibold">
            How to say it
          </p>
          <p className="text-sm text-amber-800 leading-relaxed">{word.tip}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={playCorrect}
            disabled={isPlaying}
            className="flex-1 py-3.5 rounded-xl border-2 border-indigo-200 text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
            </svg>
            {isPlaying ? "Playing..." : "Hear correct"}
          </button>
          <button
            onClick={() => onPractice(word)}
            className="flex-1 py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-200"
          >
            Practice this word
          </button>
        </div>
      </div>
    </div>
  );
}
