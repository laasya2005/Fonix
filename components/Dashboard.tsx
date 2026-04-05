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
}

const XP_TABLE = [
  { action: "Shadowing sentence", xp: "+10 XP" },
  { action: "Perfect shadowing", xp: "+25 XP" },
  { action: "Sound drill word", xp: "+10 XP" },
  { action: "Live Coach exchange", xp: "+15 XP" },
  { action: "Word mastered", xp: "+20 XP" },
];

export function Dashboard({ onConversationMode, onPronunciation, onDrills }: DashboardProps) {
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
  const xpNeeded = nextLevel ? nextLevel.minXP - xp : 0;
  const pct = nextLevel ? Math.min(((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100, 100) : 100;

  const handleSignOut = async () => {
    await getSupabase().auth.signOut();
  };

  const coachLocked = level < 4;

  return (
    <div className="flex-1" style={{
      background: 'var(--bg)',
      display: 'flex', flexDirection: 'column',
      padding: '1.25rem', overflowY: 'auto',
    }}>
      <div style={{ width: '100%', maxWidth: '24rem', margin: '0 auto' }}>

        {/* User + sign out */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{userEmail}</p>
          <button onClick={handleSignOut} style={{
            fontSize: '0.65rem', color: 'var(--text-dim)', background: 'none',
            border: 'none', cursor: 'pointer', textDecoration: 'underline',
            textUnderlineOffset: '2px',
          }}>Sign out</button>
        </div>

        {/* Level progress */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.85rem', padding: '1rem', marginBottom: '1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text)' }}>
              Lv.{level} {currentLevel.name}
            </span>
            <span style={{ fontSize: '0.62rem', color: 'var(--text-dim)' }}>{xp} XP</span>
          </div>
          <div style={{ width: '100%', height: '4px', borderRadius: '2px', background: 'var(--surface-raised)', overflow: 'hidden', marginBottom: '0.35rem' }}>
            <div style={{ height: '100%', borderRadius: '2px', background: 'var(--accent)', width: `${pct}%`, transition: 'width 0.5s ease' }} />
          </div>
          {nextLevel ? (
            <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
              {xpNeeded} XP to Lv.{nextLevel.level} {nextLevel.name}
            </p>
          ) : (
            <p style={{ fontSize: '0.6rem', color: 'var(--accent)' }}>Max level reached</p>
          )}
        </div>

        {/* Practice modes */}
        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Practice
        </p>

        {/* Pronunciation Gym */}
        <button
          onClick={onPronunciation}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '1.25rem', borderRadius: '0.85rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
                Shadowing
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                Listen, repeat, compare your accent
              </p>
            </div>
            <span style={{ fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>+10 XP</span>
          </div>
        </button>

        {/* Sound Drills */}
        <button
          onClick={onDrills}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '1.25rem', borderRadius: '0.85rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
                Sound Drills
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                TH, flap T, V/W, R, vowels, stress and more
              </p>
            </div>
            <span style={{ fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>+10 XP</span>
          </div>
        </button>

        {/* Live Coach */}
        <button
          onClick={coachLocked ? undefined : onConversationMode}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '1.25rem', borderRadius: '0.85rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            textAlign: 'left', cursor: coachLocked ? 'default' : 'pointer', marginBottom: '1.25rem',
            transition: 'all 0.15s ease',
            opacity: coachLocked ? 0.45 : 1,
          }}
          onMouseEnter={(e) => { if (!coachLocked) e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
                Live Coach
              </p>
              <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                {coachLocked ? `Unlocks at Lv.4 Presenter (${600 - xp} XP away)` : "Speak freely, get real-time accent tips"}
              </p>
            </div>
            {coachLocked ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
              </svg>
            ) : (
              <span style={{ fontSize: '0.55rem', color: 'var(--accent)', fontWeight: 600, whiteSpace: 'nowrap' }}>+15 XP</span>
            )}
          </div>
        </button>

        {/* XP guide */}
        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          How to earn XP
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.85rem', padding: '0.75rem 1rem', marginBottom: '1.25rem',
        }}>
          {XP_TABLE.map((row, i) => (
            <div key={row.action} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '0.35rem 0',
              borderBottom: i < XP_TABLE.length - 1 ? '1px solid var(--surface-raised)' : 'none',
            }}>
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{row.action}</span>
              <span style={{ fontSize: '0.65rem', color: 'var(--accent)', fontWeight: 600 }}>{row.xp}</span>
            </div>
          ))}
        </div>

        {/* Level roadmap */}
        <p style={{ fontSize: '0.6rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.5rem' }}>
          Level roadmap
        </p>
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: '0.85rem', padding: '0.75rem 1rem', marginBottom: '2rem',
        }}>
          {LEVELS.map((lvl, i) => {
            const isCurrent = lvl.level === level;
            const isUnlocked = lvl.level <= level;
            const unlockText: Record<number, string> = {
              1: "TH, Flap T, V/W drills",
              2: "R, L, Vowel drills",
              3: "Stress, Schwa, Final Consonants",
              4: "Connected Speech, Live Coach",
              5: "All content unlocked",
            };
            return (
              <div key={lvl.level} style={{
                display: 'flex', alignItems: 'flex-start', gap: '0.6rem',
                padding: '0.4rem 0',
                borderBottom: i < LEVELS.length - 1 ? '1px solid var(--surface-raised)' : 'none',
              }}>
                <div style={{
                  width: '1.4rem', height: '1.4rem', borderRadius: '50%', flexShrink: 0,
                  background: isUnlocked ? 'var(--accent)' : 'var(--surface-raised)',
                  border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5rem', fontWeight: 700,
                  color: isUnlocked ? 'white' : 'var(--text-dim)',
                }}>
                  {lvl.level}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                    <span style={{
                      fontSize: '0.7rem', fontWeight: isCurrent ? 700 : 500,
                      color: isCurrent ? 'var(--text)' : isUnlocked ? 'var(--text-muted)' : 'var(--text-dim)',
                    }}>
                      {lvl.name}
                    </span>
                    <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>{lvl.minXP} XP</span>
                    {isCurrent && <span style={{ fontSize: '0.5rem', color: 'var(--accent)', fontWeight: 600 }}>YOU</span>}
                  </div>
                  <p style={{ fontSize: '0.58rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                    {unlockText[lvl.level]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}
