"use client";

import type { Category } from "@/lib/types";

interface Module {
  id: Category;
  name: string;
  description: string;
  icon: string;
}

const MODULES: Module[] = [
  { id: "interview", name: "Job Interviews", description: "Nail your next interview with clear, confident speech", icon: "💼" },
  { id: "public_speaking", name: "Public Speaking", description: "Present ideas clearly in meetings and talks", icon: "🎤" },
  { id: "customer_service", name: "Customer Service", description: "Be understood on every support call", icon: "🎧" },
  { id: "sales", name: "Sales & Pitches", description: "Persuade and close with clarity", icon: "📈" },
  { id: "social", name: "Social Conversations", description: "Chat naturally in everyday situations", icon: "☕" },
];

interface ModulePickerProps {
  onSelect: (category: Category) => void;
  onConversationMode: () => void;
}

export function ModulePicker({ onSelect, onConversationMode }: ModulePickerProps) {
  return (
    <div className="p-4 pt-5">
      <div className="text-center mb-5">
        <h2 className="text-lg font-bold text-slate-800">
          What do you want to improve?
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Pick a goal and start practicing
        </p>
      </div>

      <button
        onClick={onConversationMode}
        className="w-full bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl p-4 shadow-md shadow-indigo-200 mb-3 text-left flex items-center gap-3 group hover:from-indigo-600 hover:to-indigo-700 transition-all"
      >
        <span className="text-xl w-10 h-10 flex items-center justify-center bg-white/20 rounded-lg">💬</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-white text-sm">Conversation Practice</p>
          <p className="text-[11px] text-indigo-200 mt-0.5">Real workplace dialogues — listen, respond, improve</p>
        </div>
        <svg className="w-4 h-4 text-indigo-200 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <p className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-2 mt-4">
        Sentence drills
      </p>

      <div className="space-y-2">
        {MODULES.map((mod) => (
          <button
            key={mod.id}
            onClick={() => onSelect(mod.id)}
            className="w-full bg-white rounded-xl p-3.5 border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all text-left flex items-center gap-3 group"
          >
            <span className="text-lg w-9 h-9 flex items-center justify-center bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
              {mod.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-800 text-sm">{mod.name}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{mod.description}</p>
            </div>
            <svg className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
    </div>
  );
}
