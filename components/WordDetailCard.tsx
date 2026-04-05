"use client";

import { useState } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";
import { getCachedTts, cacheTts } from "@/lib/tts-cache";

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

  async function playPronunciation() {
    setIsPlaying(true);

    let base64Audio = getCachedTts(word.word, "us");

    if (!base64Audio) {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.word, accent: "us" }),
      });
      const data = await res.json();
      base64Audio = data.audio;
      cacheTts(word.word, "us", base64Audio!);
    }

    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    audio.play();
  }

  const statusColor =
    word.status === Band.NEEDS_PRACTICE
      ? "text-rose-600 bg-rose-50"
      : "text-amber-600 bg-amber-50";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20">
      <div className="animate-slide-up bg-white rounded-t-2xl w-full max-w-md p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-800">{word.word}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-rose-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wide text-rose-400 mb-1">
              You said
            </p>
            <p className="text-base font-semibold text-rose-700">
              {word.youSaid}
            </p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-1">
              Correct
            </p>
            <p className="text-base font-semibold text-emerald-700">
              {word.word}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <span className="text-indigo-600 font-mono text-sm bg-indigo-50 px-2 py-1 rounded">
            {word.ipa}
          </span>
          <span className="text-slate-500 text-sm">{word.syllables}</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 mb-4">
          <p className="text-sm text-slate-700">{word.tip}</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={playPronunciation}
            disabled={isPlaying}
            className="flex-1 py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50 transition-colors disabled:opacity-50"
          >
            {isPlaying ? "Playing..." : "Hear it"}
          </button>
          <button
            onClick={() => onPractice(word)}
            className="flex-1 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-200"
          >
            Practice
          </button>
        </div>
      </div>
    </div>
  );
}
