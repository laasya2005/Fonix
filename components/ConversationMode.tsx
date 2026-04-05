"use client";

import { useState, useCallback } from "react";
import type { AnalyzedWord, AnalyzeResponse, SpeechResult } from "@/lib/types";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { saveWordAttempt } from "@/lib/progress";
import { MicButton } from "./MicButton";
import { TranscriptView } from "./TranscriptView";
import { WordDetailCard } from "./WordDetailCard";
import { PracticeMode } from "./PracticeMode";

interface ConversationLine {
  speaker: string;
  text: string;
}

interface Conversation {
  id: number;
  scenario: string;
  category: string;
  level: string;
  lines: ConversationLine[];
  expected: string;
  tokens: string[];
  focusIndices: number[];
  focus: { word: string; tags: string[] }[];
}

interface ConversationModeProps {
  conversations: Conversation[];
  onBack: () => void;
}

type ConvoState =
  | "viewing"
  | "recording"
  | "analyzing"
  | "results"
  | "word-detail"
  | "practice";

export function ConversationMode({ conversations, onBack }: ConversationModeProps) {
  const [convoIndex, setConvoIndex] = useState(0);
  const [state, setState] = useState<ConvoState>("viewing");
  const [interimText, setInterimText] = useState("");
  const [analyzedWords, setAnalyzedWords] = useState<AnalyzedWord[]>([]);
  const [summary, setSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [allCorrect, setAllCorrect] = useState(false);
  const [selectedWord, setSelectedWord] = useState<AnalyzedWord | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [coworkerPlaying, setCoworkerPlaying] = useState(false);

  const convo = conversations[convoIndex % conversations.length];
  const coworkerLine = convo.lines.find((l) => l.speaker === "coworker");
  const userLine = convo.lines.find((l) => l.speaker === "user");

  // Build a Sentence-like object for the analyzer
  const sentenceLike = {
    id: convo.id,
    text: userLine?.text || "",
    expected: convo.expected,
    tokens: convo.tokens,
    category: convo.category as any,
    level: convo.level as any,
    difficulty: 2,
    focusIndices: convo.focusIndices,
    focus: convo.focus as any,
    hint: "",
  };

  function playCoworker() {
    if (!("speechSynthesis" in window) || !coworkerLine) return;
    speechSynthesis.cancel();
    setCoworkerPlaying(true);
    const utterance = new SpeechSynthesisUtterance(coworkerLine.text);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utterance.onend = () => setCoworkerPlaying(false);
    utterance.onerror = () => setCoworkerPlaying(false);
    speechSynthesis.speak(utterance);
  }

  const handleMicToggle = useCallback(() => {
    if (state === "recording") {
      stopListening();
      setState("viewing");
      return;
    }

    if (!isSpeechSupported()) return;

    setInterimText("");
    setAnalyzedWords([]);
    setSummary("");
    setEncouragement("");
    setAllCorrect(false);
    setRecordedAudioUrl(null);
    setState("recording");

    startListening({
      onInterimTranscript: (text) => setInterimText(text),
      onFinalResult: async (speechResult: SpeechResult, audioUrl: string | null, audioBlob: Blob | null) => {
        setRecordedAudioUrl(audioUrl);
        setState("analyzing");

        const formData = new FormData();
        formData.append("tokens", JSON.stringify(convo.tokens));
        formData.append("focus", JSON.stringify(convo.focus));
        formData.append("browserTranscript", speechResult.transcript);
        if (audioBlob) {
          formData.append("audio", audioBlob, "recording.webm");
        }

        const res = await fetch("/api/analyze", {
          method: "POST",
          body: formData,
        });

        const data = (await res.json()) as AnalyzeResponse;
        setAnalyzedWords(data.words);
        setSummary(data.summary);
        setEncouragement(data.encouragement);
        setAllCorrect(false);

        for (const w of data.words) {
          if (w.shouldPractice) {
            const focusEntry = convo.focus.find((f) => f.word === w.word);
            saveWordAttempt(w.word, w.status, (focusEntry?.tags ?? []) as any);
          }
        }

        setState("results");
      },
      onError: () => setState("viewing"),
    });
  }, [state, convo, sentenceLike]);

  const handleNext = useCallback(() => {
    setConvoIndex((i) => i + 1);
    setAnalyzedWords([]);
    setSummary("");
    setEncouragement("");
    setAllCorrect(false);
    setInterimText("");
    setSelectedWord(null);
    setRecordedAudioUrl(null);
    setState("viewing");
  }, []);

  const handleWordClick = useCallback((word: AnalyzedWord) => {
    setSelectedWord(word);
    setState("word-detail");
  }, []);

  const handlePractice = useCallback((word: AnalyzedWord) => {
    setSelectedWord(word);
    setState("practice");
  }, []);

  const handleBackToResults = useCallback(() => {
    setSelectedWord(null);
    setState("results");
  }, []);

  if (state === "practice" && selectedWord) {
    return (
      <PracticeMode
        word={selectedWord}
        onBack={handleBackToResults}
        onNextSentence={handleNext}
      />
    );
  }

  const totalConvos = conversations.length;
  const currentNum = (convoIndex % totalConvos) + 1;

  return (
    <>
      {/* Header */}
      <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <button onClick={onBack} style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}>
            &larr; Modules
          </button>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            {currentNum} / {totalConvos}
          </span>
        </div>
        <div style={{ width: '100%', background: 'var(--surface-raised)', borderRadius: '1rem', height: '0.2rem' }}>
          <div style={{ background: 'var(--accent)', height: '0.2rem', borderRadius: '1rem', transition: 'width 0.5s ease', width: `${(currentNum / totalConvos) * 100}%` }} />
        </div>
      </div>

      <div style={{ padding: '1.25rem', flex: 1 }}>
        {/* Scenario */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', background: 'var(--accent-soft)', padding: '0.25rem 0.6rem', borderRadius: '0.3rem', border: '1px solid rgba(232,185,49,0.2)' }}>
            Conversation
          </span>
          <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>{convo.level}</span>
        </div>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1.25rem', fontStyle: 'italic' }}>{convo.scenario}</p>

        {/* Coworker's line */}
        {coworkerLine && (
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '1.25rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--surface-raised)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0 }}>
              C
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)', fontWeight: 600, marginBottom: '0.3rem' }}>
                Coworker
              </p>
              <div style={{ background: 'var(--surface)', borderRadius: '0.65rem', borderTopLeftRadius: '0.15rem', padding: '0.75rem', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--text)', lineHeight: 1.5 }}>
                  {coworkerLine.text}
                </p>
              </div>
              <button
                onClick={playCoworker}
                disabled={coworkerPlaying}
                className="touch-manipulation"
                style={{ marginTop: '0.35rem', fontSize: '0.7rem', color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', opacity: coworkerPlaying ? 0.5 : 1 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>
                {coworkerPlaying ? "Playing..." : "Listen"}
              </button>
            </div>
          </div>
        )}

        {/* User's line to practice */}
        {userLine && (
          <div style={{ display: 'flex', gap: '0.65rem', marginBottom: '0.75rem' }}>
            <div style={{ width: '2rem', height: '2rem', borderRadius: '50%', background: 'var(--accent-soft)', border: '1px solid rgba(232,185,49,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', flexShrink: 0, color: 'var(--accent)' }}>
              Y
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.55rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)', fontWeight: 600, marginBottom: '0.3rem' }}>
                Your turn — say this
              </p>
              <div style={{ background: 'var(--accent-soft)', borderRadius: '0.65rem', borderTopLeftRadius: '0.15rem', padding: '0.75rem', border: '1px solid rgba(232,185,49,0.2)' }}>
                <p style={{ fontSize: '0.85rem', color: 'var(--accent)', lineHeight: 1.5, fontWeight: 500, fontStyle: 'italic' }}>
                  &ldquo;{userLine.text}&rdquo;
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Mic button */}
        <MicButton
          isRecording={state === "recording"}
          onToggle={handleMicToggle}
          disabled={state === "analyzing"}
        />

        {/* Transcript / results */}
        <TranscriptView
          interimText={interimText}
          isRecording={state === "recording"}
          tokens={convo.tokens}
          analyzedWords={analyzedWords}
          isAnalyzing={state === "analyzing"}
          onWordClick={handleWordClick}
        />

        {/* Results */}
        {state === "results" && (
          <div className="animate-fade-in" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {allCorrect ? (
              <div style={{ padding: '1rem', background: 'var(--success-soft)', borderRadius: '0.75rem', border: '1px solid rgba(52,211,153,0.2)', textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: 'var(--success)', marginBottom: '0.15rem' }}>
                  Natural sounding!
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Great conversational pronunciation.
                </p>
              </div>
            ) : (
              <>
                {encouragement && (
                  <div style={{ padding: '0.75rem', background: 'var(--purple-soft)', borderRadius: '0.6rem', border: '1px solid rgba(124,92,252,0.15)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--purple)' }}>{encouragement}</p>
                  </div>
                )}
                {summary && (
                  <div style={{ padding: '0.75rem', background: 'var(--warn-soft)', borderRadius: '0.6rem', border: '1px solid rgba(251,146,60,0.15)' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--warn)' }}>{summary}</p>
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleNext}
              className="touch-manipulation"
              style={{ width: '100%', padding: '0.75rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg, var(--accent), #d4a020)', color: '#0a0a0f', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}
            >
              Next conversation
            </button>
          </div>
        )}
      </div>

      {/* Skip */}
      <div style={{ paddingBottom: '1rem', paddingTop: '0.25rem', textAlign: 'center' }}>
        <button
          onClick={handleNext}
          style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Skip this conversation
        </button>
      </div>

      {/* Word detail drawer */}
      {state === "word-detail" && selectedWord && (
        <WordDetailCard
          word={selectedWord}
          recordedAudioUrl={recordedAudioUrl}
          sentenceText={userLine?.text}
          onClose={handleBackToResults}
          onPractice={handlePractice}
        />
      )}
    </>
  );
}
