"use client";

interface MicButtonProps {
  isRecording: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function MicButton({ isRecording, onToggle, disabled }: MicButtonProps) {
  return (
    <div className="flex flex-col items-center my-6">
      <div className="relative">
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-indigo-400 animate-pulse-ring" />
        )}
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 ${
            isRecording
              ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200"
              : "bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 shadow-lg shadow-indigo-200"
          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          aria-label={isRecording ? "Stop recording" : "Start recording"}
        >
          {isRecording ? (
            <div className="w-5 h-5 bg-white rounded-sm" />
          ) : (
            <svg
              className="w-6 h-6 text-white"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
          )}
        </button>
      </div>
      <span className="text-xs text-slate-400 mt-3">
        {isRecording ? "Listening..." : "Tap to speak"}
      </span>
    </div>
  );
}
