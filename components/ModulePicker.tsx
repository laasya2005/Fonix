"use client";

import type { Category } from "@/lib/types";

interface Module {
  id: Category;
  name: string;
  description: string;
  icon: string;
}

const MODULES: Module[] = [
  { id: "interview", name: "Job Interviews", description: "Nail your next interview with confident speech", icon: "briefcase" },
  { id: "public_speaking", name: "Public Speaking", description: "Present ideas clearly in meetings and talks", icon: "mic" },
  { id: "customer_service", name: "Customer Service", description: "Be understood on every support call", icon: "headphones" },
  { id: "sales", name: "Sales & Pitches", description: "Persuade and close with clarity", icon: "trending" },
  { id: "social", name: "Social Conversations", description: "Chat naturally in everyday situations", icon: "coffee" },
];

const ICONS: Record<string, React.ReactNode> = {
  briefcase: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />,
  mic: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v11m0 0a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3zm-5 1a5 5 0 0010 0M12 19v4m-4 0h8" />,
  headphones: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 18v-6a9 9 0 0118 0v6M3 18a3 3 0 003 3h0a1 1 0 001-1v-4a1 1 0 00-1-1h0a3 3 0 00-3 3zm18 0a3 3 0 01-3 3h0a1 1 0 01-1-1v-4a1 1 0 011-1h0a3 3 0 013 3z" />,
  trending: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />,
  coffee: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm2-6v3m4-3v3m4-3v3" />,
};

interface ModulePickerProps {
  onSelect: (category: Category) => void;
  onConversationMode: () => void;
}

export function ModulePicker({ onSelect, onConversationMode }: ModulePickerProps) {
  return (
    <div className="flex-1 p-5 stagger" style={{ background: 'var(--bg)' }}>
      <div className="text-center mb-6 animate-fade-in">
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.02em' }}>
          What&apos;s your goal?
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
          Choose a path and start practicing
        </p>
      </div>

      {/* Conversation Practice — hero card */}
      <button
        onClick={onConversationMode}
        className="animate-fade-in"
        style={{
          width: '100%',
          padding: '1.25rem',
          marginBottom: '1.25rem',
          borderRadius: '1rem',
          border: '1px solid var(--accent)',
          background: 'linear-gradient(135deg, var(--accent-soft), rgba(124,92,252,0.06))',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: '2.75rem', height: '2.75rem', borderRadius: '0.75rem',
          background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '1.25rem', flexShrink: 0,
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2}><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--accent)' }}>
            Conversation Practice
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
            Real workplace dialogues — listen, respond, get coached
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
      </button>

      <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.65rem', paddingLeft: '0.25rem' }}>
        Sentence drills
      </div>

      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onSelect(mod.id)}
            className="animate-fade-in"
            style={{
              width: '100%',
              padding: '0.9rem 1rem',
              borderRadius: '0.85rem',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-hover)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          >
            <div style={{
              width: '2.25rem', height: '2.25rem', borderRadius: '0.6rem',
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)">
                {ICONS[mod.icon]}
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{mod.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>{mod.description}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </button>
        ))}
      </div>
    </div>
  );
}
