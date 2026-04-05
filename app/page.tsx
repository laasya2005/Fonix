"use client";

import { useState, useCallback, useMemo } from "react";
import sentencesData from "@/data/sentences.json";
import type { Sentence, Category, AnalyzedWord, SpeechResult, AnalyzeResponse } from "@/lib/types";
import { analyzeTranscript } from "@/lib/analyzer";
import { markSentenceCompleted, saveWordAttempt } from "@/lib/progress";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { ModulePicker } from "@/components/ModulePicker";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { MicButton } from "@/components/MicButton";
import { TranscriptView } from "@/components/TranscriptView";
import { WordDetailCard } from "@/components/WordDetailCard";
import { PracticeMode } from "@/components/PracticeMode";
import { ResultsSummary } from "@/components/ResultsSummary";
import { ProgressDashboard } from "@/components/ProgressDashboard";

type AppState =
  | "module-select"
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
      onFinalResult: async (speechResult: SpeechResult, audioUrl: string | null) => {
        setRecordedAudioUrl(audioUrl);
        setState("analyzing");

        const analysis = analyzeTranscript(sentence, speechResult);

        if (analysis.allCorrect) {
          setAllCorrect(true);
          setEncouragement("Every word was clear. Keep it up!");
          setSummary("Great job!");
          setAnalyzedWords([]);
          markSentenceCompleted(sentence.id);
          setState("results");
          return;
        }

        const topFlagged = analysis.flaggedWords.slice(0, 2);

        const res = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sentence: {
              tokens: sentence.tokens,
              focus: sentence.focus,
            },
            flaggedWords: topFlagged,
          }),
        });

        const data = (await res.json()) as AnalyzeResponse;
        setAnalyzedWords(data.words);
        setSummary(data.summary);
        setEncouragement(data.encouragement);
        setAllCorrect(false);
        markSentenceCompleted(sentence.id);

        for (const flagged of topFlagged) {
          const analyzed = data.words.find((w) => w.index === flagged.index);
          if (analyzed) {
            saveWordAttempt(flagged.expected, analyzed.status, flagged.tags);
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
    return <ModulePicker onSelect={handleModuleSelect} />;
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
      {/* Progress bar + sentence counter */}
      <div className="px-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-500">
            Sentence {currentNum} of {totalSentences}
          </span>
          <button
            onClick={() => setState("progress")}
            className="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            View progress
          </button>
        </div>
        <div className="w-full bg-indigo-100 rounded-full h-1.5">
          <div
            className="bg-indigo-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${(currentNum / totalSentences) * 100}%` }}
          />
        </div>
      </div>

      {/* Main card */}
      <div className="bg-white rounded-none sm:rounded-2xl p-6 shadow-sm shadow-indigo-100">
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

      {/* Skip sentence link */}
      <div className="px-4 mt-3 text-center">
        <button
          onClick={handleNextSentence}
          className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
        >
          Skip this sentence
        </button>
      </div>

      {/* Word detail drawer */}
      {state === "word-detail" && selectedWord && (
        <WordDetailCard
          word={selectedWord}
          recordedAudioUrl={recordedAudioUrl}
          onClose={handleBackToResults}
          onPractice={handlePractice}
        />
      )}
    </>
  );
}
