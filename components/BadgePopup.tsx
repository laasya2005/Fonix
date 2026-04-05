"use client";

import { useEffect } from "react";
import { BADGES } from "@/lib/gamification";

interface BadgePopupProps {
  badgeId: string;
  onClose: () => void;
}

export function BadgePopup({ badgeId, onClose }: BadgePopupProps) {
  const badge = BADGES.find((b) => b.id === badgeId);

  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  if (!badge) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div className="animate-badge-reveal" style={{
        background: 'var(--surface)', borderRadius: '1rem',
        border: '1px solid var(--border)', padding: '2rem',
        textAlign: 'center', maxWidth: '16rem',
      }}>
        <div style={{
          width: '3rem', height: '3rem', borderRadius: '50%',
          background: 'var(--surface-raised)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 0.75rem', fontFamily: 'monospace',
          fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent)',
        }}>{badge.icon}</div>
        <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.25rem' }}>
          Badge earned
        </p>
        <p style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>
          {badge.name}
        </p>
        <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
          {badge.condition}
        </p>
      </div>
    </div>
  );
}
