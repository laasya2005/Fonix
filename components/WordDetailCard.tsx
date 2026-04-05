"use client";

import { useState, useRef } from "react";
import { Band } from "@/lib/types";
import type { AnalyzedWord } from "@/lib/types";

interface WordDetailCardProps {
  word: AnalyzedWord;
  recordedAudioUrl: string | null;
  onClose: () => void;
  onPractice: (word: AnalyzedWord) => void;
  sentenceText?: string;
}

export function WordDetailCard({
  word,
  recordedAudioUrl,
  onClose,
  onPractice,
  sentenceText,
}: WordDetailCardProps) {
  const [playingWhat, setPlayingWhat] = useState<"yours" | "correct" | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  function stopAny() {
    if (audioRef.current) audioRef.current.pause();
    speechSynthesis.cancel();
    setPlayingWhat(null);
  }

  function playYours() {
    if (!recordedAudioUrl) return;
    stopAny();
    setPlayingWhat("yours");
    const audio = new Audio(recordedAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }

  async function playCorrect() {
    stopAny();
    setPlayingWhat("correct");
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: word.word }),
      });
      const data = await res.json();
      if (data.audio) {
        const audio = new Audio(`data:audio/mp3;base64,${data.audio}`);
        audioRef.current = audio;
        audio.onended = () => setPlayingWhat(null);
        audio.onerror = () => setPlayingWhat(null);
        audio.play();
        return;
      }
    } catch { /* fallback */ }
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(word.word);
      u.lang = "en-US"; u.rate = 0.75;
      u.onend = () => setPlayingWhat(null);
      u.onerror = () => setPlayingWhat(null);
      speechSynthesis.speak(u);
    } else { setPlayingWhat(null); }
  }

  function renderHighlightedSentence() {
    if (!sentenceText) return null;
    const regex = new RegExp(`(\\b${word.word}\\b)`, "gi");
    const parts = sentenceText.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} style={{ color: 'var(--accent)', fontWeight: 700 }}>{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    );
  }

  const needsPractice = word.status === Band.NEEDS_PRACTICE;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="animate-slide-up safe-bottom" style={{
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        borderRadius: '1.25rem 1.25rem 0 0', width: '100%', maxWidth: '32rem',
        padding: '1.5rem', maxHeight: '88dvh', overflowY: 'auto',
      }}>
        {/* Handle bar */}
        <div style={{ width: '2rem', height: '0.2rem', background: 'var(--border-glow)', borderRadius: '1rem', margin: '0 auto 1rem' }} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 700, color: 'var(--text)' }}>{word.word}</h3>
            <span style={{
              fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em',
              padding: '0.2rem 0.5rem', borderRadius: '0.3rem',
              background: needsPractice ? 'var(--warn-soft)' : 'var(--accent-soft)',
              color: needsPractice ? 'var(--warn)' : 'var(--accent)',
              border: `1px solid ${needsPractice ? 'rgba(251,146,60,0.2)' : 'rgba(232,185,49,0.2)'}`,
            }}>
              {needsPractice ? "Needs practice" : "Improving"}
            </span>
          </div>
          <button onClick={onClose} className="touch-manipulation" style={{
            width: '2rem', height: '2rem', borderRadius: '50%',
            background: 'var(--surface-raised)', border: '1px solid var(--border)',
            color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', fontSize: '1rem',
          }}>&times;</button>
        </div>

        {/* Your recording */}
        <div style={{ background: 'var(--surface-raised)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.75rem', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem' }}>
            Your recording — listen for &ldquo;{word.word}&rdquo;
          </p>
          {sentenceText && (
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.65rem' }}>
              {renderHighlightedSentence()}
            </p>
          )}
          <button onClick={playYours} disabled={!recordedAudioUrl || playingWhat !== null} className="touch-manipulation" style={{
            width: '100%', padding: '0.65rem', borderRadius: '0.5rem', border: '1px solid var(--border)',
            background: 'var(--surface)', color: 'var(--text)', fontSize: '0.8rem', fontWeight: 600,
            cursor: recordedAudioUrl ? 'pointer' : 'default', opacity: !recordedAudioUrl ? 0.4 : 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
            {playingWhat === "yours" ? "Playing..." : recordedAudioUrl ? "Hear your voice" : "No recording"}
          </button>
        </div>

        {/* Correct pronunciation */}
        <div style={{ background: 'var(--success-soft)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '0.75rem', border: '1px solid rgba(52,211,153,0.15)' }}>
          <p style={{ fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', fontWeight: 600, marginBottom: '0.5rem' }}>
            Correct — American English
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.15rem', fontWeight: 700, color: 'var(--success)' }}>{word.word}</span>
              <span style={{ marginLeft: '0.5rem', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-muted)' }}>{word.ipa}</span>
            </div>
            <button onClick={playCorrect} disabled={playingWhat !== null} className="touch-manipulation" style={{
              padding: '0.55rem 1rem', borderRadius: '0.5rem', border: 'none',
              background: 'var(--success)', color: '#0a0a0f', fontSize: '0.75rem', fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem',
              opacity: playingWhat !== null ? 0.5 : 1,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
              {playingWhat === "correct" ? "Playing..." : "Listen"}
            </button>
          </div>
        </div>

        {/* IPA Comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <div style={{ background: 'var(--warn-soft)', borderRadius: '0.6rem', padding: '0.75rem', border: '1px solid rgba(251,146,60,0.15)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--warn)', fontWeight: 600, marginBottom: '0.3rem' }}>You said</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--warn)' }}>{word.youSaid || word.word}</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{word.youSaidIpa || word.ipa}</p>
          </div>
          <div style={{ background: 'var(--success-soft)', borderRadius: '0.6rem', padding: '0.75rem', border: '1px solid rgba(52,211,153,0.15)', textAlign: 'center' }}>
            <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--success)', fontWeight: 600, marginBottom: '0.3rem' }}>Correct</p>
            <p style={{ fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 700, color: 'var(--success)' }}>{word.word}</p>
            <p style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>{word.ipa}</p>
          </div>
        </div>

        {/* Syllables */}
        <div style={{ marginBottom: '0.75rem' }}>
          <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.4rem' }}>Syllables</p>
          <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
            {word.syllables.split("·").map((syl, i, arr) => (
              <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 600,
                  padding: '0.35rem 0.65rem', borderRadius: '0.4rem',
                  background: 'var(--surface-raised)', border: '1px solid var(--border)',
                  color: 'var(--accent)',
                }}>{syl.trim()}</span>
                {i < arr.length - 1 && <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem' }}>·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Tip */}
        <div style={{ background: 'var(--purple-soft)', borderRadius: '0.6rem', padding: '0.85rem', marginBottom: '1.25rem', border: '1px solid rgba(124,92,252,0.15)' }}>
          <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--purple)', fontWeight: 600, marginBottom: '0.3rem' }}>Coach tip</p>
          <p style={{ fontSize: '0.8rem', color: 'var(--text)', lineHeight: 1.5 }}>{word.tip}</p>
        </div>

        {/* Practice CTA */}
        <button onClick={() => onPractice(word)} className="touch-manipulation" style={{
          width: '100%', padding: '0.9rem', borderRadius: '0.6rem', border: 'none',
          background: 'linear-gradient(135deg, var(--accent), #d4a020)',
          color: '#0a0a0f', fontWeight: 700, fontSize: '0.9rem',
          cursor: 'pointer', boxShadow: '0 4px 20px var(--accent-glow)',
        }}>
          Practice this word
        </button>
      </div>
    </div>
  );
}
