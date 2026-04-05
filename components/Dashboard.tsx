"use client";

import { useState, useEffect } from "react";
import type { Category } from "@/lib/types";
import { getGamificationState, LEVELS } from "@/lib/gamification";
import { getSupabase } from "@/lib/supabase";

interface DashboardProps {
  onSelect: (category: Category) => void;
  onConversationMode: () => void;
  onPracticeWord: (word: string) => void;
  onDailyChallenge: (sentenceIndex: number) => void;
  onPronunciation: () => void;
}

export function Dashboard({ onConversationMode, onPronunciation }: DashboardProps) {
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);
  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    const g = getGamificationState();
    setXp(g.xp);
    setLevel(g.level);
    getSupabase().auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });
  }, []);

  const currentLevel = LEVELS.find((l) => l.level === level) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === level + 1);
  const pct = nextLevel ? Math.min(((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100, 100) : 100;

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
  };

  return (
    <div className="flex-1" style={{
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '1.25rem',
    }}>
      <div style={{ width: '100%', maxWidth: '24rem', margin: '0 auto' }}>

        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{userEmail}</p>
          <button onClick={handleSignOut} style={{
            fontSize: '0.65rem', color: 'var(--text-dim)', background: 'none',
            border: 'none', cursor: 'pointer', textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}>Sign out</button>
        </div>

        {/* Welcome */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700,
            color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: '0.25rem',
          }}>
            What do you want to practice?
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Pick a mode and start training your accent
          </p>
        </div>

        {/* Level bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.62rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Lv.{level} {currentLevel.name}
          </span>
          <div style={{ flex: 1, height: '3px', borderRadius: '2px', background: 'var(--surface-raised)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '0.58rem', color: 'var(--text-dim)' }}>{xp} XP</span>
        </div>

        {/* Main action — Pronunciation Gym */}
        <button
          onClick={onPronunciation}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '1.75rem 1.25rem', borderRadius: '1rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            textAlign: 'left', cursor: 'pointer', marginBottom: '0.75rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>
            Pronunciation Gym
          </p>
          <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Listen to American accent, repeat it, compare side by side
          </p>
        </button>

        {/* Two secondary actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <button
            onClick={onPronunciation}
            className="touch-manipulation"
            style={{
              padding: '1.25rem 1rem', borderRadius: '1rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
              Sound Drills
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              TH, flap T, V/W, R
            </p>
          </button>

          <button
            onClick={onConversationMode}
            className="touch-manipulation"
            style={{
              padding: '1.25rem 1rem', borderRadius: '1rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.82rem', color: 'var(--text)', marginBottom: '0.2rem' }}>
              Live Coach
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              Speak freely, get accent tips
            </p>
          </button>
        </div>

      </div>
    </div>
  );
}
