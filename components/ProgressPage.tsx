"use client";

import { useState, useEffect } from "react";
import { getGamificationState, LEVELS, BADGES } from "@/lib/gamification";

interface ProgressPageProps {
  onBack: () => void;
}

const XP_TABLE = [
  { action: "Shadowing sentence", xp: "+10" },
  { action: "Perfect shadowing", xp: "+25" },
  { action: "Sound drill word", xp: "+10" },
  { action: "Live Coach exchange", xp: "+15" },
  { action: "Word mastered (GREAT)", xp: "+20" },
];

const LEVEL_UNLOCKS: Record<number, string> = {
  1: "TH Sound, Flap T, V vs W + 5 beginner sentences",
  2: "R Sound, L Sound, Vowels + 4 intermediate sentences",
  3: "Word Stress, Schwa, Final Consonants + 4 advanced sentences",
  4: "Connected Speech, Live Accent Coach + 5 fluency sentences",
  5: "All content — you speak with an American accent",
};

export function ProgressPage({ onBack }: ProgressPageProps) {
  const [g, setG] = useState({ xp: 0, level: 1, streak: { count: 0 }, badges: [] as string[], totalSentences: 0, totalGreatWords: 0, totalCoachExchanges: 0 });

  useEffect(() => {
    const state = getGamificationState();
    setG({
      xp: state.xp,
      level: state.level,
      streak: state.streak,
      badges: state.badges,
      totalSentences: state.totalSentences,
      totalGreatWords: state.totalGreatWords,
      totalCoachExchanges: state.totalCoachExchanges,
    });
  }, []);

  const currentLevel = LEVELS.find((l) => l.level === g.level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === g.level + 1);
  const xpNeeded = nextLevel ? nextLevel.minXP - g.xp : 0;
  const pct = nextLevel ? Math.min(((g.xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100, 100) : 100;

  const container = { width: '100%', maxWidth: '24rem', margin: '0 auto' } as const;

  return (
    <div className="flex-1" style={{ background: 'var(--bg)', padding: '1.25rem', overflowY: 'auto' }}>
      <div style={container}>

        {/* Back */}
        <button onClick={onBack} style={{
          fontSize: '0.95rem', color: 'var(--text-dim)', background: 'none',
          border: 'none', cursor: 'pointer', marginBottom: '1rem',
        }}>&larr; Dashboard</button>

        {/* Level card */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.85rem', padding: '1.15rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>
              Lv.{g.level} {currentLevel.name}
            </span>
            <span style={{ fontSize: '0.95rem', color: 'var(--text-dim)' }}>{g.xp} XP</span>
          </div>
          <div style={{ width: '100%', height: '5px', borderRadius: '3px', background: 'var(--surface-raised)', overflow: 'hidden', marginBottom: '0.4rem' }}>
            <div style={{ height: '100%', borderRadius: '3px', background: 'var(--accent)', width: `${pct}%` }} />
          </div>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
            {nextLevel ? `${xpNeeded} XP to Lv.${nextLevel.level} ${nextLevel.name}` : "Max level reached"}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginBottom: '1.25rem' }}>
          {[
            { label: "Sentences", value: g.totalSentences },
            { label: "Words mastered", value: g.totalGreatWords },
            { label: "Streak", value: g.streak.count > 0 ? `${g.streak.count}d` : "--" },
          ].map((s) => (
            <div key={s.label} style={{
              padding: '0.65rem 0.5rem', borderRadius: '0.65rem', textAlign: 'center',
              background: 'var(--surface)', border: '1px solid var(--border)',
            }}>
              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text)' }}>{String(s.value)}</p>
              <p style={{ fontSize: '1rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* How to earn XP */}
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          How to earn XP
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.85rem', padding: '0.65rem 0.85rem', marginBottom: '1.25rem',
        }}>
          {XP_TABLE.map((row, i) => (
            <div key={row.action} style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '0.35rem 0',
              borderBottom: i < XP_TABLE.length - 1 ? '1px solid var(--surface-raised)' : 'none',
            }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>{row.action}</span>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent)', fontWeight: 600 }}>{row.xp}</span>
            </div>
          ))}
        </div>

        {/* Curriculum */}
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Your path to fluency
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.85rem', padding: '0.65rem 0.85rem', marginBottom: '1.25rem',
        }}>
          {LEVELS.map((lvl, i) => {
            const isCurrent = lvl.level === g.level;
            const isUnlocked = lvl.level <= g.level;
            return (
              <div key={lvl.level} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                padding: '0.45rem 0',
                borderBottom: i < LEVELS.length - 1 ? '1px solid var(--surface-raised)' : 'none',
              }}>
                <div style={{
                  width: '1.3rem', height: '1.3rem', borderRadius: '50%', flexShrink: 0, marginTop: '0.1rem',
                  background: isUnlocked ? 'var(--accent)' : 'var(--surface-raised)',
                  border: `1.5px solid ${isUnlocked ? 'var(--accent)' : 'var(--border)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '1rem', fontWeight: 700, color: isUnlocked ? 'white' : 'var(--text-dim)',
                }}>{lvl.level}</div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{ fontSize: '0.95rem', fontWeight: isCurrent ? 700 : 500, color: isCurrent ? 'var(--text)' : 'var(--text-muted)' }}>
                      {lvl.name}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{lvl.minXP} XP</span>
                    {isCurrent && <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent)' }}>YOU</span>}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', fontStyle: 'italic', marginTop: '0.05rem' }}>{lvl.subtitle}</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginTop: '0.15rem' }}>{LEVEL_UNLOCKS[lvl.level]}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Badges */}
        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
          Badges ({g.badges.length} / {BADGES.length})
        </p>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem', marginBottom: '2rem',
        }}>
          {BADGES.map((badge) => {
            const earned = g.badges.includes(badge.id);
            return (
              <div key={badge.id} style={{
                padding: '0.55rem 0.4rem', borderRadius: '0.65rem', textAlign: 'center',
                background: 'var(--surface)', border: `1px solid ${earned ? 'var(--accent)' : 'var(--border)'}`,
                opacity: earned ? 1 : 0.35,
              }}>
                <p style={{ fontSize: '0.85rem', fontWeight: 700, color: earned ? 'var(--accent)' : 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: '0.15rem' }}>
                  {badge.icon}
                </p>
                <p style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-muted)', lineHeight: 1.2 }}>{badge.name}</p>
                <p style={{ fontSize: '0.95rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>{badge.condition}</p>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
