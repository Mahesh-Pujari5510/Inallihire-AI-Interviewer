import React from "react";
import { ArrowUpRight } from "lucide-react";

export default function SuggestedPromptChips({ prompts, onSelect }) {
  return <div className="coach-suggestion-grid">{prompts.map(prompt => <button key={prompt} onClick={() => onSelect(prompt)}>{prompt}<ArrowUpRight size={14} /></button>)}</div>;
}
