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
  const [playingWhat, setPlayingWhat] = useState<"yours" | "correct" | null>(
    null
  );

  function speak(text: string, which: "yours" | "correct") {
    if (!("speechSynthesis" in window)) return;
    speechSynthesis.cancel();
    setPlayingWhat(which);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = which === "correct" ? 0.8 : 1.0;
    utterance.onend = () => setPlayingWhat(null);
    utterance.onerror = () => setPlayingWhat(null);
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

        {/* Pronunciation comparison: You said vs Correct */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* What you said */}
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <p className="text-[10px] uppercase tracking-wide text-rose-400 mb-1.5">
              You said
            </p>
            <p className="text-lg font-bold text-rose-700 mb-1">
              {word.youSaid}
            </p>
            <p className="text-sm font-mono text-rose-500 mb-3">
              {word.youSaidIpa || "—"}
            </p>
            <button
              onClick={() => speak(word.youSaid, "yours")}
              disabled={playingWhat !== null}
              className="w-full py-2 rounded-lg bg-rose-100 text-rose-600 text-xs font-medium hover:bg-rose-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {playingWhat === "yours" ? "Playing..." : "Hear yours"}
            </button>
          </div>

          {/* Correct pronunciation */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-1.5">
              Correct
            </p>
            <p className="text-lg font-bold text-emerald-700 mb-1">
              {word.word}
            </p>
            <p className="text-sm font-mono text-emerald-500 mb-3">
              {word.ipa}
            </p>
            <button
              onClick={() => speak(word.word, "correct")}
              disabled={playingWhat !== null}
              className="w-full py-2 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-medium hover:bg-emerald-200 transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {playingWhat === "correct" ? "Playing..." : "Hear correct"}
            </button>
          </div>
        </div>

        {/* Syllable breakdown */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">
            Syllables
          </span>
          <div className="flex gap-1">
            {word.syllables.split("·").map((syl, i) => (
              <span
                key={i}
                className="bg-indigo-50 text-indigo-700 font-mono text-sm px-2 py-0.5 rounded-md border border-indigo-100"
              >
                {syl}
              </span>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div className="bg-amber-50 rounded-xl p-4 mb-5 border border-amber-100">
          <div className="flex items-start gap-2">
            <span className="text-amber-500 text-lg leading-none mt-0.5">
              &#x1F4A1;
            </span>
            <p className="text-sm text-amber-800 leading-relaxed">{word.tip}</p>
          </div>
        </div>

        {/* Practice CTA */}
        <button
          onClick={() => onPractice(word)}
          className="w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Practice this word
        </button>
      </div>
    </div>
  );
}
