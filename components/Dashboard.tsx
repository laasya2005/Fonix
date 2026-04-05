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
  onDrills: () => void;
  onProgress: () => void;
}

export function Dashboard({ onConversationMode, onPronunciation, onDrills, onProgress }: DashboardProps) {
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

  const coachLocked = level < 4;

  return (
    <div className="flex-1" style={{
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: '1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: '28rem' }}>

        {/* Top row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{userEmail}</p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button onClick={onProgress} style={{
              fontSize: '0.85rem', color: 'var(--accent)', background: 'none',
              border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>Progress</button>
            <button onClick={handleSignOut} style={{
              fontSize: '0.85rem', color: 'var(--text-dim)', background: 'none',
              border: 'none', cursor: 'pointer',
            }}>Sign out</button>
          </div>
        </div>

        {/* Level bar */}
        <button onClick={onProgress} style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: '0.65rem',
          marginBottom: '2.5rem', background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, textAlign: 'left',
        }}>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            Lv.{level} {currentLevel.name}
          </span>
          <div style={{ flex: 1, height: '5px', borderRadius: '3px', background: 'var(--surface-raised)', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '3px', background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>{xp} XP</span>
        </button>

        {/* Pronunciation Gym */}
        <button
          onClick={onPronunciation}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '2rem 1.5rem', borderRadius: '1rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            textAlign: 'left', cursor: 'pointer', marginBottom: '1rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
        >
          <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.4rem' }}>
            Pronunciation Gym
          </p>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Listen to American accent, repeat it, compare side by side
          </p>
        </button>

        {/* Sound Drills + Live Coach */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <button
            onClick={onDrills}
            className="touch-manipulation"
            style={{
              padding: '1.5rem 1.25rem', borderRadius: '1rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
              Sound Drills
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              TH, flap T, V/W, R
            </p>
          </button>

          <button
            onClick={coachLocked ? onProgress : onConversationMode}
            className="touch-manipulation"
            style={{
              padding: '1.5rem 1.25rem', borderRadius: '1rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s ease',
              opacity: coachLocked ? 0.45 : 1,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
          >
            <p style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text)', marginBottom: '0.3rem' }}>
              Live Coach
            </p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              {coachLocked ? "Lv.4 to unlock" : "Accent tips live"}
            </p>
          </button>
        </div>

      </div>
    </div>
  );
}
