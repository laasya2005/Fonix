"use client";

import type { Category, Sentence } from "@/lib/types";

const MODULE_LABELS: Record<Category, string> = {
  interview: "Interview",
  public_speaking: "Speaking",
  customer_service: "Service",
  sales: "Sales",
  social: "Social",
};

interface SentenceDisplayProps {
  sentence: Sentence;
  onChangeModule: () => void;
}

export function SentenceDisplay({ sentence, onChangeModule }: SentenceDisplayProps) {
  return (
    <div style={{ marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <button
          onClick={onChangeModule}
          className="touch-manipulation"
          style={{
            display: 'flex', alignItems: 'center', gap: '0.4rem',
            fontSize: '0.65rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em',
            color: 'var(--accent)', background: 'var(--accent-soft)',
            padding: '0.3rem 0.6rem', borderRadius: '0.4rem',
            border: '1px solid rgba(232,185,49,0.2)', cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {MODULE_LABELS[sentence.category]}
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/></svg>
        </button>
        <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          {sentence.level} &middot; {sentence.difficulty}/3
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 500,
        color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic',
      }}>
        &ldquo;{sentence.text}&rdquo;
      </p>
      <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.5rem' }}>
        {sentence.hint}
      </p>
    </div>
  );
}
