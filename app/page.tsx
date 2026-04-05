"use client";

import { useState, useCallback } from "react";
import sentencesData from "@/data/sentences.json";
import type { Sentence, AnalyzedWord, SpeechResult, AnalyzeResponse } from "@/lib/types";
import { analyzeTranscript } from "@/lib/analyzer";
import { markSentenceCompleted, saveWordAttempt } from "@/lib/progress";
import { startListening, stopListening, isSpeechSupported } from "@/lib/speech";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { MicButton } from "@/components/MicButton";
import { TranscriptView } from "@/components/TranscriptView";
import { WordDetailCard } from "@/components/WordDetailCard";
import { PracticeMode } from "@/components/PracticeMode";
import { ResultsSummary } from "@/components/ResultsSummary";
import { ProgressDashboard } from "@/components/ProgressDashboard";

type AppState =
  | "idle"
  | "recording"
  | "analyzing"
  | "results"
  | "word-detail"
  | "practice"
  | "progress";

const sentences = sentencesData.sentences as Sentence[];

export default function Home() {
  const [state, setState] = useState<AppState>("idle");
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [interimText, setInterimText] = useState("");
  const [analyzedWords, setAnalyzedWords] = useState<AnalyzedWord[]>([]);
  const [summary, setSummary] = useState("");
  const [encouragement, setEncouragement] = useState("");
  const [allCorrect, setAllCorrect] = useState(false);
  const [selectedWord, setSelectedWord] = useState<AnalyzedWord | null>(null);

  const sentence = sentences[sentenceIndex % sentences.length];

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
    setState("recording");

    startListening({
      onInterimTranscript: (text) => {
        setInterimText(text);
      },
      onFinalResult: async (speechResult: SpeechResult) => {
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

        // Save initial word analysis with tags from the sentence focus data
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
    setState("idle");
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
        onNextSentence={handleNextSentence}
      />
    );
  }

  if (state === "progress") {
    return <ProgressDashboard onClose={() => setState("idle")} />;
  }

  return (
    <>
      <div className="bg-white rounded-2xl p-6 shadow-sm shadow-indigo-100">
        <SentenceDisplay sentence={sentence} />

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

      <button
        onClick={() => setState("progress")}
        className="mt-4 w-full py-2 text-sm text-indigo-500 hover:text-indigo-700 transition-colors"
      >
        View progress
      </button>

      {state === "word-detail" && selectedWord && (
        <WordDetailCard
          word={selectedWord}
          onClose={handleBackToResults}
          onPractice={handlePractice}
        />
      )}
    </>
  );
}
