"use client";

import type { Category } from "@/lib/types";

interface Module {
  id: Category;
  name: string;
  description: string;
  icon: string;
}

const MODULES: Module[] = [
  {
    id: "interview",
    name: "Job Interviews",
    description: "Nail your next interview with clear, confident speech",
    icon: "💼",
  },
  {
    id: "public_speaking",
    name: "Public Speaking",
    description: "Present ideas clearly in meetings and talks",
    icon: "🎤",
  },
  {
    id: "customer_service",
    name: "Customer Service",
    description: "Be understood on every support call",
    icon: "🎧",
  },
  {
    id: "sales",
    name: "Sales & Pitches",
    description: "Persuade and close with clarity",
    icon: "📈",
  },
  {
    id: "social",
    name: "Social Conversations",
    description: "Chat naturally in everyday situations",
    icon: "☕",
  },
];

interface ModulePickerProps {
  onSelect: (category: Category) => void;
  onConversationMode: () => void;
}

export function ModulePicker({ onSelect, onConversationMode }: ModulePickerProps) {
  return (
    <div className="px-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800 mb-1">
          What do you want to improve?
        </h2>
        <p className="text-sm text-slate-500">
          Pick a goal — we&apos;ll coach you with real sentences from that context
        </p>
      </div>

      {/* Conversation Practice — featured card */}
      <button
        onClick={onConversationMode}
        className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-5 shadow-lg shadow-indigo-200 mb-4 text-left flex items-center gap-4 group hover:from-indigo-600 hover:to-indigo-700 transition-all"
      >
        <span className="text-2xl w-12 h-12 flex items-center justify-center bg-white/20 rounded-xl">
          💬
        </span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">
            Conversation Practice
          </p>
          <p className="text-xs text-indigo-200 mt-0.5">
            Practice real workplace conversations — listen, respond, get feedback
          </p>
        </div>
        <svg
          className="w-4 h-4 text-indigo-200 group-hover:text-white transition-colors shrink-0"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3 px-1">
        Sentence practice by goal
      </p>

      <div className="space-y-3">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onSelect(mod.id)}
            className="w-full bg-white rounded-xl p-4 shadow-sm shadow-indigo-50 border border-slate-100 hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-100 transition-all text-left flex items-center gap-4 group"
          >
            <span className="text-2xl w-10 h-10 flex items-center justify-center bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              {mod.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">
                {mod.name}
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                {mod.description}
              </p>
            </div>
            <svg
              className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
