"use client";

import { useState, useCallback } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord, EvaluateWordResponse } from "@/lib/types";
import { MicButton } from "./MicButton";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { saveWordAttempt } from "@/lib/progress";
import { awardXP } from "@/lib/gamification";

interface PracticeModeProps {
  word: AnalyzedWord;
  onBack: () => void;
  onNextSentence: () => void;
}

const BAND_CONFIG = {
  [Band.GREAT]: { label: "Excellent!", color: "var(--success)", bg: "var(--success-soft)", border: "rgba(16,185,129,0.2)" },
  [Band.IMPROVING]: { label: "Getting closer", color: "var(--accent)", bg: "var(--accent-soft)", border: "rgba(124,92,252,0.2)" },
  [Band.NEEDS_PRACTICE]: { label: "Keep trying", color: "var(--warn)", bg: "var(--warn-soft)", border: "rgba(245,158,11,0.2)" },
};

export function PracticeMode({ word, onBack, onNextSentence }: PracticeModeProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [result, setResult] = useState<EvaluateWordResponse | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [previousBand, setPreviousBand] = useState<Band | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleToggle = useCallback(() => {
    if (isRecording) { stopListening(); setIsRecording(false); return; }
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
          body: JSON.stringify({ word: word.word, userSaid: speechResult.transcript, previousBand, attemptNumber }),
        });

        const evalResult = (await res.json()) as EvaluateWordResponse;
        setResult(evalResult);
        setIsEvaluating(false);
        setPreviousBand(evalResult.band);
        setAttemptNumber((n) => n + 1);
        saveWordAttempt(word.word, evalResult.band, []);
        if (evalResult.band === Band.GREAT) {
          awardXP(20, { greatWord: true });
        }
      },
      onError: () => { setIsRecording(false); },
    });
  }, [isRecording, word, previousBand, attemptNumber]);

  const config = result ? BAND_CONFIG[result.band] : null;

  return (
    <div style={{ background: 'var(--bg)', flex: 1, padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
      <button onClick={onBack} className="touch-manipulation" style={{
        fontSize: '0.75rem', color: 'var(--text-dim)', background: 'none', border: 'none',
        cursor: 'pointer', marginBottom: '1.5rem', padding: 0,
      }}>
        &larr; Back to sentence
      </button>

      <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.5rem' }}>
          {word.word}
        </h2>
        <span style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.3rem 0.75rem', borderRadius: '2rem', border: '1px solid rgba(124,92,252,0.2)' }}>
          {word.ipa}
        </span>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: 1.5 }}>{word.tip}</p>
      </div>

      <MicButton isRecording={isRecording} onToggle={handleToggle} disabled={isEvaluating} />

      {isEvaluating && (
        <p style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-dim)' }}>Evaluating...</p>
      )}

      {result && config && (
        <div className="animate-fade-in" style={{
          marginTop: '0.75rem', padding: '1rem', borderRadius: '0.75rem',
          background: config.bg, border: `1px solid ${config.border}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '0.15rem 0.5rem', borderRadius: '0.3rem', background: config.bg, color: config.color, border: `1px solid ${config.border}` }}>
              {config.label}
            </span>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>Attempt {attemptNumber - 1}</span>
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text)' }}>{result.feedback}</p>
        </div>
      )}

      {result && (
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
          {result.keepGoing && (
            <button onClick={handleToggle} className="touch-manipulation" style={{
              flex: 1, padding: '0.75rem', borderRadius: '0.6rem', border: 'none',
              background: 'linear-gradient(135deg, var(--accent), #6242e0)',
              color: '#ffffff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer',
            }}>
              Try again
            </button>
          )}
          <button onClick={onNextSentence} className="touch-manipulation" style={{
            flex: result.keepGoing ? 1 : undefined, width: result.keepGoing ? undefined : '100%',
            padding: '0.75rem', borderRadius: '0.6rem',
            border: '1px solid var(--border)', background: 'var(--surface-raised)',
            color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer',
          }}>
            Next sentence
          </button>
        </div>
      )}
    </div>
  );
}
