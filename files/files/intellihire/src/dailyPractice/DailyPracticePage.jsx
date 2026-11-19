import React, { useEffect, useState } from "react";
import { Award, CheckCircle, Flame, RotateCcw, Sparkles } from "lucide-react";
import DailyPlan from "./DailyPlan";
import PracticeQuestion from "./PracticeQuestion";
import AnswerFeedback from "./AnswerFeedback";
import StreakTracker from "./StreakTracker";
import ReviewQueue from "./ReviewQueue";
import TopicAnalytics from "./TopicAnalytics";
import { buildDailyPlan, normalizeProfile, recommendQuestions } from "./RecommendationEngine";
import { validQuestions } from "./questions";
import { applyCompletion, loadPracticeState, savePracticeState, todayKey } from "./storage";
import { apiRequest } from "../api";

function dateLabel() { return new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" }); }

export default function DailyPracticePage({ user, sessions = [] }) {
  const profile = normalizeProfile(user);
  const [state, setState] = useState(loadPracticeState);
  const [view, setView] = useState("home");
  const [taskIndex, setTaskIndex] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [remotePlan, setRemotePlan] = useState(null);
  const key = todayKey();
  const storedPlan = state.dailyPlans[key];
  const plan = remotePlan || storedPlan || buildDailyPlan({ profile, performance: state.performance, history: state.history });
  const activeTask = plan.tasks[taskIndex] || plan.tasks[0];
  const question = activeTask ? activeTask.question || validQuestions().find(item => item.id === activeTask.questionId) : null;
  useEffect(() => { if (!storedPlan) apiRequest("/api/practice/plan").then(data => setRemotePlan(data)).catch(() => null); }, [key, storedPlan]);
  useEffect(() => { if (!storedPlan && !remotePlan) { setState(current => savePracticeState({ ...current, dailyPlans: { ...current.dailyPlans, [key]: plan } })); apiRequest("/api/practice/sessions", { method: "POST", body: JSON.stringify({ date: key, goalCount: plan.goalCount, tasks: plan.tasks, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) }).then(({ session }) => setState(current => savePracticeState({ ...current, dailyPlans: { ...current.dailyPlans, [key]: { ...plan, serverSessionId: session._id } } }))).catch(() => null); } }, [key, plan, storedPlan, remotePlan]);
  useEffect(() => { const onOnline = () => setOffline(false); const onOffline = () => setOffline(true); window.addEventListener("online", onOnline); window.addEventListener("offline", onOffline); return () => { window.removeEventListener("online", onOnline); window.removeEventListener("offline", onOffline); }; }, []);
  const update = next => setState(current => { const saved = savePracticeState(next); return saved; });
  const startTask = task => { const index = plan.tasks.findIndex(item => item.id === task.id); setTaskIndex(Math.max(index, 0)); setFeedback(null); setView("question"); };
  const submit = async answer => {
    const correct = question.type === "mcq" || question.type === "aptitude" ? answer === question.correctAnswer : answer.trim().split(/\s+/).filter(Boolean).length >= 5;
    const dailyGoalComplete = plan.completedCount + (activeTask.status === "complete" ? 0 : 1) >= plan.goalCount;
    const nextState = applyCompletion(state, { questionId: question.id, topic: question.topic, correct, taskId: activeTask.id, xp: correct ? question.xp : Math.round(question.xp / 2), dailyGoalComplete });
    const nextPlan = { ...plan, completedCount: Math.min(plan.goalCount, plan.completedCount + (activeTask.status === "complete" ? 0 : 1)), xpEarned: plan.xpEarned + (correct ? question.xp : Math.round(question.xp / 2)), tasks: plan.tasks.map(item => item.id === activeTask.id ? { ...item, status: "complete" } : item) };
    update({ ...nextState, dailyPlans: { ...nextState.dailyPlans, [key]: nextPlan } });
    try { let sessionId = plan.serverSessionId; if (!sessionId) { const created = await apiRequest("/api/practice/sessions", { method: "POST", body: JSON.stringify({ date: key, goalCount: plan.goalCount, tasks: nextPlan.tasks, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone }) }); sessionId = created.session._id; } await apiRequest("/api/practice/answers", { method: "POST", body: JSON.stringify({ sessionId, questionId: question.id, type: question.type, category: question.category, topic: question.topic, answer, correct, score: correct ? 100 : 0, xp: correct ? question.xp : Math.round(question.xp / 2), dailyGoalComplete }) }); } catch { /* local state remains available when the API is offline */ }
    setFeedback({ answer, question });
    setView("feedback");
  };
  const nextQuestion = () => { if (taskIndex + 1 < plan.tasks.length) { setTaskIndex(index => index + 1); setFeedback(null); setView("question"); } else setView("home"); };
  const trySimilar = () => { const similar = recommendQuestions({ profile, performance: state.performance, history: state.history, count: 5 }).find(item => item.topic === question.topic && item.id !== question.id); if (similar) { const nextTask = { ...activeTask, id: `similar-${similar.id}`, questionId: similar.id, status: "not_started" }; const nextPlan = { ...plan, tasks: [...plan.tasks.slice(0, taskIndex + 1), nextTask, ...plan.tasks.slice(taskIndex + 1)] }; update({ ...state, dailyPlans: { ...state.dailyPlans, [key]: nextPlan } }); setTaskIndex(index => index + 1); setFeedback(null); setView("question"); } };
  if (view === "question" && question) return <main className="daily-page"><PracticeQuestion question={question} number={taskIndex + 1} total={plan.tasks.length} onSubmit={submit} onExit={() => setView("home")} /></main>;
  if (view === "feedback" && feedback) return <main className="daily-page"><AnswerFeedback question={feedback.question} answer={feedback.answer} onNext={nextQuestion} onSimilar={trySimilar} /></main>;
  const completed = plan.completedCount;
  const accuracyTopics = state.performance.accuracyByTopic || {};
  const weakestTopic = Object.keys(accuracyTopics).sort((a, b) => accuracyTopics[a] - accuracyTopics[b])[0] || "recent topics";
  const insight = state.history.length ? `Your ${weakestTopic} practice is the best place to build momentum today.` : `We'll start with a short ${profile.role} baseline, then tune your plan from your answers.`;
  return <main className="daily-page"><header className="daily-hero"><div><p className="daily-eyebrow">Daily practice · {dateLabel()}</p><h1>Build your edge, {profile.name.split(" ")[0]}.</h1><p className="daily-subtitle">A focused {profile.role} routine, shaped by what you've practiced and where you want to go.</p></div><div className="streak-chip"><Flame size={18} /><strong>{state.performance.streak || 0}</strong><span>day streak</span></div></header>{offline && <div className="offline-banner" role="status">You're offline. Your answers will stay on this device and sync when you reconnect.</div>}<StreakTracker performance={state.performance} completed={completed} goal={plan.goalCount} /><section className={`daily-focus ${completed === plan.goalCount ? "goal-celebration" : ""}`}><div><p className="daily-eyebrow">Today's signal</p><h2>{insight}</h2><p>Recommendations use your role, level, skills, interview history, and practice answers. Nothing is counted until you submit.</p></div><button className="daily-primary-button" onClick={() => startTask(plan.tasks.find(task => task.status !== "complete") || plan.tasks[0])}><Sparkles size={17} />{completed ? "Continue today's practice" : "Start today's practice"}<span>→</span></button></section><div className="daily-progress-row"><div><span>Daily goal</span><strong>{completed} of {plan.goalCount} tasks complete</strong></div><div className="daily-progress-bar"><i style={{ width: `${plan.goalCount ? completed / plan.goalCount * 100 : 0}%` }} /></div>{completed === plan.goalCount && <span className="goal-complete"><CheckCircle size={15} /> Goal complete</span>}</div><DailyPlan plan={plan} onStart={startTask} activeTaskId={activeTask?.id} /><div className="daily-columns"><ReviewQueue items={state.performance.reviewLater} onReview={item => { const reviewTask = plan.tasks.find(task => task.questionId === item.questionId); if (reviewTask) startTask(reviewTask); }} /><TopicAnalytics accuracyByTopic={state.performance.accuracyByTopic} history={state.history} /></div><section className="daily-history"><div><p className="daily-eyebrow">Weekly challenge</p><h2>{sessions.length ? "Turn interview feedback into practice reps." : "Your first week starts with evidence."}</h2><p>{sessions.length ? `${sessions.length} interview session${sessions.length === 1 ? " is" : "s are"} available as context for your next recommendation.` : "Complete a task to unlock topic trends, milestones, and a meaningful weekly challenge."}</p></div><div className="history-badge"><Award size={20} /><span>{state.history.length} real answers logged</span></div></section><button className="quiet-button reset-practice" onClick={() => { update({ dailyPlans: {}, history: [], performance: { streak: 0, longestStreak: 0, xp: 0, accuracyByTopic: {}, reviewLater: [] } }); setView("home"); }}><RotateCcw size={13} /> Reset local practice data</button></main>;
}