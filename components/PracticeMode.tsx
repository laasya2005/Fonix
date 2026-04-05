"use client";

import { useState, useCallback } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord, EvaluateWordResponse } from "@/lib/types";
import { MicButton } from "./MicButton";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { saveWordAttempt } from "@/lib/progress";

interface PracticeModeProps {
  word: AnalyzedWord;
  onBack: () => void;
  onNextSentence: () => void;
}

const BAND_CONFIG = {
  [Band.GREAT]: {
    label: "Great!",
    bgClass: "bg-indigo-50 border-indigo-200",
    textClass: "text-indigo-700",
    badgeClass: "bg-indigo-100 text-indigo-800",
  },
  [Band.IMPROVING]: {
    label: "Improving",
    bgClass: "bg-amber-50 border-amber-200",
    textClass: "text-amber-700",
    badgeClass: "bg-amber-100 text-amber-800",
  },
  [Band.NEEDS_PRACTICE]: {
    label: "Keep trying",
    bgClass: "bg-rose-50 border-rose-200",
    textClass: "text-rose-700",
    badgeClass: "bg-rose-100 text-rose-800",
  },
};

export function PracticeMode({ word, onBack, onNextSentence }: PracticeModeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<EvaluateWordResponse | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [previousBand, setPreviousBand] = useState<Band | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleToggle = useCallback(() => {
    if (isRecording) {
      stopListening();
      setIsRecording(false);
      return;
    }

    if (!isSpeechSupported()) return;

    setResult(null);
    setIsRecording(true);

    startListening({
      onInterimTranscript: () => {},
      onFinalResult: async (speechResult) => {
        setIsRecording(false);
        setIsEvaluating(true);

        const res = await fetch("/api/evaluate-word", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: word.word,
            userSaid: speechResult.transcript,
            previousBand,
            attemptNumber,
          }),
        });

        const evalResult = (await res.json()) as EvaluateWordResponse;
        setResult(evalResult);
        setIsEvaluating(false);
        setPreviousBand(evalResult.band);
        setAttemptNumber((n) => n + 1);

        // Save to progress (tags are empty here — populated from sentence analysis elsewhere)
        saveWordAttempt(word.word, evalResult.band, []);
      },
      onError: () => {
        setIsRecording(false);
      },
    });
  }, [isRecording, word, previousBand, attemptNumber]);

  const config = result ? BAND_CONFIG[result.band] : null;

  return (
    <div className="bg-white p-5 min-h-[calc(100vh-72px)]">
      <button
        onClick={onBack}
        className="text-sm text-slate-400 hover:text-slate-600 mb-4"
      >
        &larr; Back to sentence
      </button>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">{word.word}</h2>
        <span className="text-indigo-600 font-mono text-sm bg-indigo-50 px-3 py-1 rounded-full">
          {word.ipa}
        </span>
        <p className="text-sm text-slate-500 mt-3">{word.tip}</p>
      </div>

      <MicButton
        isRecording={isRecording}
        onToggle={handleToggle}
        disabled={isEvaluating}
      />

      {isEvaluating && (
        <div className="text-center">
          <p className="text-sm text-slate-400">Evaluating...</p>
        </div>
      )}

      {result && config && (
        <div className={`mt-4 p-4 rounded-xl border ${config.bgClass}`}>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${config.badgeClass}`}
            >
              {config.label}
            </span>
            <span className="text-xs text-slate-400">
              Attempt {attemptNumber - 1}
            </span>
          </div>
          <p className={`text-sm ${config.textClass}`}>{result.feedback}</p>
        </div>
      )}

      {result && (
        <div className="flex gap-3 mt-4">
          {result.keepGoing && (
            <button
              onClick={handleToggle}
              className="flex-1 py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm"
            >
              Try again
            </button>
          )}
          <button
            onClick={onNextSentence}
            className={`${result.keepGoing ? "flex-1" : "w-full"} py-3 rounded-xl border-2 border-indigo-200 text-indigo-600 font-medium text-sm hover:bg-indigo-50`}
          >
            Next sentence
          </button>
        </div>
      )}
    </div>
  );
}
