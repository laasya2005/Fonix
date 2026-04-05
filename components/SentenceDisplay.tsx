"use client";

import type { Sentence } from "@/lib/types";

interface SentenceDisplayProps {
  sentence: Sentence;
}

export function SentenceDisplay({ sentence }: SentenceDisplayProps) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-medium uppercase tracking-wide text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-full">
          {sentence.category.replace("_", " ")}
        </span>
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
