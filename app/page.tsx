"use client";

import { useState, useCallback, useMemo } from "react";
import sentencesData from "@/data/sentences.json";
import conversationsData from "@/data/conversations.json";
import type { Sentence, Category, AnalyzedWord, SpeechResult, AnalyzeResponse } from "@/lib/types";
import { markSentenceCompleted, saveWordAttempt } from "@/lib/progress";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { ModulePicker } from "@/components/ModulePicker";
import { ConversationMode } from "@/components/ConversationMode";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { MicButton } from "@/components/MicButton";
import { TranscriptView } from "@/components/TranscriptView";
import { WordDetailCard } from "@/components/WordDetailCard";
import { PracticeMode } from "@/components/PracticeMode";
import { ResultsSummary } from "@/components/ResultsSummary";
import { ProgressDashboard } from "@/components/ProgressDashboard";

type AppState =
  | "module-select"
  | "conversation"
  | "idle"
  | "recording"
  | "analyzing"
  | "results"
  | "word-detail"
  | "practice"
  | "progress";

const allSentences = sentencesData.sentences as Sentence[];

export default function Home() {
  const [state, setState] = useState<AppState>("module-select");
  const [selectedModule, setSelectedModule] = useState<Category | null>(null);
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [interimText, setInterimText] = useState("");
  const [analyzedWords, setAnalyzedWords] = useState<AnalyzedWord[]>([]);
  const [summary, setSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [allCorrect, setAllCorrect] = useState(false);
  const [selectedWord, setSelectedWord] = useState<AnalyzedWord | null>(null);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);

  const sentences = useMemo(
    () =>
      selectedModule
        ? allSentences.filter((s) => s.category === selectedModule)
        : allSentences,
    [selectedModule]
  );

  const sentence = sentences[sentenceIndex % sentences.length];

  const handleModuleSelect = useCallback((category: Category) => {
    setSelectedModule(category);
    setSentenceIndex(0);
    setState("idle");
  }, []);

  const handleConversationMode = useCallback(() => {
    setState("conversation");
  }, []);

  const handleChangeModule = useCallback(() => {
    setSelectedModule(null);
    setSentenceIndex(0);
    setAnalyzedWords([]);
    setSummary("");
    setEncouragement("");
    setAllCorrect(false);
    setInterimText("");
    setSelectedWord(null);
    setRecordedAudioUrl(null);
    setState("module-select");
  }, []);

  const handleMicToggle = useCallback(() => {
    if (state === "recording") {
      stopListening();
      setState("idle");
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
      onInterimTranscript: (text) => {
        setInterimText(text);
      },
      onFinalResult: async (speechResult: SpeechResult, audioUrl: string | null, audioBlob: Blob | null) => {
        setRecordedAudioUrl(audioUrl);
        setState("analyzing");

        // Build FormData with audio + sentence info
        const formData = new FormData();
        formData.append("tokens", JSON.stringify(sentence.tokens));
        formData.append("focus", JSON.stringify(sentence.focus));
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
        markSentenceCompleted(sentence.id);

        // Save word progress
        for (const w of data.words) {
          if (w.shouldPractice) {
            const focusEntry = sentence.focus.find((f) => f.word === w.word);
            saveWordAttempt(w.word, w.status, (focusEntry?.tags ?? []) as any);
          }
        }

        setState("results");
      },
      onError: () => {
        setState("idle");
      },
    });
  }, [state, sentence]);

  const handleWordClick = useCallback((word: AnalyzedWord) => {
    setSelectedWord(word);
    setState("word-detail");
  }, []);

  const handlePractice = useCallback((word: AnalyzedWord) => {
    setSelectedWord(word);
    setState("practice");
  }, []);

  const handleNextSentence = useCallback(() => {
    setSentenceIndex((i) => i + 1);
    setAnalyzedWords([]);
    setSummary("");
    setEncouragement("");
    setAllCorrect(false);
    setInterimText("");
    setSelectedWord(null);
    setRecordedAudioUrl(null);
    setState("idle");
  }, []);

  const handleBackToResults = useCallback(() => {
    setSelectedWord(null);
    setState("results");
  }, []);

  // Module selection screen
  if (state === "module-select") {
    return (
      <ModulePicker
        onSelect={handleModuleSelect}
        onConversationMode={handleConversationMode}
      />
    );
  }

  // Conversation practice mode
  if (state === "conversation") {
    return (
      <ConversationMode
        conversations={conversationsData.conversations as any}
        onBack={handleChangeModule}
      />
    );
  }

  // Practice mode
  if (state === "practice" && selectedWord) {
    return (
      <PracticeMode
        word={selectedWord}
        onBack={handleBackToResults}
        onNextSentence={handleNextSentence}
      />
    );
  }

  // Progress dashboard
  if (state === "progress") {
    return <ProgressDashboard onClose={() => setState("idle")} />;
  }

  const totalSentences = sentences.length;
  const currentNum = (sentenceIndex % totalSentences) + 1;

  return (
    <>
      {/* Progress bar */}
      <div style={{ padding: '0.65rem 1rem', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--text-dim)' }}>
            {currentNum} / {totalSentences}
          </span>
          <button
            onClick={() => setState("progress")}
            style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Progress
          </button>
        </div>
        <div style={{ width: '100%', background: 'var(--surface-raised)', borderRadius: '1rem', height: '0.2rem' }}>
          <div style={{ background: 'var(--accent)', height: '0.2rem', borderRadius: '1rem', transition: 'width 0.5s ease', width: `${(currentNum / totalSentences) * 100}%` }} />
        </div>
      </div>

      {/* Main content */}
      <div style={{ padding: '1.25rem', flex: 1 }}>
        <SentenceDisplay
          sentence={sentence}
          onChangeModule={handleChangeModule}
        />

        <MicButton
          isRecording={state === "recording"}
          onToggle={handleMicToggle}
          disabled={state === "analyzing"}
        />

        <TranscriptView
          interimText={interimText}
          isRecording={state === "recording"}
          tokens={sentence.tokens}
          analyzedWords={analyzedWords}
          isAnalyzing={state === "analyzing"}
          onWordClick={handleWordClick}
        />

        {state === "results" && (
          <ResultsSummary
            analyzedWords={analyzedWords}
            summary={summary}
            encouragement={encouragement}
            allCorrect={allCorrect}
            onNextSentence={handleNextSentence}
          />
        )}
      </div>

      {/* Skip */}
      <div style={{ paddingBottom: '1rem', paddingTop: '0.25rem', textAlign: 'center' }}>
        <button
          onClick={handleNextSentence}
          style={{ fontSize: '0.7rem', color: 'var(--text-dim)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          Skip this sentence
        </button>
      </div>

      {/* Word detail drawer */}
      {state === "word-detail" && selectedWord && (
        <WordDetailCard
          word={selectedWord}
          recordedAudioUrl={recordedAudioUrl}
          sentenceText={sentence.text}
          onClose={handleBackToResults}
          onPractice={handlePractice}
        />
      )}
    </>
  );
}
