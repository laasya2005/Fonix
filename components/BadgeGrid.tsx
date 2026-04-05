"use client";

import { BADGES } from "@/lib/gamification";

interface BadgeGridProps {
  earned: string[];
}

export function BadgeGrid({ earned }: BadgeGridProps) {
  return (
    <div>
      <p style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem' }}>
        Badges ({earned.length} / {BADGES.length})
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.4rem' }}>
        {BADGES.map((badge) => {
          const isEarned = earned.includes(badge.id);
          return (
            <div key={badge.id} style={{
              padding: '0.5rem 0.25rem', borderRadius: '0.6rem', textAlign: 'center',
              background: isEarned ? 'var(--surface)' : 'var(--surface-raised)',
              border: `1px solid ${isEarned ? 'var(--border-glow)' : 'var(--border)'}`,
              opacity: isEarned ? 1 : 0.4,
            }}>
              <div style={{
                fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.2rem',
                color: isEarned ? 'var(--accent)' : 'var(--text-dim)',
                fontFamily: 'monospace', letterSpacing: '-0.02em',
              }}>{badge.icon}</div>
              <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.2 }}>{badge.name}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
