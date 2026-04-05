"use client";

interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MicButton({ isRecording, onToggle, disabled }: MicButtonProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '1.5rem 0' }}>
      <div style={{ position: 'relative' }}>
        {isRecording && (
          <div
            className="animate-pulse-ring"
            style={{
              position: 'absolute', inset: '-8px', borderRadius: '50%',
              background: 'var(--error)', opacity: 0.3,
            }}
          />
        )}
        {!isRecording && !disabled && (
          <div
            className="animate-glow"
            style={{
              position: 'absolute', inset: '-4px', borderRadius: '50%',
              background: 'transparent',
            }}
          />
        )}
        <button
          onClick={onToggle}
          disabled={disabled}
          className="touch-manipulation"
          style={{
            position: 'relative',
            width: '5rem',
            height: '5rem',
            borderRadius: '50%',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'default' : 'pointer',
            opacity: disabled ? 0.4 : 1,
            transition: 'all 0.2s ease',
            background: isRecording
              ? 'var(--error)'
              : 'linear-gradient(135deg, var(--accent), #d4a020)',
            boxShadow: isRecording
              ? '0 0 30px rgba(248,113,113,0.3)'
              : '0 0 30px var(--accent-glow), 0 4px 20px rgba(0,0,0,0.4)',
          }}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <div style={{ width: '1.5rem', height: '1.5rem', background: 'white', borderRadius: '0.25rem' }} />
          ) : (
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#0a0a0f">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
      </div>
      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.65rem', fontWeight: 500 }}>
        {isRecording ? "Listening..." : "Tap to speak"}
      </span>
    </div>
  );
}
