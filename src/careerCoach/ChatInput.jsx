import React, { useEffect, useRef } from "react";
import { ArrowUp, CornerDownLeft } from "lucide-react";

export default function ChatInput({ value, onChange, onSend, disabled }) {
  const ref = useRef(null);
  useEffect(() => { if (!ref.current) return; ref.current.style.height = "auto"; ref.current.style.height = `${Math.min(ref.current.scrollHeight, 150)}px`; }, [value]);
  return <div className="coach-input-shell"><textarea ref={ref} aria-label="Message your career coach" rows={1} value={value} disabled={disabled} placeholder="Ask for a plan, explain a weak topic, or review an answer..." onChange={event => onChange(event.target.value)} onKeyDown={event => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSend(); } }} /><div className="coach-input-footer"><span><CornerDownLeft size={12} /> Enter to send · Shift + Enter for a new line</span><button aria-label="Send message" title="Send message" disabled={disabled || !value.trim()} onClick={onSend}><ArrowUp size={17} /></button></div></div>;
}
