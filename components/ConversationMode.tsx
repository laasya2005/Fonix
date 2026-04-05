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
      <div className="px-4 py-3 bg-white border-b border-slate-100">
        <div className="flex items-center justify-between mb-1.5">
          <button
            onClick={onBack}
            className="text-[11px] font-medium text-slate-400 hover:text-slate-600 transition-colors"
          >
            &larr; Modules
          </button>
          <span className="text-[11px] font-medium text-slate-500">
            {currentNum} / {totalConvos}
          </span>
        </div>
        <div className="w-full bg-indigo-100 rounded-full h-1">
          <div
            className="bg-indigo-500 h-1 rounded-full transition-all duration-500"
            style={{ width: `${(currentNum / totalConvos) * 100}%` }}
          />
        </div>
      </div>

      <div className="bg-white p-4 flex-1">
        {/* Scenario */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xs font-medium uppercase tracking-wide text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full">
            💬 Conversation
          </span>
          <span className="text-xs text-slate-400">{convo.level}</span>
        </div>
        <p className="text-sm text-slate-500 mb-5">{convo.scenario}</p>

        {/* Coworker's line */}
        {coworkerLine && (
          <div className="flex gap-3 mb-5">
            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-base shrink-0">
              🧑‍💼
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-slate-400 mb-1 font-semibold">
                Coworker
              </p>
              <div className="bg-slate-50 rounded-xl rounded-tl-sm p-3 border border-slate-100">
                <p className="text-sm text-slate-700 leading-relaxed">
                  {coworkerLine.text}
                </p>
              </div>
              <button
                onClick={playCoworker}
                disabled={coworkerPlaying}
                className="mt-1.5 text-xs text-indigo-500 hover:text-indigo-700 disabled:opacity-50 flex items-center gap-1"
              >
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
                </svg>
                {coworkerPlaying ? "Playing..." : "Listen"}
              </button>
            </div>
          </div>
        )}

        {/* User's line to practice */}
        {userLine && (
          <div className="flex gap-3 mb-4">
            <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-base shrink-0">
              🎤
            </div>
            <div className="flex-1">
              <p className="text-[10px] uppercase tracking-wide text-indigo-400 mb-1 font-semibold">
                Your turn — say this
              </p>
              <div className="bg-indigo-50 rounded-xl rounded-tl-sm p-3 border border-indigo-100">
                <p className="text-sm text-indigo-800 leading-relaxed font-medium">
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
          <div className="mt-4 space-y-3">
            {allCorrect ? (
              <div className="p-4 bg-indigo-50 rounded-xl text-center">
                <p className="text-indigo-800 font-semibold mb-1">
                  Perfect! That sounded natural.
                </p>
                <p className="text-sm text-indigo-600">
                  Great conversational pronunciation!
                </p>
              </div>
            ) : (
              <>
                <div className="p-3 bg-indigo-50 rounded-xl">
                  <p className="text-sm text-indigo-700">{encouragement}</p>
                </div>
                {summary && (
                  <div className="p-3 bg-amber-50 rounded-xl">
                    <p className="text-sm text-amber-800">{summary}</p>
                  </div>
                )}
              </>
            )}
            <button
              onClick={handleNext}
              className="w-full py-3 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white font-medium text-sm"
            >
              Next conversation
            </button>
          </div>
        )}
      </div>

      {/* Skip */}
      <div className="bg-white pb-4 pt-1 text-center">
        <button
          onClick={handleNext}
          className="text-[11px] text-slate-400 hover:text-slate-600 transition-colors"
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
