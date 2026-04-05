"use client";

import { useState, useRef } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface WordDetailCardProps {
  word: AnalyzedWord;
  recordedAudioUrl: string | null;
  onClose: () => void;
  onPractice: (word: AnalyzedWord) => void;
  sentenceText?: string;
}

export function WordDetailCard({
  word,
  recordedAudioUrl,
  onClose,
  onPractice,
  sentenceText,
}: WordDetailCardProps) {
  const [playingWhat, setPlayingWhat] = useState<"yours" | "correct" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stopAny() {
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setPlayingWhat(null);
  }

  function playYours() {
    if (!recordedAudioUrl) return;
    stopAny();
    setPlayingWhat("yours");
    const audio = new Audio(recordedAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }

  async function playCorrect() {
    stopAny();
    setPlayingWhat("correct");
    try {
      // Use OpenAI TTS for high-quality American pronunciation
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.word }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setPlayingWhat(null);
        audio.onerror = () => setPlayingWhat(null);
        audio.play();
        return;
      }
    } catch {
      // fall through to browser TTS
    }
    // Fallback to browser TTS
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word.word);
      utterance.lang = "en-US";
      utterance.rate = 0.75;
      utterance.onend = () => setPlayingWhat(null);
      utterance.onerror = () => setPlayingWhat(null);
      speechSynthesis.speak(utterance);
    } else {
      setPlayingWhat(null);
    }
  }

  // Highlight the focus word in the sentence text
  function renderSentenceWithHighlight() {
    if (!sentenceText) return null;
    const regex = new RegExp(`(\\b${word.word}\\b)`, "gi");
    const parts = sentenceText.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="bg-rose-200 text-rose-800 font-bold px-1 rounded">
          {part}
        </span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="animate-slide-up bg-white rounded-t-2xl w-full p-5 shadow-xl max-h-[85dvh] overflow-y-auto safe-bottom">
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
              {word.status === Band.NEEDS_PRACTICE ? "Needs practice" : "Improving"}
            </span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Your recording — full sentence with word highlighted */}
        <div className="bg-rose-50 rounded-xl p-4 mb-4 border border-rose-100">
          <p className="text-[10px] uppercase tracking-wider text-rose-400 mb-2 font-semibold">
            Your recording — listen for &ldquo;{word.word}&rdquo;
          </p>
          {sentenceText && (
            <p className="text-sm text-slate-600 leading-relaxed mb-3">
              {renderSentenceWithHighlight()}
            </p>
          )}
          <button
            onClick={playYours}
            disabled={!recordedAudioUrl || playingWhat !== null}
            className="w-full py-3 rounded-lg bg-rose-100 text-rose-700 text-sm font-semibold hover:bg-rose-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-2 active:scale-95 touch-manipulation"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
            {playingWhat === "yours"
              ? "Playing your recording..."
              : recordedAudioUrl
                ? "Hear your voice"
                : "No recording available"}
          </button>
        </div>

        {/* Correct pronunciation — just this word */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-100">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-2 font-semibold">
            Correct pronunciation
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-emerald-700">{word.word}</p>
              <p className="text-sm font-mono text-emerald-500">{word.ipa}</p>
            </div>
            <button
              onClick={playCorrect}
              disabled={playingWhat !== null}
              className="py-3 px-5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-40 flex items-center gap-2 active:scale-95 touch-manipulation"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
              </svg>
              {playingWhat === "correct" ? "Playing..." : "Hear correct"}
            </button>
          </div>
        </div>

        {/* Phonetic comparison */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-rose-50 rounded-xl p-3 border border-rose-100 text-center">
            <p className="text-[10px] uppercase tracking-wide text-rose-400 mb-1 font-semibold">You said</p>
            <p className="text-base font-bold text-rose-700">{word.youSaid || word.word}</p>
            <p className="text-xs font-mono text-rose-500 mt-0.5">{word.youSaidIpa || word.ipa}</p>
          </div>
          <div className="bg-emerald-50 rounded-xl p-3 border border-emerald-100 text-center">
            <p className="text-[10px] uppercase tracking-wide text-emerald-400 mb-1 font-semibold">Correct</p>
            <p className="text-base font-bold text-emerald-700">{word.word}</p>
            <p className="text-xs font-mono text-emerald-500 mt-0.5">{word.ipa}</p>
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
                {i < arr.length - 1 && <span className="text-slate-300 text-xs">·</span>}
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-200 active:scale-95 touch-manipulation"
        >
          Practice this word
        </button>
      </div>
    </div>
  );
}
