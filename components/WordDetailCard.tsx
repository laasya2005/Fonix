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
  recordedAudioUrl,
  onClose,
  onPractice,
}: WordDetailCardProps) {
  const [playingWhat, setPlayingWhat] = useState<"yours" | "correct" | "rerecord" | null>(null);
  const [rerecordedUrl, setRerecordedUrl] = useState<string | null>(null);
  const [isRerecording, setIsRerecording] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  function stopAny() {
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setPlayingWhat(null);
  }

  // Play back original sentence recording (how user actually said it)
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

  // Play correct pronunciation via TTS
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

  // Play re-recorded single word
  function playRerecorded() {
    if (!rerecordedUrl) return;
    stopAny();
    setPlayingWhat("rerecord");
    const audio = new Audio(rerecordedUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }

  // Re-record just this word
  const startRerecord = useCallback(async () => {
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
        setRerecordedUrl(url);
        setIsRerecording(false);
        stream.getTracks().forEach((t) => t.stop());

        // Auto-play back
        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingWhat("rerecord");
        audio.onended = () => setPlayingWhat(null);
        audio.onerror = () => setPlayingWhat(null);
        audio.play();
      };

      setIsRerecording(true);
      recorder.start();
      setTimeout(() => {
        if (recorder.state === "recording") recorder.stop();
      }, 2000);
    } catch {
      // mic unavailable
    }
  }, []);

  const stopRerecord = useCallback(() => {
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

        {/* Try saying just this word */}
        <div className="bg-slate-50 rounded-xl p-4 mb-4 border border-slate-100">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2 font-semibold">
            Try saying just this word
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={isRerecording ? stopRerecord : startRerecord}
              disabled={playingWhat !== null}
              className={`flex-1 py-2.5 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
                isRerecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-indigo-100 text-indigo-600 hover:bg-indigo-200"
              }`}
            >
              {isRerecording ? (
                <>
                  <div className="w-2 h-2 bg-white rounded-full" />
                  Tap to stop
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                  </svg>
                  Say &ldquo;{word.word}&rdquo;
                </>
              )}
            </button>
            {rerecordedUrl && (
              <button
                onClick={playRerecorded}
                disabled={playingWhat !== null}
                className="py-2.5 px-3 rounded-lg bg-slate-200 text-slate-600 text-xs font-medium hover:bg-slate-300 transition-colors disabled:opacity-40 flex items-center gap-1.5"
              >
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
                {playingWhat === "rerecord" ? "Playing..." : "Replay"}
              </button>
            )}
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
