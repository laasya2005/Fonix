"use client";

import { useEffect } from "react";
import { LEVELS } from "@/lib/gamification";

interface LevelUpPopupProps {
  newLevel: number;
  onClose: () => void;
}

export function LevelUpPopup({ newLevel, onClose }: LevelUpPopupProps) {
  const level = LEVELS.find((l) => l.level === newLevel);

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!level) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div className="animate-badge-reveal animate-level-up" style={{
        background: 'var(--surface)', borderRadius: '1rem',
        border: '1px solid var(--border)', padding: '2rem',
        textAlign: 'center', maxWidth: '16rem',
      }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '50%',
          background: 'var(--surface-raised)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 0.5rem', fontFamily: 'monospace',
          fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)',
        }}>L{newLevel}</div>
        <p style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 700, marginBottom: '0.25rem' }}>
          Level up!
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)' }}>
          Level {newLevel}: {level.name}
        </p>
      </div>
    </div>
  );
}
