"use client";

import type { Category, Sentence } from "@/lib/types";

const MODULE_LABELS: Record<Category, { name: string; icon: string }> = {
  interview: { name: "Job Interview", icon: "💼" },
  public_speaking: { name: "Public Speaking", icon: "🎤" },
  customer_service: { name: "Customer Service", icon: "🎧" },
  sales: { name: "Sales & Pitches", icon: "📈" },
  social: { name: "Social", icon: "☕" },
};

interface SentenceDisplayProps {
  sentence: Sentence;
  onChangeModule: () => void;
}

export function SentenceDisplay({ sentence, onChangeModule }: SentenceDisplayProps) {
  const mod = MODULE_LABELS[sentence.category];

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2">
        <button
          onClick={onChangeModule}
          className="flex items-center gap-1.5 text-xs font-medium text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-full hover:bg-indigo-100 transition-colors"
        >
          <span>{mod.icon}</span>
          <span>{mod.name}</span>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <span className="text-xs text-slate-400">
          {sentence.level} · {sentence.difficulty}/3
        </span>
      </div>
      <p className="text-lg text-slate-800 leading-relaxed font-medium">
        &ldquo;{sentence.text}&rdquo;
      </p>
      <p className="text-xs text-slate-400 mt-2">{sentence.hint}</p>
    </div>
  );
}
