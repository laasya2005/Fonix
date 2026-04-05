"use client";

import { useState, useRef } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface WordDetailCardProps {
  word: AnalyzedWord;
  recordedAudioUrl: string | null;
  onClose: () => void;
  onPractice: (word: AnalyzedWord) => void;
}

export function WordDetailCard({
  word,
  recordedAudioUrl,
  onClose,
  onPractice,
}: WordDetailCardProps) {
  const [playingWhat, setPlayingWhat] = useState<"yours" | "correct" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function playYours() {
    if (!recordedAudioUrl) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setPlayingWhat("yours");
    const audio = new Audio(recordedAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }

  function playCorrect() {
    if (!("speechSynthesis" in window)) return;
    if (audioRef.current) {
      audioRef.current.pause();
    }
    speechSynthesis.cancel();
    setPlayingWhat("correct");
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    utterance.rate = 0.75;
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

        {/* Pronunciation comparison side by side */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Your pronunciation */}
          <div className="bg-rose-50 rounded-xl p-4 border border-rose-100">
            <p className="text-[10px] uppercase tracking-wide text-rose-400 mb-1.5 font-semibold">
              You said
            </p>
            <p className="text-lg font-bold text-rose-700 mb-0.5">
              {word.youSaid}
            </p>
            {word.youSaidIpa && (
              <p className="text-sm font-mono text-rose-500 mb-3">
                {word.youSaidIpa}
              </p>
            )}
            {!word.youSaidIpa && <div className="mb-3" />}
            <button
              onClick={playYours}
              disabled={!recordedAudioUrl || playingWhat !== null}
              className="w-full py-2 rounded-lg bg-rose-100 text-rose-600 text-xs font-medium hover:bg-rose-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {playingWhat === "yours"
                ? "Playing..."
                : recordedAudioUrl
                  ? "Hear your voice"
                  : "No recording"}
            </button>
          </div>

          {/* Correct pronunciation */}
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-1.5 font-semibold">
              Correct
            </p>
            <p className="text-lg font-bold text-emerald-700 mb-0.5">
              {word.word}
            </p>
            <p className="text-sm font-mono text-emerald-500 mb-3">
              {word.ipa}
            </p>
            <button
              onClick={playCorrect}
              disabled={playingWhat !== null}
              className="w-full py-2 rounded-lg bg-emerald-100 text-emerald-600 text-xs font-medium hover:bg-emerald-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
              {playingWhat === "correct" ? "Playing..." : "Hear correct"}
            </button>
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
