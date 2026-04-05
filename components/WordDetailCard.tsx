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
  const [isRecordingWord, setIsRecordingWord] = useState(false);
  const [wordAudioUrl, setWordAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Record just this one word
  const startWordRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];

      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "",
      ];
      const mimeType = mimeTypes.find(
        (t) => t === "" || MediaRecorder.isTypeSupported(t)
      );

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
        const blob = new Blob(chunksRef.current, {
          type: mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);
        setWordAudioUrl(url);
        setIsRecordingWord(false);
        stream.getTracks().forEach((t) => t.stop());

        // Auto-play back immediately so user hears themselves
        const audio = new Audio(url);
        audioRef.current = audio;
        setPlayingWhat("yours");
        audio.onended = () => setPlayingWhat(null);
        audio.onerror = () => setPlayingWhat(null);
        audio.play();
      };

      setIsRecordingWord(true);
      recorder.start();

      // Auto-stop after 2 seconds (enough for a single word)
      setTimeout(() => {
        if (recorder.state === "recording") {
          recorder.stop();
        }
      }, 2000);
    } catch {
      // Mic not available
    }
  }, []);

  const stopWordRecording = useCallback(() => {
    if (recorderRef.current && recorderRef.current.state === "recording") {
      recorderRef.current.stop();
    }
  }, []);

  function playYours() {
    if (!wordAudioUrl) return;
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setPlayingWhat("yours");
    const audio = new Audio(wordAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }

  function playCorrect() {
    if (!("speechSynthesis" in window)) return;
    if (audioRef.current) audioRef.current.pause();
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

            {/* Record & hear yourself say just this word */}
            {!wordAudioUrl ? (
              <button
                onClick={isRecordingWord ? stopWordRecording : startWordRecording}
                disabled={playingWhat !== null}
                className={`w-full py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors disabled:opacity-40 ${
                  isRecordingWord
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-rose-100 text-rose-600 hover:bg-rose-200"
                }`}
              >
                {isRecordingWord ? (
                  <>
                    <div className="w-2 h-2 bg-white rounded-full" />
                    Recording... tap to stop
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
            ) : (
              <div className="space-y-1.5">
                <button
                  onClick={playYours}
                  disabled={playingWhat !== null}
                  className="w-full py-2 rounded-lg bg-rose-100 text-rose-600 text-xs font-medium hover:bg-rose-200 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                  {playingWhat === "yours" ? "Playing..." : "Hear your voice"}
                </button>
                <button
                  onClick={() => { setWordAudioUrl(null); }}
                  className="w-full py-1.5 text-[10px] text-rose-400 hover:text-rose-600 transition-colors"
                >
                  Re-record
                </button>
              </div>
            )}
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
