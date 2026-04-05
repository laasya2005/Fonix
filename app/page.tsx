"use client";

import { useState, useCallback, useMemo } from "react";
import sentencesData from "@/data/sentences.json";
import type { Sentence, Category, AnalyzedWord, SpeechResult, AnalyzeResponse } from "@/lib/types";
import { markSentenceCompleted, saveWordAttempt } from "@/lib/progress";
import { awardXP } from "@/lib/gamification";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { Dashboard } from "@/components/Dashboard";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { MicButton } from "@/components/MicButton";
import { TranscriptView } from "@/components/TranscriptView";
import { WordDetailCard } from "@/components/WordDetailCard";
import { PracticeMode } from "@/components/PracticeMode";
import { ResultsSummary } from "@/components/ResultsSummary";
import { ProgressDashboard } from "@/components/ProgressDashboard";
import { AICoach } from "@/components/AICoach";
import { PronunciationTrainer } from "@/components/PronunciationTrainer";
import { BadgePopup } from "@/components/BadgePopup";
import { LevelUpPopup } from "@/components/LevelUpPopup";
import { AuthGate } from "@/components/AuthGate";

type AppState =
  | "module-select"
  | "coach"
  | "pronunciation"
  | "drills"
  | "idle"
  | "recording"
  | "analyzing"
  | "results"
  | "word-detail"
  | "practice"
  | "progress";

const LEVEL_ORDER: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };

const allSentences = (sentencesData.sentences as Sentence[]).sort(
  (a, b) => (LEVEL_ORDER[a.level] ?? 0) - (LEVEL_ORDER[b.level] ?? 0) || a.difficulty - b.difficulty
);

function AppContent() {
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
  const [badgePopup, setBadgePopup] = useState<string | null>(null);
  const [levelUpPopup, setLevelUpPopup] = useState<number | null>(null);
  const [xpFloat, setXpFloat] = useState<number | null>(null);

  const handleAwardResult = useCallback((result: { leveledUp: boolean; newLevel: number; newBadges: string[] }, xpAmount: number) => {
    setXpFloat(xpAmount);
    setTimeout(() => setXpFloat(null), 1500);
    if (result.leveledUp) {
      setLevelUpPopup(result.newLevel);
    } else if (result.newBadges.length > 0) {
      setBadgePopup(result.newBadges[0]);
    }
  }, []);

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
    setState("coach");
  }, []);

  const handlePracticeWord = useCallback((word: string) => {
    // Create a minimal AnalyzedWord so PracticeMode can work with it
    const practiceWord: AnalyzedWord = {
      index: 0,
      word,
      status: "NEEDS_PRACTICE" as AnalyzedWord["status"],
      reason: "KNOWN_DIFFICULTY" as AnalyzedWord["reason"],
      youSaid: word,
      youSaidIpa: "",
      ipa: "",
      tip: `Practice saying "${word}" with clear American pronunciation.`,
      syllables: "",
      shouldPractice: true,
    };
    setSelectedWord(practiceWord);
    setState("practice");
  }, []);

  const handleDailyChallenge = useCallback((sentenceIdx: number) => {
    const allSents = (sentencesData.sentences as Sentence[]);
    const dailySentence = allSents[sentenceIdx];
    if (dailySentence) {
      setSelectedModule(dailySentence.category as Category);
      // Find index within the filtered/sorted sentences array
      const filtered = allSents.filter((s) => s.category === dailySentence.category);
      const idx = filtered.indexOf(dailySentence);
      setSentenceIndex(idx >= 0 ? idx : 0);
      setState("idle");
    }
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

        // Award XP for sentence completion
        const isPerfect = data.words.length === 0 || data.words.every((w) => !w.shouldPractice);
        const xpResult = awardXP(isPerfect ? 25 : 10, {
          sentenceCompleted: true,
          perfectScore: isPerfect,
          category: sentence.category,
        });
        handleAwardResult(xpResult, isPerfect ? 25 : 10);

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

  // Dashboard / module selection screen
  if (state === "module-select") {
    return (
      <Dashboard
        onSelect={handleModuleSelect}
        onConversationMode={handleConversationMode}
        onPracticeWord={handlePracticeWord}
        onDailyChallenge={handleDailyChallenge}
        onPronunciation={() => setState("pronunciation")}
        onDrills={() => setState("drills")}
      />
    );
  }

  // AI Coach mode
  if (state === "coach") {
    return <AICoach onBack={handleChangeModule} />;
  }

  // Pronunciation training mode — shadowing
  if (state === "pronunciation") {
    return <PronunciationTrainer onBack={handleChangeModule} initialMode="shadowing" />;
  }

  // Sound drills mode
  if (state === "drills") {
    return <PronunciationTrainer onBack={handleChangeModule} initialMode="drill-select" />;
  }


  // Practice mode
  if (state === "practice" && selectedWord) {
    // If no module selected, user came from dashboard review — go back to dashboard
    const practiceBack = selectedModule ? handleBackToResults : handleChangeModule;
    const practiceNext = selectedModule ? handleNextSentence : handleChangeModule;
    return (
      <PracticeMode
        word={selectedWord}
        onBack={practiceBack}
        onNextSentence={practiceNext}
      />
    );
  }

  // Progress dashboard
  if (state === "progress") {
    return <ProgressDashboard onClose={() => setState("idle")} />;
  }

  const totalSentences = sentences.length;
  const currentNum = (sentenceIndex % totalSentences) + 1;

  // Compute position within current level
  const currentLevel = sentence.level;
  const levelSentences = sentences.filter((s) => s.level === currentLevel);
  const posInLevel = levelSentences.indexOf(sentence) + 1;
  const totalInLevel = levelSentences.length;

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
          currentIndex={posInLevel}
          totalInLevel={totalInLevel}
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

      {/* XP float */}
      {xpFloat && (
        <div className="animate-xp-float" style={{
          position: 'fixed', bottom: '6rem', left: '50%', transform: 'translateX(-50%)',
          fontSize: '1rem', fontWeight: 700, color: 'var(--accent)', zIndex: 55,
          pointerEvents: 'none',
        }}>
          +{xpFloat} XP
        </div>
      )}

      {/* Badge popup */}
      {badgePopup && <BadgePopup badgeId={badgePopup} onClose={() => setBadgePopup(null)} />}

      {/* Level up popup */}
      {levelUpPopup && <LevelUpPopup newLevel={levelUpPopup} onClose={() => setLevelUpPopup(null)} />}
    </>
  );
}

export default function Home() {
  return (
    <AuthGate>
      {() => <AppContent />}
    </AuthGate>
  );
}
