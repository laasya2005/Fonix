import type { SpeechResult, SpeechWordResult } from "./types";

interface SpeechCallbacks {
  onInterimTranscript: (text: string) => void;
  onFinalResult: (result: SpeechResult) => void;
  onError: (error: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognition: any = null;

export function isSpeechSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window)
  );
}

export function startListening(callbacks: SpeechCallbacks): void {
  if (!isSpeechSupported()) {
    callbacks.onError("Speech recognition is not supported in this browser.");
    return;
  }

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onresult = (event: any) => {
    let interimTranscript = "";
    let finalTranscript = "";
    const words: SpeechWordResult[] = [];

    for (let i = 0; i < event.results.length; i++) {
      const result = event.results[i];
      const transcript = result[0].transcript;

      if (result.isFinal) {
        finalTranscript += transcript;
        const resultWords = transcript.trim().toLowerCase().split(/\s+/);
        const confidence = result[0].confidence;
        for (const w of resultWords) {
          words.push({
            word: w,
            confidence: Math.max(0, Math.min(1, confidence + (Math.random() - 0.5) * 0.15)),
          });
        }
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      callbacks.onFinalResult({
        transcript: finalTranscript.trim().toLowerCase(),
        words,
      });
    } else {
      callbacks.onInterimTranscript(interimTranscript);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    callbacks.onError(`Speech recognition error: ${event.error}`);
  };

  recognition.start();
}

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
}
