"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { awardXP } from "@/lib/gamification";

type CoachState = "select" | "greeting" | "idle" | "listening" | "thinking" | "speaking";

interface Correction {
  original: string;
  suggested: string;
  type: string;
  audio?: string;
}

interface Message {
  role: "coach" | "user";
  text: string;
  corrections?: Correction[];
  tip?: string;
}

const SCENARIOS = [
  { id: "interview", name: "Job Interview", desc: "Practice answering tough questions", gradient: "linear-gradient(135deg, var(--accent-soft), rgba(124,92,252,0.02))" },
  { id: "small_talk", name: "Small Talk", desc: "Chat naturally about everyday topics", gradient: "linear-gradient(135deg, var(--purple-soft), rgba(124,92,252,0.02))" },
  { id: "sales", name: "Sales Pitch", desc: "Persuade a potential client", gradient: "linear-gradient(135deg, var(--success-soft), rgba(16,185,129,0.02))" },
  { id: "customer_service", name: "Customer Support", desc: "Handle a customer issue calmly", gradient: "linear-gradient(135deg, var(--warn-soft), rgba(245,158,11,0.02))" },
];

const OPENERS: Record<string, string> = {
  interview: "Hi! Let's practice for your interview. Tell me, why are you interested in this role?",
  small_talk: "Hey! How's your day going so far?",
  sales: "Hi, I saw your product demo request. So, what does your company do exactly?",
  customer_service: "Hi, I placed an order last week and it still hasn't arrived. Can you help me?",
};

interface AICoachProps {
  onBack: () => void;
}

export function AICoach({ onBack }: AICoachProps) {
  const [state, setState] = useState<CoachState>("select");
  const [mode, setMode] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [interimText, setInterimText] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, interimText]);

  const playAudio = useCallback((base64: string): Promise<void> => {
    return new Promise((resolve) => {
      const audio = new Audio(`data:audio/mp3;base64,${base64}`);
      audioRef.current = audio;
      audio.onended = () => resolve();
      audio.onerror = () => resolve();
      audio.play().catch(() => resolve());
    });
  }, []);

  const startScenario = useCallback(async (scenarioId: string) => {
    setMode(scenarioId);
    setState("greeting");

    const opener = OPENERS[scenarioId];
    const coachMsg: Message = { role: "coach", text: opener };
    setMessages([coachMsg]);

    // Generate TTS for greeting
    setState("speaking");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: opener }),
      });
      const data = await res.json();
      if (data.audio) {
        await playAudio(data.audio);
      }
    } catch {
      // TTS failed, just show text
    }
    setState("idle");
  }, [playAudio]);

  const handleMicToggle = useCallback(() => {
    if (state === "listening") {
      stopListening();
      setState("idle");
      return;
    }

    if (!isSpeechSupported() || state !== "idle") return;

    setInterimText("");
    setState("listening");

    startListening({
      onInterimTranscript: (text) => setInterimText(text),
      onFinalResult: async (speechResult, _audioUrl, audioBlob) => {
        const transcript = speechResult.transcript.trim();
        if (!transcript) { setState("idle"); return; }

        setInterimText("");
        const userMsg: Message = { role: "user", text: transcript };
        setMessages((prev) => [...prev, userMsg]);
        setState("thinking");

        try {
          // Send audio + transcript via FormData for pronunciation analysis
          const formData = new FormData();
          formData.append("messages", JSON.stringify(
            [...messages, userMsg].map((m) => ({ role: m.role, text: m.text }))
          ));
          formData.append("mode", mode);
          formData.append("browserTranscript", transcript);
          if (audioBlob) {
            formData.append("audio", audioBlob, "recording.webm");
          }

          const res = await fetch("/api/coach", {
            method: "POST",
            body: formData,
          });

          const data = await res.json();

          const coachMsg: Message = {
            role: "coach",
            text: data.spokenResponse,
            corrections: data.corrections?.length > 0 ? data.corrections : undefined,
            tip: data.tip || undefined,
          };

          // Attach corrections to the user's message for display
          setMessages((prev) => {
            const updated = [...prev];
            const lastUser = updated.findLastIndex((m) => m.role === "user");
            if (lastUser >= 0 && data.corrections?.length > 0) {
              updated[lastUser] = { ...updated[lastUser], corrections: data.corrections };
            }
            return [...updated, coachMsg];
          });

          // Play coach response
          if (data.audio) {
            setState("speaking");
            await playAudio(data.audio);
          }

          // Award XP for coach exchange
          awardXP(15, { coachExchange: true });
          setState("idle");
        } catch {
          setState("idle");
        }
      },
      onError: () => setState("idle"),
    });
  }, [state, messages, mode, playAudio]);

  const endSession = useCallback(() => {
    stopListening();
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setMessages([]);
    setInterimText("");
    setState("select");
    setMode("");
  }, []);

  const orbState = state === "select" || state === "greeting" ? "idle" : state;
  const statusText: Record<string, string> = {
    idle: "Tap the mic to respond",
    listening: "Listening...",
    thinking: "Thinking...",
    speaking: "Speaking...",
    select: "",
    greeting: "",
  };

  // ═══════ SCENARIO SELECTION ═══════
  if (state === "select") {
    return (
      <div className="flex-1" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: '100%', maxWidth: '30rem', margin: '0 auto', padding: '0 1.25rem' }}>
          {/* Back button */}
          <div style={{ padding: '0.5rem 0' }}>
            <button onClick={onBack} style={{ fontSize: '0.95rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
              &larr; Dashboard
            </button>
          </div>

          {/* Avatar + title */}
          <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <div className="coach-orb idle" style={{ margin: '0 auto' }}>
                <div className="coach-ring" />
                <div className="coach-ring" />
                <div className="coach-ring" />
              </div>
            </div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', marginTop: '1.25rem', letterSpacing: '-0.02em' }}>
              Ready to practice?
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Choose a scenario and start talking
            </p>
          </div>

          {/* Scenario cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', paddingBottom: '2rem' }}>
            {SCENARIOS.map((s, i) => (
              <button
                key={s.id}
                onClick={() => startScenario(s.id)}
                className="animate-card-in touch-manipulation"
                style={{
                  width: '100%', padding: '1rem', borderRadius: '0.85rem',
                  border: '1px solid var(--border)', background: s.gradient,
                  textAlign: 'left', cursor: 'pointer',
                  transition: 'all 0.2s ease', animationDelay: `${i * 60}ms`,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--border-glow)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = 'var(--border)'; }}
              >
                <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>{s.name}</p>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>{s.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ═══════ COACHING SESSION ═══════
  return (
    <div className="flex-1" style={{
      background: 'var(--bg)', display: 'flex', flexDirection: 'column',
      maxWidth: '30rem', margin: '0 auto', width: '100%',
    }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 1.25rem' }}>
        <button onClick={endSession} style={{
          fontSize: '0.9rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
        }}>&larr; End</button>
        <span style={{
          fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
          padding: '0.2rem 0.6rem', borderRadius: '1rem',
          background: 'var(--surface-raised)', border: '1px solid var(--border)', color: 'var(--text-dim)',
        }}>
          {SCENARIOS.find((s) => s.id === mode)?.name}
        </span>
      </div>

      {/* Avatar area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '1.25rem 0 0.75rem', flexShrink: 0 }}>
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className={`coach-orb ${orbState}`}>
            <div className="coach-ring" />
            <div className="coach-ring" />
            <div className="coach-ring" />
            <div className="coach-bars">
              <div className="coach-bar" />
              <div className="coach-bar" />
              <div className="coach-bar" />
              <div className="coach-bar" />
              <div className="coach-bar" />
            </div>
          </div>
        </div>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginTop: '0.75rem', minHeight: '1rem', transition: 'opacity 0.3s ease' }}>
          {statusText[state]}
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={{
          flex: 1, overflowY: 'auto', padding: '0 1.25rem',
          display: 'flex', flexDirection: 'column', gap: '0.6rem',
          WebkitOverflowScrolling: 'touch', minHeight: 0,
        }}
      >
        {messages.map((msg, i) => (
          <div key={i} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === "user" ? 'flex-end' : 'flex-start' }}>
            {/* Message bubble */}
            <div style={{
              maxWidth: '85%', padding: '0.7rem 0.85rem', borderRadius: '0.75rem',
              background: msg.role === "coach" ? 'var(--surface)' : 'var(--accent-soft)',
              border: `1px solid ${msg.role === "coach" ? 'var(--border)' : 'rgba(124,92,252,0.2)'}`,
              borderBottomLeftRadius: msg.role === "coach" ? '0.2rem' : '0.75rem',
              borderBottomRightRadius: msg.role === "user" ? '0.2rem' : '0.75rem',
            }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.5 }}>{msg.text}</p>
            </div>

            {/* Corrections with audio replay */}
            {msg.corrections && msg.corrections.length > 0 && (
              <div style={{ maxWidth: '85%', marginTop: '0.3rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                {msg.corrections.map((c, ci) => (
                  <div key={ci} style={{
                    padding: '0.5rem 0.7rem', borderRadius: '0.5rem',
                    background: 'var(--surface-raised)', border: '1px solid var(--border)',
                  }}>
                    <span style={{
                      fontSize: '1rem', fontWeight: 600, textTransform: 'uppercase',
                      letterSpacing: '0.04em', color: 'var(--text-dim)', marginBottom: '0.2rem',
                      display: 'block',
                    }}>
                      Accent tip
                    </span>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>
                      <span style={{ textDecoration: 'line-through' }}>{c.original}</span>
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <p style={{ fontSize: '0.95rem', color: 'var(--text)', fontWeight: 600 }}>
                        {c.suggested}
                      </p>
                      {c.audio && (
                        <button
                          onClick={() => playAudio(c.audio!)}
                          className="touch-manipulation"
                          style={{
                            padding: '0.25rem 0.5rem', borderRadius: '0.3rem',
                            border: '1px solid var(--border)', background: 'var(--surface)',
                            color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600,
                            cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem',
                            flexShrink: 0,
                          }}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                          Hear it
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tip (shown below coach messages) */}
            {msg.tip && (
              <div style={{
                maxWidth: '85%', marginTop: '0.25rem', padding: '0.4rem 0.65rem',
                borderRadius: '0.4rem', background: 'var(--surface-raised)', border: '1px solid var(--border)',
              }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{msg.tip}</p>
              </div>
            )}
          </div>
        ))}

        {/* Interim text while listening */}
        {state === "listening" && interimText && (
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div style={{
              maxWidth: '85%', padding: '0.6rem 0.85rem', borderRadius: '0.75rem', borderBottomRightRadius: '0.2rem',
              background: 'var(--accent-soft)', border: '1px dashed rgba(124,92,252,0.2)',
            }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>{interimText}</p>
            </div>
          </div>
        )}

        {/* Thinking indicator */}
        {state === "thinking" && (
          <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-start' }}>
            <div style={{
              padding: '0.6rem 0.85rem', borderRadius: '0.75rem', borderBottomLeftRadius: '0.2rem',
              background: 'var(--surface)', border: '1px solid var(--border)',
              display: 'flex', gap: '0.25rem', alignItems: 'center',
            }}>
              {[0, 1, 2].map((d) => (
                <div key={d} style={{
                  width: '0.35rem', height: '0.35rem', borderRadius: '50%',
                  background: 'var(--text-dim)',
                  animation: `bounce 0.6s ${d * 0.15}s infinite alternate`,
                }} />
              ))}
            </div>
          </div>
        )}

        {/* Spacer for bottom padding */}
        <div style={{ height: '0.5rem', flexShrink: 0 }} />
      </div>

      {/* Bottom: Mic button */}
      <div style={{
        padding: '0.75rem 1.25rem 1.5rem', textAlign: 'center', flexShrink: 0,
        borderTop: '1px solid var(--border)', background: 'rgba(250,249,255,0.9)',
        backdropFilter: 'blur(8px)',
      }}>
        <button
          onClick={handleMicToggle}
          disabled={state === "thinking" || state === "speaking" || state === "greeting"}
          className="touch-manipulation"
          style={{
            width: '3.75rem', height: '3.75rem', borderRadius: '50%',
            background: state === "listening"
              ? 'var(--error)' : 'linear-gradient(135deg, var(--accent), #6242e0)',
            border: 'none', cursor: state === "thinking" || state === "speaking" ? 'default' : 'pointer',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: state === "listening"
              ? '0 0 30px rgba(239,68,68,0.3)' : '0 0 24px var(--accent-glow)',
            opacity: state === "thinking" || state === "speaking" || state === "greeting" ? 0.4 : 1,
            transition: 'all 0.2s ease', position: 'relative',
          }}
        >
          {state === "listening" ? (
            // Stop icon
            <div style={{ width: '1rem', height: '1rem', borderRadius: '0.15rem', background: '#ffffff' }} />
          ) : (
            // Mic icon
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v11m0 0a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3zm-5 1a5 5 0 0010 0M12 19v4m-4 0h8" />
            </svg>
          )}

          {/* Pulse ring when listening */}
          {state === "listening" && (
            <div style={{
              position: 'absolute', inset: '-0.25rem', borderRadius: '50%',
              border: '2px solid var(--error)', animation: 'pulse-ring 1.5s ease-out infinite',
            }} />
          )}
        </button>
      </div>

      <style>{`@keyframes bounce { to { transform: translateY(-5px); opacity: 0.3; } }`}</style>
    </div>
  );
}
