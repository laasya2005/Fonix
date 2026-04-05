"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { startRecording, stopRecording, cancelRecording } from "@/lib/audio-recorder";
import { awardXP, getGamificationState, LEVELS } from "@/lib/gamification";
import { SOUND_CATEGORIES, SHADOWING_SENTENCES, type SoundCategory, type DrillWord, type ShadowingSentence } from "@/data/pronunciation-drills";

type Mode = "menu" | "shadowing" | "drill-select" | "drill";
type PracticeState = "ready" | "playing-model" | "recording" | "comparing" | "feedback";

interface AccentFeedback {
  focus: string;
  feedback: string;
  example: string;
}

interface PronunciationTrainerProps {
  onBack: () => void;
  initialMode?: "shadowing" | "drill-select";
}

export function PronunciationTrainer({ onBack, initialMode }: PronunciationTrainerProps) {
  const [mode, setMode] = useState<Mode>(initialMode || "menu");
  const [practiceState, setPracticeState] = useState<PracticeState>("ready");
  const [userLevel, setUserLevel] = useState(1);

  // Load user level
  useEffect(() => {
    setUserLevel(getGamificationState().level);
  }, []);

  // Filter content by level
  const availableSentences = SHADOWING_SENTENCES.filter((s) => s.minLevel <= userLevel);
  const availableCategories = SOUND_CATEGORIES; // show all, but lock ones above level

  // Shadowing state
  const [sentenceIndex, setSentenceIndex] = useState(0);

  // Drill state
  const [selectedCategory, setSelectedCategory] = useState<SoundCategory | null>(null);
  const [drillIndex, setDrillIndex] = useState(0);

  // Audio state
  const [userAudioUrl, setUserAudioUrl] = useState<string | null>(null);
  const [userAudioBlob, setUserAudioBlob] = useState<Blob | null>(null);
  const [modelAudioUrl, setModelAudioUrl] = useState<string | null>(null);
  const [playingWhat, setPlayingWhat] = useState<"model" | "user" | null>(null);
  const [accentFeedback, setAccentFeedback] = useState<AccentFeedback | null>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentSentence = availableSentences[sentenceIndex % availableSentences.length];
  const currentDrillWord = selectedCategory?.words[drillIndex % (selectedCategory?.words.length || 1)];
  const currentText = mode === "shadowing" ? currentSentence.text : currentDrillWord?.text || "";
  const currentTip = mode === "shadowing" ? currentSentence.tip : currentDrillWord?.tip || "";
  const currentPhonetic = mode === "drill" && currentDrillWord ? currentDrillWord.phonetic : "";

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      cancelRecording();
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const stopAny = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    speechSynthesis.cancel();
    setPlayingWhat(null);
  }, []);

  // Play the American model pronunciation via TTS
  const playModel = useCallback(async () => {
    stopAny();
    setPlayingWhat("model");

    // Try OpenAI TTS first
    try {
      const res = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: currentText }),
      });
      const data = await res.json();
      if (data.audio) {
        const url = `data:audio/mp3;base64,${data.audio}`;
        setModelAudioUrl(url);
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = () => setPlayingWhat(null);
        audio.onerror = () => setPlayingWhat(null);
        audio.play();
        return;
      }
    } catch { /* fallback */ }

    // Fallback to browser TTS
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(currentText);
      u.lang = "en-US";
      u.rate = 0.85;
      u.onend = () => setPlayingWhat(null);
      u.onerror = () => setPlayingWhat(null);
      speechSynthesis.speak(u);
    } else {
      setPlayingWhat(null);
    }
  }, [currentText, stopAny]);

  // Play user's recording
  const playUser = useCallback(() => {
    if (!userAudioUrl) return;
    stopAny();
    setPlayingWhat("user");
    const audio = new Audio(userAudioUrl);
    audioRef.current = audio;
    audio.onended = () => setPlayingWhat(null);
    audio.onerror = () => setPlayingWhat(null);
    audio.play();
  }, [userAudioUrl, stopAny]);

  // Loop: play model then user
  const loopBoth = useCallback(async () => {
    stopAny();

    // Play model
    setPlayingWhat("model");
    await new Promise<void>((resolve) => {
      if (modelAudioUrl) {
        const audio = new Audio(modelAudioUrl);
        audioRef.current = audio;
        audio.onended = () => resolve();
        audio.onerror = () => resolve();
        audio.play();
      } else if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(currentText);
        u.lang = "en-US"; u.rate = 0.85;
        u.onend = () => resolve();
        u.onerror = () => resolve();
        speechSynthesis.speak(u);
      } else { resolve(); }
    });

    // Brief pause
    await new Promise((r) => setTimeout(r, 500));

    // Play user
    if (userAudioUrl) {
      setPlayingWhat("user");
      const audio = new Audio(userAudioUrl);
      audioRef.current = audio;
      audio.onended = () => setPlayingWhat(null);
      audio.onerror = () => setPlayingWhat(null);
      audio.play();
    } else {
      setPlayingWhat(null);
    }
  }, [modelAudioUrl, userAudioUrl, currentText, stopAny]);

  // Start recording
  const handleRecord = useCallback(async () => {
    if (practiceState === "recording") {
      const result = await stopRecording();
      setUserAudioUrl(result.url);
      setUserAudioBlob(result.blob);
      setPracticeState("comparing");

      // Fetch accent feedback in background
      setLoadingFeedback(true);
      setAccentFeedback(null);
      const formData = new FormData();
      if (mode === "drill" && currentDrillWord) {
        formData.append("word", currentDrillWord.text);
        formData.append("tip", currentDrillWord.tip);
      } else {
        formData.append("sentence", currentSentence.text);
        formData.append("tip", currentSentence.tip);
      }
      if (result.blob) {
        formData.append("audio", result.blob, "recording.webm");
      }

      try {
        const res = await fetch("/api/accent-feedback", {
          method: "POST",
          body: formData,
        });
        const data = await res.json();
        setAccentFeedback(data);
      } catch {
        setAccentFeedback({ focus: "general", feedback: "Try to match the American pronunciation.", example: "" });
      }
      setLoadingFeedback(false);
      awardXP(10, { sentenceCompleted: true });
      return;
    }

    setUserAudioUrl(null);
    setUserAudioBlob(null);
    setAccentFeedback(null);
    setPracticeState("recording");
    await startRecording();
  }, [practiceState, mode, currentDrillWord, currentSentence]);

  // Next item
  const handleNext = useCallback(() => {
    stopAny();
    setUserAudioUrl(null);
    setUserAudioBlob(null);
    setAccentFeedback(null);
    setModelAudioUrl(null);
    setPracticeState("ready");

    if (mode === "shadowing") {
      setSentenceIndex((i) => i + 1);
    } else if (mode === "drill") {
      setDrillIndex((i) => i + 1);
    }
  }, [mode, stopAny]);

  // Try again
  const handleTryAgain = useCallback(() => {
    stopAny();
    setUserAudioUrl(null);
    setUserAudioBlob(null);
    setAccentFeedback(null);
    setPracticeState("ready");
  }, [stopAny]);

  const container = { width: '100%', maxWidth: '30rem', margin: '0 auto', padding: '0 1.25rem' } as const;

  // ═══ MENU ═══
  if (mode === "menu") {
    return (
      <div className="flex-1" style={{ background: 'var(--bg)' }}>
        <div style={container}>
          <div style={{ padding: '0.5rem 0' }}>
            <button onClick={onBack} style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
              &larr; Dashboard
            </button>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem 0 1rem' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.3rem' }}>
              Pronunciation Gym
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
              Train your ear and your mouth
            </p>
          </div>

          <button
            onClick={() => setMode("shadowing")}
            className="touch-manipulation"
            style={{
              width: '100%', padding: '1.15rem', borderRadius: '0.85rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              textAlign: 'left', cursor: 'pointer', marginBottom: '0.5rem',
              transition: 'all 0.2s ease',
            }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
              Shadowing Practice
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Hear a sentence, repeat it, compare your accent
            </p>
          </button>

          <button
            onClick={() => setMode("drill-select")}
            className="touch-manipulation"
            style={{
              width: '100%', padding: '1.15rem', borderRadius: '0.85rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              textAlign: 'left', cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <p style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)', marginBottom: '0.15rem' }}>
              Sound Drills
            </p>
            <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>
              Focus on specific sounds: TH, flap T, V/W, R
            </p>
          </button>
        </div>
      </div>
    );
  }

  // ═══ DRILL SELECT ═══
  if (mode === "drill-select") {
    return (
      <div className="flex-1" style={{ background: 'var(--bg)' }}>
        <div style={container}>
          <div style={{ padding: '0.5rem 0' }}>
            <button onClick={() => setMode("menu")} style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
              &larr; Back
            </button>
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>
            Pick a sound to drill
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
            {SOUND_CATEGORIES.map((cat) => {
              const locked = cat.minLevel > userLevel;
              const levelName = LEVELS.find((l) => l.level === cat.minLevel)?.name || "";
              return (
                <button
                  key={cat.id}
                  onClick={locked ? undefined : () => { setSelectedCategory(cat); setDrillIndex(0); setMode("drill"); }}
                  className="touch-manipulation"
                  style={{
                    width: '100%', padding: '0.85rem 1rem', borderRadius: '0.75rem',
                    border: '1px solid var(--border)', background: 'var(--surface)',
                    textAlign: 'left', cursor: locked ? 'default' : 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    opacity: locked ? 0.45 : 1,
                  }}
                >
                  <div>
                    <p style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--text)' }}>{cat.name}</p>
                    <p style={{ fontSize: '0.6rem', color: 'var(--text-dim)' }}>
                      {locked ? `Unlocks at Lv.${cat.minLevel} ${levelName}` : `${cat.description} \u00b7 ${cat.words.length} words`}
                    </p>
                  </div>
                  {locked ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-dim)" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7"/></svg>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ═══ PRACTICE VIEW (shadowing or drill) ═══
  const totalItems = mode === "shadowing" ? availableSentences.length : (selectedCategory?.words.length || 0);
  const currentIdx = mode === "shadowing" ? (sentenceIndex % totalItems) + 1 : (drillIndex % totalItems) + 1;

  return (
    <div className="flex-1" style={{ background: 'var(--bg)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ ...container, flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
          <button onClick={() => { cancelRecording(); stopAny(); setMode(mode === "drill" ? "drill-select" : "menu"); setPracticeState("ready"); }} style={{
            fontSize: '0.7rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer',
          }}>&larr; Back</button>
          <span style={{ fontSize: '0.6rem', color: 'var(--text-dim)', fontWeight: 500 }}>
            {currentIdx} / {totalItems}
          </span>
        </div>

        {/* Progress bar */}
        <div style={{ width: '100%', height: '0.2rem', borderRadius: '1rem', background: 'var(--surface-raised)', marginBottom: '1rem', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: '1rem', background: 'var(--accent)', width: `${(currentIdx / totalItems) * 100}%`, transition: 'width 0.3s ease' }} />
        </div>

        {/* Category label (drill mode) */}
        {mode === "drill" && selectedCategory && (
          <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.4rem' }}>
            {selectedCategory.name} drill
          </p>
        )}

        {/* Target word/sentence */}
        <div style={{ textAlign: 'center', marginBottom: '0.75rem' }}>
          <p style={{
            fontFamily: 'var(--font-display)',
            fontSize: mode === "drill" ? '2rem' : '1.1rem',
            fontWeight: mode === "drill" ? 800 : 500,
            color: 'var(--text)', lineHeight: 1.4,
            fontStyle: mode === "drill" ? 'normal' : 'italic',
          }}>
            {mode === "drill" ? currentText : `\u201C${currentText}\u201D`}
          </p>
          {currentPhonetic && (
            <p style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent)', marginTop: '0.3rem' }}>
              {currentPhonetic}
            </p>
          )}
          <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '0.35rem', lineHeight: 1.4 }}>
            {currentTip}
          </p>
        </div>

        {/* Step 1: Listen to American version */}
        <button
          onClick={playModel}
          disabled={playingWhat !== null && playingWhat !== "model"}
          className="touch-manipulation"
          style={{
            width: '100%', padding: '0.7rem', borderRadius: '0.6rem',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text)', fontSize: '0.78rem', fontWeight: 600,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
            marginBottom: '0.5rem',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
          {playingWhat === "model" ? "Playing American accent..." : "Listen to American accent"}
        </button>

        {/* Step 2: Record yourself */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0' }}>
          <button
            onClick={handleRecord}
            className="touch-manipulation"
            style={{
              width: '4.5rem', height: '4.5rem', borderRadius: '50%',
              background: practiceState === "recording" ? 'var(--error)' : 'var(--text)',
              border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: practiceState === "recording" ? '0 0 30px rgba(239,68,68,0.3)' : 'none',
              transition: 'all 0.2s ease', position: 'relative',
            }}
          >
            {practiceState === "recording" ? (
              <>
                <div style={{ width: '1.2rem', height: '1.2rem', borderRadius: '0.15rem', background: 'white' }} />
                <div style={{
                  position: 'absolute', inset: '-0.3rem', borderRadius: '50%',
                  border: '2px solid var(--error)', animation: 'pulse-ring 1.5s ease-out infinite',
                }} />
              </>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--bg)" strokeWidth={2.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v11m0 0a3 3 0 003-3V5a3 3 0 00-6 0v4a3 3 0 003 3zm-5 1a5 5 0 0010 0M12 19v4m-4 0h8" />
              </svg>
            )}
          </button>
        </div>
        <p style={{ textAlign: 'center', fontSize: '0.65rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
          {practiceState === "recording" ? "Recording... tap to stop" : practiceState === "ready" ? "Tap to record yourself" : ""}
        </p>

        {/* Step 3: Compare (after recording) */}
        {(practiceState === "comparing" || accentFeedback) && userAudioUrl && (
          <div className="animate-fade-in" style={{
            background: 'var(--surface)', borderRadius: '0.85rem',
            border: '1px solid var(--border)', padding: '0.85rem',
            marginBottom: '0.5rem',
          }}>
            <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.5rem' }}>
              Compare
            </p>

            <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.5rem' }}>
              <button onClick={playModel} disabled={playingWhat !== null} className="touch-manipulation" style={{
                flex: 1, padding: '0.55rem', borderRadius: '0.5rem',
                border: `1px solid ${playingWhat === "model" ? 'var(--accent)' : 'var(--border)'}`,
                background: playingWhat === "model" ? 'var(--accent-soft)' : 'var(--surface-raised)',
                color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                American
              </button>

              <button onClick={playUser} disabled={playingWhat !== null} className="touch-manipulation" style={{
                flex: 1, padding: '0.55rem', borderRadius: '0.5rem',
                border: `1px solid ${playingWhat === "user" ? 'var(--accent)' : 'var(--border)'}`,
                background: playingWhat === "user" ? 'var(--accent-soft)' : 'var(--surface-raised)',
                color: 'var(--text)', fontSize: '0.7rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem',
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                Yours
              </button>
            </div>

            <button onClick={loopBoth} disabled={playingWhat !== null} className="touch-manipulation" style={{
              width: '100%', padding: '0.45rem', borderRadius: '0.4rem',
              border: '1px solid var(--border)', background: 'var(--surface-raised)',
              color: 'var(--text-muted)', fontSize: '0.6rem', fontWeight: 500, cursor: 'pointer',
            }}>
              Loop both (American → Yours)
            </button>
          </div>
        )}

        {/* Step 4: AI Accent Feedback */}
        {loadingFeedback && (
          <div className="animate-fade-in" style={{
            background: 'var(--surface-raised)', borderRadius: '0.75rem',
            padding: '0.75rem', textAlign: 'center', marginBottom: '0.5rem',
          }}>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Analyzing your accent...</p>
          </div>
        )}

        {accentFeedback && (
          <div className="animate-fade-in" style={{
            background: 'var(--surface)', borderRadius: '0.85rem',
            border: '1px solid var(--border)', padding: '0.85rem',
            marginBottom: '0.5rem',
          }}>
            <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.35rem' }}>
              Accent tip
            </p>
            <p style={{ fontSize: '0.78rem', color: 'var(--text)', lineHeight: 1.5, marginBottom: '0.3rem' }}>
              {accentFeedback.feedback}
            </p>
            {accentFeedback.example && (
              <p style={{ fontSize: '0.72rem', color: 'var(--accent)', fontWeight: 600 }}>
                {accentFeedback.example}
              </p>
            )}
          </div>
        )}

        {/* Action buttons */}
        {(practiceState === "comparing" || accentFeedback) && (
          <div style={{ display: 'flex', gap: '0.4rem', marginTop: 'auto', paddingBottom: '1.5rem' }}>
            <button onClick={handleTryAgain} className="touch-manipulation" style={{
              flex: 1, padding: '0.7rem', borderRadius: '0.6rem',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text)', fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
            }}>
              Try again
            </button>
            <button onClick={handleNext} className="touch-manipulation" style={{
              flex: 1, padding: '0.7rem', borderRadius: '0.6rem',
              border: '1px solid var(--text)', background: 'var(--text)', color: 'var(--bg)',
              fontWeight: 600, fontSize: '0.78rem', cursor: 'pointer',
            }}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
