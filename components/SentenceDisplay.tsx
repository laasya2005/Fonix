"use client";

import type { Category, Level, Sentence } from "@/lib/types";

const MODULE_LABELS: Record<Category, string> = {
  interview: "Interview",
  public_speaking: "Speaking",
  customer_service: "Service",
  sales: "Sales",
  social: "Social",
};

const LEVEL_LABELS: Record<Level, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

interface SentenceDisplayProps {
  sentence: Sentence;
  currentIndex: number;
  totalInLevel: number;
  onChangeModule: () => void;
}

export function SentenceDisplay({ sentence, currentIndex, totalInLevel, onChangeModule }: SentenceDisplayProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      {/* Breadcrumb */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.65rem', marginBottom: '0.65rem' }}>
        <button onClick={onChangeModule} style={{ color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.65rem' }}>
          Home
        </button>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>{MODULE_LABELS[sentence.category]}</span>
        <span style={{ color: 'var(--text-dim)' }}>/</span>
        <span style={{ color: 'var(--text-dim)' }}>{LEVEL_LABELS[sentence.level]}</span>
      </nav>

      {/* Level + progress */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
        <span style={{
          fontSize: '0.6rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em',
          color: 'var(--text-muted)',
        }}>
          {LEVEL_LABELS[sentence.level]} &middot; {currentIndex} / {totalInLevel}
        </span>
      </div>

      {/* Progress bar for current level */}
      <div style={{ width: '100%', height: '0.2rem', borderRadius: '1rem', background: 'var(--surface-raised)', marginBottom: '0.85rem', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: '1rem', background: 'var(--accent)',
          width: `${(currentIndex / totalInLevel) * 100}%`,
          transition: 'width 0.4s ease',
        }} />
      </div>

      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500,
        color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic',
      }}>
        &ldquo;{sentence.text}&rdquo;
      </p>
      {sentence.hint && (
        <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
          {sentence.hint}
        </p>
      )}
    </div>
  );
}
