"use client";

import type { AnalyzedWord } from "@/lib/types";

interface ResultsSummaryProps {
  analyzedWords: AnalyzedWord[];
  summary: string;
  encouragement: string;
  allCorrect: boolean;
  onNextSentence: () => void;
}

export function ResultsSummary({
  analyzedWords,
  summary,
  encouragement,
  allCorrect,
  onNextSentence,
}: ResultsSummaryProps) {
  if (allCorrect) {
    return (
      <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--success-soft)', borderRadius: '0.75rem', border: '1px solid rgba(52,211,153,0.2)', textAlign: 'center' }}>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '1rem', color: 'var(--success)', marginBottom: '0.25rem' }}>
          Excellent pronunciation!
        </p>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Every word was clear.</p>
        <button
          onClick={onNextSentence}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '0.75rem', borderRadius: '0.6rem', border: 'none',
            background: 'var(--success)', color: '#0a0a0f', fontWeight: 600, fontSize: '0.85rem',
            cursor: 'pointer',
          }}
        >
          Next sentence
        </button>
      </div>
    );
  }

  const practiceWords = analyzedWords.filter((w) => w.shouldPractice).map((w) => w.word);

  return (
    <div className="animate-fade-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
      {encouragement && (
        <div style={{ padding: '0.75rem', background: 'var(--purple-soft)', borderRadius: '0.6rem', border: '1px solid rgba(124,92,252,0.15)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--purple)' }}>{encouragement}</p>
        </div>
      )}

      {practiceWords.length > 0 && (
        <div style={{ padding: '0.75rem', background: 'var(--warn-soft)', borderRadius: '0.6rem', border: '1px solid rgba(251,146,60,0.15)' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--warn)' }}>
            <span style={{ fontWeight: 700 }}>Focus on: </span>
            {practiceWords.join(", ")}
          </p>
          {summary && <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>{summary}</p>}
        </div>
      )}

      <button
        onClick={onNextSentence}
        className="touch-manipulation"
        style={{
          width: '100%', padding: '0.75rem', borderRadius: '0.6rem',
          border: '1px solid var(--border)', background: 'var(--surface-raised)',
          color: 'var(--text)', fontWeight: 600, fontSize: '0.85rem',
          cursor: 'pointer', transition: 'all 0.15s ease',
        }}
      >
        Next sentence
      </button>
    </div>
  );
}
