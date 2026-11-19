const KEY = "ih_daily_practice_v2";

export const emptyPracticeState = { dailyPlans: {}, history: [], performance: { streak: 0, longestStreak: 0, xp: 0, accuracyByTopic: {}, reviewLater: [] } };

export function loadPracticeState() {
  try { return { ...emptyPracticeState, ...JSON.parse(localStorage.getItem(KEY) || "{}") }; } catch { return emptyPracticeState; }
}

export function savePracticeState(state) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* offline/private storage is still a usable session */ }
  return state;
}

export function todayKey(date = new Date()) { return date.toLocaleDateString("en-CA"); }

export function dateKeyOffset(date, offset) {
  const value = new Date(date);
  value.setDate(value.getDate() + offset);
  return todayKey(value);
}

export function applyCompletion(state, { date = new Date(), questionId, topic, correct, taskId, xp = 0, dailyGoalComplete = false } = {}) {
  const key = todayKey(date);
  const existing = state.history.find(item => item.questionId === questionId && item.date === key);
  if (existing) return state;
  const history = [...state.history, { id: `${questionId}-${key}`, date: key, questionId, topic, correct, taskId, xp, dailyGoalComplete: Boolean(dailyGoalComplete) }];
  const previousDay = dateKeyOffset(date, -1);
  const goalComplete = Boolean(dailyGoalComplete);
  const practicedYesterday = state.history.some(item => item.date === previousDay && item.dailyGoalComplete);
  const practicedTodayBefore = state.history.some(item => item.date === key && item.dailyGoalComplete);
  const streak = !goalComplete || practicedTodayBefore ? state.performance.streak : practicedYesterday ? state.performance.streak + 1 : 1;
  const topicHistory = history.filter(item => item.topic === topic);
  const accuracyByTopic = { ...state.performance.accuracyByTopic, [topic]: Math.round(topicHistory.filter(item => item.correct).length / topicHistory.length * 100) };
  const reviewLater = correct ? state.performance.reviewLater.filter(item => item.questionId !== questionId) : [...state.performance.reviewLater.filter(item => item.questionId !== questionId), { questionId, topic, addedAt: key }];
  return { ...state, history, performance: { ...state.performance, streak, longestStreak: Math.max(state.performance.longestStreak, streak), xp: state.performance.xp + (Number(xp) || 0), accuracyByTopic, reviewLater } };
}