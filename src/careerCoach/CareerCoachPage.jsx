import React, { useEffect, useMemo, useRef, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { apiRequest } from "../api";
import CareerCoachLayout from "./CareerCoachLayout";
import ChatInput from "./ChatInput";
import ChatMessage from "./ChatMessage";
import SuggestedPromptChips from "./SuggestedPromptChips";
import CareerPlanCard from "./CareerPlanCard";

export default function CareerCoachPage({ dashboard, nav }) {
  const [conversations, setConversations] = useState([]); const [selectedId, setSelectedId] = useState(null); const [messages, setMessages] = useState([]); const [input, setInput] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(""); const [snapshotOpen, setSnapshotOpen] = useState(false); const [savedPlanIds, setSavedPlanIds] = useState([]); const [offline, setOffline] = useState(!navigator.onLine); const lastPrompt = useRef("");
  const profile = useMemo(() => dashboard?.profile || {}, [dashboard]);
  const isAuthError = error === "Your session has expired. Please log in again." || error === "Please sign in again to use AI Coach.";
  const normalizeCoachError = cause => {
    const message = cause?.message || "";

    if (message.includes("Unable to connect") || message.includes("Failed to fetch") || message.includes("NetworkError") || message.includes("fetch")) {
      return "Unable to connect to the IntelliHire server.";
    }

    if (message.includes("Not authenticated") || message.includes("Invalid token") || message.includes("expired") || message.includes("Please sign in again")) {
      return "Your session has expired. Please log in again.";
    }

    if (message.includes("Gemini API is not configured") || message.includes("GEMINI API key") || message.includes("Gemini API")) {
      return "Gemini API is not configured.";
    }

    if (message.includes("temporarily unavailable") || message.includes("503") || message.includes("AI service")) {
      return "AI service is temporarily unavailable.";
    }

    return "AI service is temporarily unavailable.";
  };
  const prompts = useMemo(() => { const role = profile.targetRole || "my target role"; const weak = dashboard?.metrics?.weakSkills?.[0]; const resume = dashboard?.metrics?.resumeScore == null; return [`Create a 14-day plan to improve my ${role} interview performance`, resume ? "What should I add to my resume before applying?" : "Help me fix the weak areas in my resume", weak ? `Explain the ${weak} topics I got wrong recently` : "What should I practice today?", `Create a roadmap for a ${profile.experienceLevel || "fresher"} ${role}`]; }, [dashboard, profile]);
  useEffect(() => { const online = () => setOffline(false); const offlineState = () => setOffline(true); window.addEventListener("online", online); window.addEventListener("offline", offlineState); apiRequest("/api/coach/conversations").then(data => { setConversations(data.conversations || []); if (data.conversations?.[0]) setSelectedId(data.conversations[0]._id); }).catch(cause => setError(normalizeCoachError(cause))); return () => { window.removeEventListener("online", online); window.removeEventListener("offline", offlineState); }; }, []);
  useEffect(() => { if (!selectedId) { setMessages([]); return; } setBusy(true); apiRequest(`/api/coach/conversations/${selectedId}/messages`).then(data => setMessages(data.messages || [])).catch(cause => setError(normalizeCoachError(cause))).finally(() => setBusy(false)); }, [selectedId]);
  const createConversation = async () => { const data = await apiRequest("/api/coach/conversations", { method: "POST", body: JSON.stringify({}) }); setConversations(current => [data.conversation, ...current]); setSelectedId(data.conversation._id); setMessages([]); setError(""); return data.conversation; };
  const send = async (text = input) => { const question = text.trim(); if (!question || busy || offline) return; setInput(""); setError(""); lastPrompt.current = question; let conversationId = selectedId; setBusy(true); try { if (!conversationId) conversationId = (await createConversation())._id; const optimistic = { role: "user", content: question, createdAt: new Date().toISOString() }; setMessages(current => [...current, optimistic]); const data = await apiRequest("/api/coach/messages", { method: "POST", body: JSON.stringify({ conversationId, message: question }) }); setMessages(current => [...current, data.message]); setConversations(current => current.map(item => item._id === conversationId ? { ...item, title: item.title === "New career chat" ? question.slice(0, 60) : item.title, updatedAt: new Date().toISOString() } : item)); } catch (cause) { setError(normalizeCoachError(cause)); } finally { setBusy(false); } };
  const retry = () => {
    if (isAuthError) return;
    send(lastPrompt.current);
  };
  const newChat = async () => { try { await createConversation(); } catch (cause) { setError(cause.message); } };
  const rename = async conversation => { const title = window.prompt("Conversation title", conversation.title); if (!title?.trim()) return; try { const data = await apiRequest(`/api/coach/conversations/${conversation._id}`, { method: "PATCH", body: JSON.stringify({ title }) }); setConversations(current => current.map(item => item._id === conversation._id ? data.conversation : item)); } catch (cause) { setError(cause.message); } };
  const remove = async conversation => { if (!window.confirm(`Delete “${conversation.title}”? This cannot be undone.`)) return; try { await apiRequest(`/api/coach/conversations/${conversation._id}`, { method: "DELETE" }); const remaining = conversations.filter(item => item._id !== conversation._id); setConversations(remaining); if (selectedId === conversation._id) { setSelectedId(remaining[0]?._id || null); setMessages([]); } } catch (cause) { setError(normalizeCoachError(cause)); } };
  const savePlan = async plan => { try { const data = await apiRequest("/api/coach/plans", { method: "POST", body: JSON.stringify({ ...plan, conversationId: selectedId }) }); setSavedPlanIds(current => [...current, data.plan._id]); } catch (cause) { setError(normalizeCoachError(cause)); } };
  const action = suggestion => { const routes = { dashboard: "dashboard", mock_interview: "interview", daily_practice: "daily", resume: "resume", company_prep: "company", analytics: "analytics" }; if (routes[suggestion.type]) nav(routes[suggestion.type]); else if (suggestion.payload?.topic) setInput(`Help me practice ${suggestion.payload.topic}${suggestion.payload.difficulty ? ` at ${suggestion.payload.difficulty} difficulty` : ""}.`); };
  const hasConversation = messages.length > 0;
  return <CareerCoachLayout conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} onNew={newChat} onRename={rename} onDelete={remove} dashboard={dashboard} snapshotOpen={snapshotOpen} onToggleSnapshot={() => setSnapshotOpen(open => !open)}><div className="coach-conversation"><div className="coach-disclaimer"><MessageCircle size={14} /> Educational career guidance only. Advice is based on your IntelliHire data and does not guarantee employment.</div>{offline && <div className="coach-offline">You’re offline. Saved chats remain available; sending is disabled until you reconnect.</div>}<div className="coach-message-scroll">{!hasConversation && <div className="coach-welcome"><div className="coach-welcome-orb"><MessageCircle size={25} /></div><p className="coach-kicker">A sharper next step</p><h2>What would make your preparation easier today?</h2><p>{profile.targetRole ? `Your coach is tuned to ${profile.targetRole} and the evidence in your profile.` : "Complete your profile to unlock recommendations shaped around your target role."}</p><SuggestedPromptChips prompts={prompts} onSelect={send} /></div>}{messages.map((message, index) => <React.Fragment key={message._id || `${message.createdAt}-${index}`}><ChatMessage message={message} onAction={action} />{message.careerPlan && <CareerPlanCard plan={message.careerPlan} onSave={savePlan} saved={savedPlanIds.includes(message.careerPlan._id)} />}</React.Fragment>)}{busy && <div className="coach-typing"><span /><span /><span /> Coach is thinking from your preparation data...</div>}{error && <div className="coach-error" role="alert"><span>{error}</span>{!isAuthError && <button onClick={retry} disabled={!lastPrompt.current}><RefreshCw size={13} /> Retry</button>}</div>}</div><ChatInput value={input} onChange={setInput} onSend={send} disabled={busy || offline || isAuthError} /></div></CareerCoachLayout>;
}
