"use client";

import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface TranscriptViewProps {
  interimText: string;
  isRecording: boolean;
  tokens: string[];
  analyzedWords: AnalyzedWord[];
  isAnalyzing: boolean;
  onWordClick: (word: AnalyzedWord) => void;
}

export function TranscriptView({
  interimText,
  isRecording,
  tokens,
  analyzedWords,
  isAnalyzing,
  onWordClick,
}: TranscriptViewProps) {
  if (isRecording) {
    return (
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Listening...
        </p>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic', minHeight: '1.5rem' }}>
          {interimText || "..."}
        </p>
      </div>
    );
  }

  if (isAnalyzing) {
    return (
      <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
        <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
          Analyzing your pronunciation...
        </p>
        <div style={{ display: 'flex', gap: '0.3rem' }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: '0.4rem', height: '0.4rem', borderRadius: '50%',
                background: 'var(--accent)',
                animation: `bounce 0.6s ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </div>
        <style>{`@keyframes bounce { to { transform: translateY(-6px); opacity: 0.3; } }`}</style>
      </div>
    );
  }

  if (analyzedWords.length === 0) {
    return null;
  }

  const wordMap = new Map<number, AnalyzedWord>();
  for (const w of analyzedWords) {
    wordMap.set(w.index, w);
  }

  return (
    <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
      <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
        Your pronunciation
      </p>
      <p style={{ fontSize: '0.95rem', lineHeight: 2 }}>
        {tokens.map((token, i) => {
          const analyzed = wordMap.get(i);
          if (!analyzed) {
            return (
              <span key={i} style={{ color: 'var(--text-muted)' }}>
                {token}{" "}
              </span>
            );
          }

          const needsPractice = analyzed.status === Band.NEEDS_PRACTICE;

          return (
            <button
              key={i}
              onClick={() => onWordClick(analyzed)}
              className="touch-manipulation"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.25rem',
                padding: '0.2rem 0.5rem',
                borderRadius: '0.4rem',
                border: `1px solid ${needsPractice ? 'var(--warn)' : 'var(--accent)'}`,
                background: needsPractice ? 'var(--warn-soft)' : 'var(--accent-soft)',
                color: needsPractice ? 'var(--warn)' : 'var(--accent)',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                marginRight: '0.25rem',
              }}
            >
              {token}
              <span style={{ fontSize: '0.55rem', opacity: 0.7 }}>
                {needsPractice ? "fix" : "review"}
              </span>
            </button>
          );
        })}
      </p>
    </div>
  );
}
