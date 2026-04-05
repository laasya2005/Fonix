"use client";

import { LEVELS } from "@/lib/gamification";

interface LevelBarProps {
  xp: number;
  level: number;
}

export function LevelBar({ xp, level }: LevelBarProps) {
  const currentLevel = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === level + 1);
  const xpInLevel = xp - currentLevel.xpRequired;
  const xpForNext = nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 0;
  const pct = nextLevel ? Math.min((xpInLevel / xpForNext) * 100, 100) : 100;

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: '0.85rem',
      border: '1px solid var(--border)', padding: '0.75rem 1rem',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text)' }}>
            Level {level}
          </span>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            {currentLevel.name}
          </span>
        </div>
        <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 500 }}>
          {xp} XP {nextLevel ? `/ ${nextLevel.xpRequired}` : ""}
        </span>
      </div>
      <div style={{ width: '100%', height: '0.35rem', borderRadius: '1rem', background: 'var(--surface-raised)', overflow: 'hidden' }}>
        <div className="animate-progress" style={{
          height: '100%', borderRadius: '1rem', background: 'var(--accent)',
          width: `${pct}%`, transition: 'width 0.5s ease',
        }} />
      </div>
      {nextLevel && (
        <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginTop: '0.3rem' }}>
          {nextLevel.xpRequired - xp} XP to {nextLevel.name}
        </p>
      )}
    </div>
  );
}
