import type { SpeechResult, SpeechWordResult } from "./types";

interface SpeechCallbacks {
  onInterimTranscript: (text: string) => void;
  onFinalResult: (result: SpeechResult, audioUrl: string | null, audioBlob: Blob | null) => void;
  onError: (error: string) => void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let recognition: any = null;
let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];

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

  let recordedAudioUrl: string | null = null;
  let recordedAudioBlob: Blob | null = null;

  // Start audio recording alongside speech recognition
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      audioChunks = [];

      // Find a supported MIME type
      const mimeTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
        "audio/ogg;codecs=opus",
        "",
      ];
      const mimeType = mimeTypes.find(
        (t) => t === "" || MediaRecorder.isTypeSupported(t)
      );

      try {
        mediaRecorder = mimeType
          ? new MediaRecorder(stream, { mimeType: mimeType || undefined })
          : new MediaRecorder(stream);
      } catch {
        // MediaRecorder not supported — continue without recording
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blobType = mimeType || "audio/webm";
        const audioBlob = new Blob(audioChunks, { type: blobType });
        recordedAudioUrl = URL.createObjectURL(audioBlob);
        recordedAudioBlob = audioBlob;
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
    })
    .catch(() => {
      // Recording failed — continue without audio capture
    });

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
            confidence: Math.max(
              0,
              Math.min(1, confidence + (Math.random() - 0.5) * 0.15)
            ),
          });
        }
      } else {
        interimTranscript += transcript;
      }
    }

    if (finalTranscript) {
      // Stop recording, then deliver result after a small delay
      // so the onstop handler can create the audio URL
      if (mediaRecorder && mediaRecorder.state === "recording") {
        mediaRecorder.stop();
        setTimeout(() => {
          callbacks.onFinalResult(
            {
              transcript: finalTranscript.trim().toLowerCase(),
              words,
            },
            recordedAudioUrl,
            recordedAudioBlob
          );
        }, 150);
      } else {
        callbacks.onFinalResult(
          {
            transcript: finalTranscript.trim().toLowerCase(),
            words,
          },
          recordedAudioUrl,
          recordedAudioBlob
        );
      }
    } else {
      callbacks.onInterimTranscript(interimTranscript);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  recognition.onerror = (event: any) => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.stop();
    }
    callbacks.onError(`Speech recognition error: ${event.error}`);
  };

  recognition.start();
}

export function stopListening(): void {
  if (recognition) {
    recognition.stop();
    recognition = null;
  }
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
    mediaRecorder = null;
  }
}
