"use client";

import { useState, useEffect } from "react";
import type { Sentence } from "@/lib/types";

interface DailyChallengeProps {
  sentence: Sentence;
  completed: boolean;
  onStart: () => void;
}

export function DailyChallenge({ sentence, completed, onStart }: DailyChallengeProps) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    function updateTimer() {
      const now = new Date();
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
      const diff = endOfDay.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    }
    updateTimer();
    const interval = setInterval(updateTimer, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{
      background: 'var(--surface)', borderRadius: '0.85rem',
      border: '1px solid var(--border)', padding: '0.85rem 1rem',
      opacity: completed ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
        <span style={{ fontSize: '0.55rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-dim)' }}>
          Daily Challenge
        </span>
        <span style={{ fontSize: '0.55rem', color: 'var(--text-dim)' }}>
          {completed ? "Completed" : timeLeft + " left"}
        </span>
      </div>
      <p style={{
        fontFamily: 'var(--font-display)', fontSize: '0.85rem', fontWeight: 500,
        color: 'var(--text)', lineHeight: 1.5, fontStyle: 'italic', marginBottom: '0.5rem',
      }}>
        &ldquo;{sentence.text}&rdquo;
      </p>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '0.6rem', color: 'var(--accent)', fontWeight: 600 }}>+50 XP bonus</span>
        {!completed && (
          <button onClick={onStart} className="touch-manipulation" style={{
            padding: '0.4rem 0.85rem', borderRadius: '0.5rem',
            border: '1px solid var(--text)', background: 'var(--text)', color: 'var(--bg)',
            fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer',
          }}>
            Start
          </button>
        )}
      </div>
    </div>
  );
}
