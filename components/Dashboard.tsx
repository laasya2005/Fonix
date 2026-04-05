"use client";

import { useState, useEffect } from "react";
import type { Category, PronunciationTag } from "@/lib/types";
import { Band } from "@/lib/types";
import { getProgress, getStruggledWords } from "@/lib/progress";
import sentencesData from "@/data/sentences.json";
import type { Sentence } from "@/lib/types";
import { getGamificationState, getDailyChallenge, isDailyChallengeCompleted, isCoachUnlocked } from "@/lib/gamification";
import { LevelBar } from "./LevelBar";
import { DailyChallenge } from "./DailyChallenge";
import { BadgeGrid } from "./BadgeGrid";

interface StruggledWord {
  word: string;
  band: Band;
  attempts: number;
  tags: PronunciationTag[];
}

interface DashboardProps {
  onSelect: (category: Category) => void;
  onConversationMode: () => void;
  onPracticeWord: (word: string) => void;
  onDailyChallenge: (sentenceIndex: number) => void;
  onPronunciation: () => void;
}

interface Stats {
  sentencesCompleted: number;
  wordsAttempted: number;
  struggled: number;
}

const TRACKS: { id: Category; name: string; benefit: string; iconPath: React.ReactNode }[] = [
  { id: "interview", name: "Job Interviews", benefit: "Answer confidently and get hired", iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" /> },
  { id: "social", name: "Social Chats", benefit: "Never run out of things to say", iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zm2-6v3m4-3v3m4-3v3" /> },
  { id: "public_speaking", name: "Public Speaking", benefit: "Speak clearly in meetings", iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 1v11m0 0a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3zm-5 1a5 5 0 0010 0M12 19v4m-4 0h8" /> },
  { id: "customer_service", name: "Customer Service", benefit: "Handle calls smoothly", iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 18v-6a9 9 0 0118 0v6M3 18a3 3 0 003 3h0a1 1 0 001-1v-4a1 1 0 00-1-1h0a3 3 0 00-3 3zm18 0a3 3 0 01-3 3h0a1 1 0 01-1-1v-4a1 1 0 011-1h0a3 3 0 013 3z" /> },
  { id: "sales", name: "Sales & Pitches", benefit: "Persuade with confidence", iconPath: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
];


export function Dashboard({ onSelect, onConversationMode, onPracticeWord, onDailyChallenge, onPronunciation }: DashboardProps) {
  const [stats, setStats] = useState<Stats>({ sentencesCompleted: 0, wordsAttempted: 0, struggled: 0 });
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [struggledWords, setStruggledWords] = useState<StruggledWord[]>([]);
  const [gState, setGState] = useState({ xp: 0, level: 1, streak: { count: 0, lastDate: "" }, badges: [] as string[] });
  const [dailyChallengeCompleted, setDailyChallengeCompleted] = useState(false);
  const [dailySentenceIdx, setDailySentenceIdx] = useState(0);

  useEffect(() => {
    const p = getProgress();
    const struggled = getStruggledWords();
    setStruggledWords(struggled);
    setStats({
      sentencesCompleted: p.sentencesCompleted.length,
      wordsAttempted: Object.keys(p.wordsAttempted).length,
      struggled: struggled.length,
    });
    const g = getGamificationState();
    setGState({ xp: g.xp, level: g.level, streak: g.streak, badges: g.badges });
    setDailyChallengeCompleted(isDailyChallengeCompleted());
    const allSentences = (sentencesData as { sentences: Sentence[] }).sentences;
    setDailySentenceIdx(getDailyChallenge(allSentences.length));
  }, []);

  const isReturningUser = stats.sentencesCompleted > 0;

  const container = { width: '100%', maxWidth: '30rem', margin: '0 auto', padding: '0 1.25rem' } as const;

  return (
    <div className="flex-1" style={{ background: 'var(--bg)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>

      {/* ═══ BREADCRUMB ═══ */}
      <div className="animate-fade-in" style={{ ...container, paddingTop: '0.6rem', paddingBottom: '0' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.68rem' }}>
          <span style={{ color: 'var(--text)', fontWeight: 600 }}>Home</span>
          <span style={{ color: 'var(--text-dim)' }}>/</span>
          <span style={{ color: 'var(--text-dim)' }}>Dashboard</span>
        </nav>
      </div>

      {/* ═══ LEVEL BAR ═══ */}
      <section style={{ ...container, marginTop: '0.5rem' }}>
        <LevelBar xp={gState.xp} level={gState.level} />
      </section>

      {/* ═══ HERO WITH AI AVATAR ═══ */}
      <section style={{ ...container, padding: '1.5rem 1.25rem 1.25rem', textAlign: 'center' }}>
        {/* AI Avatar orb */}
        <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.25rem' }}>
          <button
            onClick={onConversationMode}
            className="touch-manipulation"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            <div className="coach-orb idle" style={{ margin: '0 auto' }}>
              <div className="coach-ring" />
              <div className="coach-ring" />
              <div className="coach-ring" />
            </div>
          </button>
        </div>

        <h2 className="animate-fade-in" style={{
          fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700,
          color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1.3,
          marginBottom: '0.3rem', animationDelay: '80ms',
        }}>
          {isReturningUser ? "Ready to practice?" : "Meet your AI coach"}
        </h2>
        <p className="animate-fade-in" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '1.1rem', animationDelay: '120ms' }}>
          Tap the orb or press Start to begin a conversation
        </p>

        {/* Neutral CTA */}
        <button
          onClick={onConversationMode}
          className="animate-fade-in touch-manipulation"
          style={{
            padding: '0.75rem 2rem', borderRadius: '0.65rem',
            border: '1px solid var(--text)',
            background: 'var(--text)', color: 'var(--bg)',
            fontWeight: 600, fontSize: '0.82rem',
            cursor: 'pointer', letterSpacing: '-0.01em',
            transition: 'all 0.2s ease',
            animationDelay: '160ms',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
        >
          {isReturningUser ? "Continue Speaking" : "Start Speaking"}
        </button>

        {isReturningUser && stats.struggled > 0 && (
          <p className="animate-fade-in" style={{ marginTop: '0.65rem', animationDelay: '180ms' }}>
            <button onClick={() => setReviewOpen(true)} style={{
              background: 'none', border: 'none', color: 'var(--accent)',
              fontSize: '0.7rem', cursor: 'pointer', textDecoration: 'underline',
              textUnderlineOffset: '3px', textDecorationColor: 'rgba(124,92,252,0.3)',
            }}>
              {stats.struggled} word{stats.struggled !== 1 ? "s" : ""} to review
            </button>
          </p>
        )}
      </section>

      {/* ═══ YOUR PROGRESS ═══ */}
      {isReturningUser && (
        <section style={container}>
          <div className="animate-card-in" style={{
            background: 'var(--surface)', borderRadius: '0.85rem',
            border: '1px solid var(--border)', padding: '0.9rem 1rem',
            animationDelay: '200ms',
          }}>
            <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.6rem' }}>
              Your progress
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.4rem' }}>
              {[
                { label: 'Streak', value: gState.streak.count > 0 ? `🔥 ${gState.streak.count}d` : '—' },
                { label: 'Sentences', value: stats.sentencesCompleted },
                { label: 'To review', value: stats.struggled },
              ].map((s) => (
                <div key={s.label} style={{ padding: '0.4rem', borderRadius: '0.5rem', background: 'var(--surface-raised)', textAlign: 'center' }}>
                  <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text)' }}>{String(s.value)}</p>
                  <p style={{ fontSize: '0.5rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ═══ DAILY CHALLENGE ═══ */}
      <section style={{ ...container, marginTop: '0.75rem' }}>
        <DailyChallenge
          sentence={(sentencesData as { sentences: Sentence[] }).sentences[dailySentenceIdx]}
          completed={dailyChallengeCompleted}
          onStart={() => onDailyChallenge(dailySentenceIdx)}
        />
      </section>

      {/* ═══ PRONUNCIATION GYM ═══ */}
      <section style={{ ...container, marginTop: '1rem' }}>
        <p className="animate-fade-in" style={{
          fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem', animationDelay: '220ms',
        }}>Accent training</p>

        <button
          onClick={onPronunciation}
          className="animate-card-in touch-manipulation"
          style={{
            width: '100%', padding: '1rem', borderRadius: '0.85rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            textAlign: 'left', cursor: 'pointer', transition: 'all 0.2s ease',
            animationDelay: '270ms',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              width: '2.5rem', height: '2.5rem', borderRadius: '0.6rem', flexShrink: 0,
              background: 'var(--surface-raised)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem',
            }}>
              👅
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>Pronunciation Gym</p>
              <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>Shadowing, drills, A/B comparison — train your American accent</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
          </div>
        </button>
      </section>

      {/* ═══ RECOMMENDED ═══ */}
      <section style={{ ...container, marginTop: '1rem' }}>
        <p className="animate-fade-in" style={{
          fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem', animationDelay: '250ms',
        }}>Recommended for you</p>

        {(() => {
          const coachLocked = !isCoachUnlocked(gState.level);
          return (
            <button
              onClick={coachLocked ? undefined : onConversationMode}
              className="animate-card-in touch-manipulation"
              onMouseEnter={() => setHoveredCard("convo")}
              onMouseLeave={() => setHoveredCard(null)}
              style={{
                width: '100%', padding: '1rem', borderRadius: '0.85rem',
                border: '1px solid var(--border)',
                background: hoveredCard === "convo" ? 'var(--surface-hover)' : 'var(--surface)',
                textAlign: 'left', cursor: coachLocked ? 'default' : 'pointer',
                transition: 'all 0.2s ease',
                transform: !coachLocked && hoveredCard === "convo" ? 'translateY(-1px)' : 'none',
                boxShadow: !coachLocked && hoveredCard === "convo" ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                animationDelay: '300ms',
                opacity: coachLocked ? 0.5 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{
                  width: '2.5rem', height: '2.5rem', borderRadius: '0.6rem', flexShrink: 0,
                  background: 'var(--surface-raised)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth={2}>
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                  </svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>Accent Coach — Live Practice</p>
                  <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{coachLocked ? "Reach Level 4 to unlock" : "Speak in real scenarios, get accent feedback"}</p>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
              </div>
            </button>
          );
        })()}
      </section>

      {/* ═══ SKILL TRACKS ═══ */}
      <section style={{ ...container, marginTop: '1rem', paddingBottom: '0.25rem' }}>
        <p className="animate-fade-in" style={{
          fontSize: '0.6rem', textTransform: 'uppercase', letterSpacing: '0.1em',
          color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem', animationDelay: '350ms',
        }}>Sentence drills</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
          {TRACKS.map((track, i) => (
            <button
              key={track.id}
              onClick={() => onSelect(track.id)}
              onMouseEnter={() => setHoveredCard(track.id)}
              onMouseLeave={() => setHoveredCard(null)}
              className="animate-card-in touch-manipulation"
              style={{
                padding: '0.85rem', borderRadius: '0.85rem',
                border: `1px solid ${hoveredCard === track.id ? 'var(--border-glow)' : 'var(--border)'}`,
                background: hoveredCard === track.id ? 'var(--surface-hover)' : 'var(--surface)',
                textAlign: 'left', cursor: 'pointer',
                transition: 'all 0.2s ease',
                transform: hoveredCard === track.id ? 'translateY(-1px)' : 'none',
                boxShadow: hoveredCard === track.id ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                animationDelay: `${350 + i * 50}ms`,
              }}
            >
              <div style={{
                width: '2rem', height: '2rem', borderRadius: '0.5rem',
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: '0.5rem',
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                  stroke="var(--text-muted)" style={{ transition: 'stroke 0.2s ease' }}
                >{track.iconPath}</svg>
              </div>
              <p style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--text)', marginBottom: '0.15rem' }}>{track.name}</p>
              <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)', lineHeight: 1.35 }}>{track.benefit}</p>
            </button>
          ))}
        </div>
      </section>

      {/* ═══ BADGES ═══ */}
      <section style={{ ...container, marginTop: '1rem', paddingBottom: '0.25rem' }}>
        <BadgeGrid earned={gState.badges} />
      </section>

      {/* Bottom spacing */}
      <div style={{ height: '2rem' }} />

      {/* ═══ WORDS TO REVIEW PANEL ═══ */}
      {reviewOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(4px)' }}
          onClick={(e) => { if (e.target === e.currentTarget) setReviewOpen(false); }}
        >
          <div className="animate-slide-up safe-bottom" style={{
            background: 'var(--surface)', borderTop: '1px solid var(--border)',
            borderRadius: '1.25rem 1.25rem 0 0', width: '100%', maxWidth: '30rem',
            padding: '1.25rem', maxHeight: '80dvh', overflowY: 'auto',
          }}>
            <div style={{ width: '2rem', height: '0.2rem', background: 'var(--border-glow)', borderRadius: '1rem', margin: '0 auto 0.85rem' }} />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)' }}>Words to Review</h3>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                  {struggledWords.length} word{struggledWords.length !== 1 ? "s" : ""} that need practice
                </p>
              </div>
              <button onClick={() => setReviewOpen(false)} className="touch-manipulation" style={{
                width: '1.75rem', height: '1.75rem', borderRadius: '50%',
                background: 'var(--surface-raised)', border: '1px solid var(--border)',
                color: 'var(--text-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '0.9rem',
              }}>&times;</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              {struggledWords.map((w) => {
                const np = w.band === Band.NEEDS_PRACTICE;
                return (
                  <div key={w.word} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '0.65rem 0.75rem', background: 'var(--surface-raised)',
                    borderRadius: '0.65rem', border: '1px solid var(--border)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{w.word}</span>
                        <span style={{
                          fontSize: '0.5rem', fontWeight: 700, textTransform: 'uppercase',
                          padding: '0.1rem 0.35rem', borderRadius: '0.2rem',
                          background: np ? 'var(--warn-soft)' : 'var(--accent-soft)',
                          color: np ? 'var(--warn)' : 'var(--accent)',
                        }}>{np ? "Practice" : "Improving"}</span>
                      </div>
                      <p style={{ fontSize: '0.55rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>{w.attempts}x attempted</p>
                    </div>
                    <button
                      onClick={() => { setReviewOpen(false); onPracticeWord(w.word); }}
                      className="touch-manipulation"
                      style={{
                        padding: '0.4rem 0.75rem', borderRadius: '0.4rem',
                        border: '1px solid var(--border)',
                        background: 'var(--surface)', color: 'var(--text)',
                        fontWeight: 600, fontSize: '0.65rem', cursor: 'pointer', flexShrink: 0,
                      }}
                    >Practice</button>
                  </div>
                );
              })}
            </div>

            {struggledWords.length === 0 && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', padding: '1.5rem 0' }}>
                No words to review yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
