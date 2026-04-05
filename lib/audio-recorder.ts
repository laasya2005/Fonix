/**
 * Web Audio API recorder that outputs WAV format directly.
 * No ffmpeg needed — works on Vercel serverless.
 */

let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let audioChunks: Float32Array[] = [];
let isCurrentlyRecording = false;

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
}

function float32ToInt16(float32Array: Float32Array): Int16Array {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

function encodeWAV(samples: Int16Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  function writeString(offset: number, string: string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  // WAV header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM
  view.setUint16(20, 1, true); // format = 1 (PCM)
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Write PCM samples
  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset + i * 2, samples[i], true);
  }

  return buffer;
}

export async function startRecording(): Promise<void> {
  audioChunks = [];
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  audioContext = new AudioContext({ sampleRate: 16000 });
  source = audioContext.createMediaStreamSource(mediaStream);

  // ScriptProcessorNode to capture raw PCM
  processor = audioContext.createScriptProcessor(4096, 1, 1);
  processor.onaudioprocess = (e) => {
    if (isCurrentlyRecording) {
      const channelData = e.inputBuffer.getChannelData(0);
      audioChunks.push(new Float32Array(channelData));
    }
  };

  source.connect(processor);
  processor.connect(audioContext.destination);
  isCurrentlyRecording = true;
}

export function stopRecording(): Promise<RecordingResult> {
  return new Promise((resolve) => {
    isCurrentlyRecording = false;
    const startTime = Date.now();

    // Small delay to flush any remaining audio
    setTimeout(() => {
      // Merge all chunks
      const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      // Convert to 16-bit PCM and encode as WAV
      const int16 = float32ToInt16(merged);
      const sampleRate = audioContext?.sampleRate || 16000;
      const wavBuffer = encodeWAV(int16, sampleRate);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const duration = (Date.now() - startTime) / 1000;

      // Clean up
      if (processor) { processor.disconnect(); processor = null; }
      if (source) { source.disconnect(); source = null; }
      if (audioContext) { audioContext.close(); audioContext = null; }
      if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
      audioChunks = [];

      resolve({ blob, url, duration });
    }, 100);
  });
}

export function isRecording(): boolean {
  return isCurrentlyRecording;
}

export function cancelRecording(): void {
  isCurrentlyRecording = false;
  if (processor) { processor.disconnect(); processor = null; }
  if (source) { source.disconnect(); source = null; }
  if (audioContext) { audioContext.close(); audioContext = null; }
  if (mediaStream) { mediaStream.getTracks().forEach((t) => t.stop()); mediaStream = null; }
  audioChunks = [];
}
