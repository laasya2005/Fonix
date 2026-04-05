"use client";

import { useState, useRef, useCallback } from "react";
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
  onClose,
  onPractice,
}: WordDetailCardProps) {
  const [playingWhat, setPlayingWhat] = useState<"yours" | "correct" | null>(null);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function stopAny() {
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setPlayingWhat(null);
  }

  function playCorrect() {
    if (!("speechSynthesis" in window)) return;
    stopAny();
    setPlayingWhat("correct");
    const utterance = new SpeechSynthesisUtterance(word.word);
    utterance.lang = "en-US";
    utterance.rate = 0.75;
    utterance.onend = () => setPlayingWhat(null);
    utterance.onerror = () => setPlayingWhat(null);
    speechSynthesis.speak(utterance);
  }

  function playYours() {
    if (!wordAudioUrl) return;
    stopAny();
    setPlayingWhat("yours");
    const audio = new Audio(wordAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus", ""];
      const mimeType = mimeTypes.find((t) => t === "" || MediaRecorder.isTypeSupported(t));

      let recorder: MediaRecorder;
      try {
        recorder = mimeType
          ? new MediaRecorder(stream, { mimeType: mimeType || undefined })
          : new MediaRecorder(stream);
      } catch {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      recorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setWordAudioUrl(url);
        setIsRecording(false);
        stream.getTracks().forEach((t) => t.stop());

        // Auto-play back so user hears themselves immediately
        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingWhat("yours");
        audio.onended = () => setPlayingWhat(null);
        audio.onerror = () => setPlayingWhat(null);
        audio.play();
      };

      setIsRecording(true);
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 2000);
    } catch {
      // mic unavailable
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30">
      <div className="animate-slide-up bg-white rounded-t-2xl w-full max-w-lg p-6 shadow-xl max-h-[90vh] overflow-y-auto">
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

        {/* Step 1: Record yourself saying just this word */}
        <div className="bg-indigo-50 rounded-xl p-4 mb-4 border border-indigo-100">
          <p className="text-[10px] uppercase tracking-wider text-indigo-400 mb-3 font-semibold">
            Step 1 — Say &ldquo;{word.word}&rdquo;
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={isRecording ? stopRecording : startRecording}
              disabled={playingWhat !== null}
              className={`flex-1 py-3 rounded-lg text-sm font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-40 ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-indigo-500 text-white hover:bg-indigo-600 shadow-sm shadow-indigo-200"
              }`}
            >
              {isRecording ? (
                <>
                  <div className="w-2.5 h-2.5 bg-white rounded-full" />
                  Recording... tap to stop
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  {wordAudioUrl ? "Record again" : "Tap to record"}
                </>
              )}
            </button>
            {wordAudioUrl && (
              <button
                onClick={playYours}
                disabled={playingWhat !== null}
                className="py-3 px-4 rounded-lg bg-rose-100 text-rose-600 text-sm font-semibold hover:bg-rose-200 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {playingWhat === "yours" ? "Playing..." : "Hear yours"}
              </button>
            )}
          </div>
        </div>

        {/* Step 2: Compare with correct */}
        <div className="bg-emerald-50 rounded-xl p-4 mb-4 border border-emerald-100">
          <p className="text-[10px] uppercase tracking-wider text-emerald-400 mb-3 font-semibold">
            Step 2 — Compare with correct
          </p>
          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1">
              <p className="text-lg font-bold text-emerald-700">{word.word}</p>
              <p className="text-sm font-mono text-emerald-500">{word.ipa}</p>
            </div>
            <button
              onClick={playCorrect}
              disabled={playingWhat !== null}
              className="py-3 px-5 rounded-lg bg-emerald-100 text-emerald-600 text-sm font-semibold hover:bg-emerald-200 transition-colors disabled:opacity-40 flex items-center gap-1.5"
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
            <p className="text-base font-bold text-rose-700">{word.youSaid}</p>
            {word.youSaidIpa && <p className="text-xs font-mono text-rose-500 mt-0.5">{word.youSaidIpa}</p>}
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
          className="w-full py-3.5 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-semibold text-sm hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-lg shadow-indigo-200"
        >
          Practice this word
        </button>
      </div>
    </div>
  );
}
