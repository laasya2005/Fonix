/**
 * Web Audio API recorder that outputs WAV format (16kHz, 16-bit, mono).
 * Handles browsers that ignore the requested sample rate by resampling.
 */

let audioContext: AudioContext | null = null;
let mediaStream: MediaStream | null = null;
let processor: ScriptProcessorNode | null = null;
let source: MediaStreamAudioSourceNode | null = null;
let audioChunks: Float32Array[] = [];
let isCurrentlyRecording = false;
let actualSampleRate = 16000;

export interface RecordingResult {
  blob: Blob;
  url: string;
  duration: number;
}

function resample(input: Float32Array, fromRate: number, toRate: number): Float32Array {
  if (fromRate === toRate) return input;
  const ratio = fromRate / toRate;
  const outputLength = Math.round(input.length / ratio);
  const output = new Float32Array(outputLength);
  for (let i = 0; i < outputLength; i++) {
    const srcIndex = i * ratio;
    const srcIndexFloor = Math.floor(srcIndex);
    const srcIndexCeil = Math.min(srcIndexFloor + 1, input.length - 1);
    const frac = srcIndex - srcIndexFloor;
    output[i] = input[srcIndexFloor] * (1 - frac) + input[srcIndexCeil] * frac;
  }
  return output;
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

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  const offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset + i * 2, samples[i], true);
  }

  return buffer;
}

export async function startRecording(): Promise<void> {
  audioChunks = [];
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // Don't force 16000 — let the browser use its native rate, we'll resample later
  audioContext = new AudioContext();
  actualSampleRate = audioContext.sampleRate;
  source = audioContext.createMediaStreamSource(mediaStream);

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

    setTimeout(() => {
      // Merge all chunks
      const totalLength = audioChunks.reduce((acc, chunk) => acc + chunk.length, 0);
      const merged = new Float32Array(totalLength);
      let offset = 0;
      for (const chunk of audioChunks) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }

      // Resample to 16kHz if needed (Azure requires 16kHz)
      const targetRate = 16000;
      const resampled = resample(merged, actualSampleRate, targetRate);

      // Convert to 16-bit PCM and encode as WAV
      const int16 = float32ToInt16(resampled);
      const wavBuffer = encodeWAV(int16, targetRate);
      const blob = new Blob([wavBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);
      const duration = resampled.length / targetRate;

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
