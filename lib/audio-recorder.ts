/**
 * Clean Web Audio API recorder for pronunciation training.
 * Records audio, returns blob for playback and analysis.
 * Separate from speech.ts which handles speech recognition.
 */

let mediaRecorder: MediaRecorder | null = null;
let audioChunks: Blob[] = [];
let stream: MediaStream | null = null;

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
}

export async function startRecording(): Promise<void> {
  audioChunks = [];
  stream = await navigator.mediaDevices.getUserMedia({ audio: true });

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

  mediaRecorder = mimeType
    ? new MediaRecorder(stream, { mimeType: mimeType || undefined })
    : new MediaRecorder(stream);

  mediaRecorder.ondataavailable = (event) => {
    if (event.data.size > 0) {
      audioChunks.push(event.data);
    }
  };

  mediaRecorder.start();
}

export function stopRecording(): Promise<RecordingResult> {
  return new Promise((resolve, reject) => {
    if (!mediaRecorder || mediaRecorder.state !== "recording") {
      reject(new Error("Not recording"));
      return;
    }

    const startTime = Date.now();

    mediaRecorder.onstop = () => {
      const duration = (Date.now() - startTime) / 1000;
      const blobType = mediaRecorder?.mimeType || "audio/webm";
      const blob = new Blob(audioChunks, { type: blobType });
      const url = URL.createObjectURL(blob);

      // Stop all tracks
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        stream = null;
      }

      resolve({ blob, url, duration });
    };

    mediaRecorder.stop();
  });
}

export function isRecording(): boolean {
  return mediaRecorder?.state === "recording";
}

export function cancelRecording(): void {
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.stop();
  }
  if (stream) {
    stream.getTracks().forEach((track) => track.stop());
    stream = null;
  }
  audioChunks = [];
}
