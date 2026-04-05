"use client";

import { Band } from "@/lib/types";
import { getProgress, getStruggledWords } from "@/lib/progress";

interface ProgressDashboardProps {
  onClose: () => void;
}

const TAG_LABELS: Record<string, string> = {
  FLAP_T: "Soft T sounds",
  VOWEL_SHIFT: "Vowel sounds",
  TH_SOUND: "TH sounds",
  STRESS_PATTERN: "Word stress",
  FINAL_CONSONANT: "Ending sounds",
  R_L_DISTINCTION: "R vs L",
  V_W_DISTINCTION: "V vs W",
  VOWEL_REDUCTION: "Reduced vowels",
};

export function ProgressDashboard({ onClose }: ProgressDashboardProps) {
  const progress = getProgress();
  const struggled = getStruggledWords();

  const tagCounts: Record<string, number> = {};
  for (const word of struggled) {
    for (const tag of word.tags) {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }
  }
  const topTags = Object.entries(tagCounts).sort(([, a], [, b]) => b - a).slice(0, 3);

  return (
    <div style={{ background: 'var(--bg)', flex: 1, padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--text)' }}>Your Progress</h2>
        <button onClick={onClose} className="touch-manipulation" style={{
          fontSize: '0.75rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
        }}>Close</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', marginBottom: '1.25rem' }}>
        <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>
            {progress.sentencesCompleted.length}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sentences</p>
        </div>
        <div style={{ background: 'var(--surface)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center', border: '1px solid var(--border)' }}>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.75rem', fontWeight: 700, color: 'var(--accent)' }}>
            {Object.keys(progress.wordsAttempted).length}
          </p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Words practiced</p>
        </div>
      </div>

      {topTags.length > 0 && (
        <div style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Areas to improve
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
            {topTags.map(([tag, count]) => (
              <span key={tag} style={{
                fontSize: '0.7rem', background: 'var(--warn-soft)', color: 'var(--warn)',
                padding: '0.25rem 0.6rem', borderRadius: '2rem', border: '1px solid rgba(251,146,60,0.15)',
              }}>
                {TAG_LABELS[tag] || tag} ({count})
              </span>
            ))}
          </div>
        </div>
      )}

      {struggled.length > 0 && (
        <div>
          <h3 style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Words to practice
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {struggled.slice(0, 8).map((w) => (
              <div key={w.word} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '0.6rem 0.75rem', background: 'var(--surface)', borderRadius: '0.5rem',
                border: '1px solid var(--border)',
              }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{w.word}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{w.attempts}x</span>
                  <span style={{
                    fontSize: '0.6rem', fontWeight: 600, padding: '0.15rem 0.4rem', borderRadius: '0.25rem',
                    background: w.band === Band.NEEDS_PRACTICE ? 'var(--warn-soft)' : 'var(--accent-soft)',
                    color: w.band === Band.NEEDS_PRACTICE ? 'var(--warn)' : 'var(--accent)',
                  }}>
                    {w.band === Band.NEEDS_PRACTICE ? "Practice" : "Improving"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {struggled.length === 0 && (
        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textAlign: 'center', padding: '2rem 0' }}>
          No data yet. Complete some sentences to see your progress.
        </p>
      )}
    </div>
  );
}
