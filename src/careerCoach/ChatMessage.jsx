import React from "react";
import { Bot, UserRound } from "lucide-react";

function SafeCoachText({ content }) {
  return <div className="coach-markdown">{String(content || "").split("\n").map((line, index) => <p key={`${line}-${index}`}>{line || "\u00a0"}</p>)}</div>;
}

export default function ChatMessage({ message, onAction }) {
  const isUser = message.role === "user";
  return <article className={`coach-message-row ${isUser ? "coach-message-user" : "coach-message-assistant"}`}><div className="coach-avatar" aria-hidden="true">{isUser ? <UserRound size={16} /> : <Bot size={17} />}</div><div className="coach-message-stack"><div className="coach-message-bubble"><SafeCoachText content={message.content || message.text} />{!isUser && message.suggestedActions?.length > 0 && <div className="coach-action-list">{message.suggestedActions.map((action, index) => <button key={`${action.label}-${index}`} className="coach-action-button" onClick={() => onAction?.(action)}>{action.label}<span>→</span></button>)}</div>}</div><time>{message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Now"}</time></div></article>;
}
